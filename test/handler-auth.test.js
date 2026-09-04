import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { startMockApi } from "./helpers/mock-api.js";
import { makeHandler, startMcp } from "./helpers/mcp.js";

// ── Auth, session, retry, and error-formatting behaviors ────────────────────

describe("HMAC request signing", () => {
    test("every request without a session carries api_key, timestamp, and a valid HMAC-SHA1 hash", async () => {
        const api = await startMockApi();
        try {
            const fc = makeHandler(api.url, { apiKey: "key1", apiSecret: "secret1" });
            // Deliberately no initialize() — session stays null so requests use HMAC.
            await fc.fetchProjects();

            const req = api.requests.at(-1);
            assert.ok(req.query.api_key === "key1");
            assert.ok(/^\d+$/.test(req.query.timestamp), "timestamp must be numeric");

            const expected = crypto
                .createHmac("sha1", "secret1")
                .update("key1" + req.query.timestamp)
                .digest("hex");
            assert.equal(req.query.hash, expected, "HMAC-SHA1(apiKey + timestamp, apiSecret)");
        } finally {
            await api.stop();
        }
    });
});

describe("session token auth", () => {
    test("initialize() fetches the session, then requests switch to token headers", async () => {
        const api = await startMockApi();
        try {
            const fc = makeHandler(api.url);
            await fc.initialize();

            const sessionReq = api.requests[0];
            assert.equal(sessionReq.path, "/sessions/current");
            assert.ok(!sessionReq.headers["x-freedcamp-api-token"], "session fetch itself is HMAC-signed");

            await fc.fetchProjects();
            const req = api.requests.at(-1);
            assert.equal(req.headers["x-freedcamp-api-token"], "tok-123");
            assert.equal(req.headers["x-freedcamp-user-id"], "111");
            assert.ok(!("api_key" in req.query), "HMAC query params must be dropped once the session token is active");
        } finally {
            await api.stop();
        }
    });

    test("401 with a live session token triggers refresh + exactly one retry", async () => {
        const api = await startMockApi();
        try {
            let projectCalls = 0;
            let sessionCalls = 0;

            const fc = makeHandler(api.url);
            await fc.initialize();
            const initialized = api.requests.filter((r) => r.path === "/sessions/current").length;
            assert.equal(initialized, 1);

            api.setHandler((info) => {
                if (info.path === "/projects") {
                    projectCalls += 1;
                    return { status: projectCalls === 1 ? 401 : 200, body: { data: { ok: true }, msg: "OK" } };
                }
                if (info.path === "/sessions/current") {
                    sessionCalls += 1;
                }
                return undefined;
            });

            const res = await fc.fetchProjects();
            assert.deepEqual(res, { data: { ok: true }, msg: "OK" });
            assert.equal(projectCalls, 2, "original + retried request");
            assert.equal(sessionCalls, 1, "one fresh session fetch on 401");
        } finally {
            api.setHandler(null);
            await api.stop();
        }
    });
});

describe("rate limiting (429)", () => {
    test("429 responses are retried with backoff, honoring Retry-After", { timeout: 10_000 }, async () => {
        const api = await startMockApi();
        try {
            let calls = 0;
            api.setHandler((info) => {
                if (info.path === "/projects") {
                    calls += 1;
                    if (calls <= 2) return { status: 429, headers: { "retry-after": "0" }, body: { msg: "slow down" } };
                    return undefined;
                }
                return undefined;
            });

            const fc = makeHandler(api.url);
            const t0 = Date.now();
            const res = await fc.fetchProjects();
            const elapsed = Date.now() - t0;

            assert.equal(calls, 3, "two 429s then success");
            assert.ok(elapsed < 3000, `Retry-After: 0 must not sleep long (${elapsed}ms)`);
            assert.ok(res.data.ok);
        } finally {
            api.setHandler(null);
            await api.stop();
        }
    });

    test("after 4 retries the 429 error is surfaced with the rate-limit hint", { timeout: 60_000 }, async () => {
        const api = await startMockApi();
        try {
            api.setHandler((info) =>
                info.path === "/projects" ? { status: 429, headers: { "retry-after": "0" }, body: { msg: "nope" } } : undefined
            );
            const fc = makeHandler(api.url);
            await assert.rejects(
                () => fc.fetchProjects(),
                /rate limited — retries were exhausted/
            );
            assert.equal(api.requests.filter((r) => r.path === "/projects").length, 5);
        } finally {
            api.setHandler(null);
            await api.stop();
        }
    });
});

describe("error message formatting", () => {
    test("_describeError composes method, url, status, api msg, and hint", async () => {
        const api = await startMockApi();
        try {
            api.setHandler(() => ({ status: 404, body: { msg: "Not found", status: "error" } }));
            const fc = makeHandler(api.url);
            await assert.rejects(() => fc.fetchProject({ project_id: "77" }), (err) => {
                assert.ok(err.message.includes("GET /projects/77 failed (HTTP 404): Not found"), err.message);
                assert.match(err.message, /verify the ID exists/);
                return true;
            });
        } finally {
            api.setHandler(null);
            await api.stop();
        }
    });

    test("network failure (no response) falls back to the axios message with no hint", async () => {
        // A port with nothing listening: connection refused, no HTTP status.
        const fc = makeHandler("http://127.0.0.1:1");
        await assert.rejects(() => fc.fetchProjects(), (err) => {
            assert.ok(!/HTTP \d/.test(err.message), err.message);
            assert.ok(err.message.includes("GET /projects failed"), err.message);
            return true;
        });
    });

    test("5xx errors get the server-error hint", async () => {
        const api = await startMockApi();
        try {
            api.setHandler(() => ({ status: 503, body: { msg: "unavailable" } }));
            const fc = makeHandler(api.url);
            await assert.rejects(() => fc.fetchProjects(), /Freedcamp server error — retry later/);
        } finally {
            api.setHandler(null);
            await api.stop();
        }
    });
});

describe("null stripping", () => {
    test("request() drops null/undefined values from params and data", async () => {
        const api = await startMockApi();
        try {
            const fc = makeHandler(api.url);
            await fc.fetchIssues({ project_id: "77" }); // limit/offset defaults exist but project goes as param
            const req = api.requests.at(-1);
            // The request interceptor appends the HMAC auth trio to every query.
            const { api_key, timestamp, hash, ...query } = req.query;
            assert.ok(api_key && timestamp && hash, "HMAC auth params must be present");
            assert.deepEqual(query, { project_id: "77", limit: "200", offset: "0" });
        } finally {
            await api.stop();
        }
    });

    test("editTask with no fields sends an empty JSON object body", async () => {
        const api = await startMockApi();
        try {
            const fc = makeHandler(api.url);
            await fc.updateTask({ task_id: "42", title: null, priority: undefined });
            const req = api.requests.at(-1);
            assert.equal(req.method, "POST");
            assert.equal(req.path, "/tasks/42");
            assert.deepEqual(req.body, {});
        } finally {
            await api.stop();
        }
    });
});

describe("session persistence", () => {
    test("session is saved to and reloaded from the file when a path is given", async () => {
        const api = await startMockApi();
        const tmp = await import("node:fs/promises");
        const os = await import("node:os");
        const path = await import("node:path");
        const file = path.join(os.tmpdir(), `fc-test-session-${Date.now()}.json`);
        try {
            const { default: FreedcampHandler } = await import("../operations/fc-handler.js");
            const fc = new FreedcampHandler("k", "s", api.url, { sessionFilePath: file });
            await fc.initialize();
            assert.ok(JSON.parse(await tmp.readFile(file, "utf8")).sessionToken === "tok-123");

            // New handler reuses the saved session: no extra /sessions/current hit.
            const before = api.requests.filter((r) => r.path === "/sessions/current").length;
            const fc2 = new FreedcampHandler("k", "s", api.url, { sessionFilePath: file });
            await fc2.initialize();
            const after = api.requests.filter((r) => r.path === "/sessions/current").length;
            assert.equal(after, before, "saved session must be reused without refetch");
            assert.equal(fc2.getSession()?.user_id, "111");
        } finally {
            await tmp.rm(file, { force: true });
            await api.stop();
        }
    });
});
