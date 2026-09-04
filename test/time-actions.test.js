import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startMockApi } from "./helpers/mock-api.js";
import { startMcp, makeHandler } from "./helpers/mcp.js";

// ── fc_time_action / fc_add_time state-machine behaviors ────────────────────
// The Freedcamp API answers 200 OK even for no-op actions, so the handler
// compares entry state before/after and fails the call when nothing changed.
// These tests pin that contract through the full MCP path.

let api;
let mcp;

before(async () => {
    api = await startMockApi();
    mcp = await startMcp({ apiBaseUrl: api.url });
    await mcp.listTools();
});

after(async () => {
    await mcp.close();
    await api.stop();
});

// Mock entry helpers: GET /times/:id returns { data: { time } }, the action
// POST returns the updated entry, and _extractTimeEntry reads both shapes.
const setEntry = (entry) => api.setTimeEntry(entry);

describe("no-op detection (isError:true, never a false success)", () => {
    test("start on an already-running timer → isError with structured entry state", async () => {
        api.reset();
        setEntry({ started_ts: 1700000123, status: 0 });
        const result = await mcp.callRaw("fc_time_action", { time_id: "t1", action: "start" });
        assert.equal(result.isError, true);
        assert.match(result.content[0].text, /already running before 'start'/);
        assert.deepEqual(result.structuredContent, {
            error: result.content[0].text,
            time_id: "t1",
            action: "start",
            entry: { started_ts: 1700000123, status: 0 }
        });
    });

    test("stop on a non-running timer → isError", async () => {
        api.reset();
        setEntry({ started_ts: null, status: 0 });
        const result = await mcp.callRaw("fc_time_action", { time_id: "t1", action: "stop" });
        assert.equal(result.isError, true);
        assert.match(result.content[0].text, /not running before 'stop'/);
    });

    test("bill on an already-billed entry → isError", async () => {
        api.reset();
        setEntry({ started_ts: null, status: 1 });
        const result = await mcp.callRaw("fc_time_action", { time_id: "t1", action: "bill" });
        assert.equal(result.isError, true);
        assert.match(result.content[0].text, /already billed before 'bill'/);
    });

    test("unbill on a non-billed entry (status 0) → isError", async () => {
        api.reset();
        setEntry({ started_ts: null, status: 0 });
        const result = await mcp.callRaw("fc_time_action", { time_id: "t1", action: "unbill" });
        assert.equal(result.isError, true);
        assert.match(result.content[0].text, /not billed before 'unbill'/);
    });

    test("bill confirmed by the POST response even if the pre-GET fails", async () => {
        api.reset();
        // Pre-GET 404s (best-effort); the action POST still succeeds and reports.
        api.setHandler((info) => {
            if (info.method === "GET" && info.path === "/times/t1") {
                return { status: 404, body: { msg: "gone" } };
            }
            return undefined;
        });
        setEntry({ started_ts: null, status: 0 });
        const result = await mcp.callRaw("fc_time_action", { time_id: "t1", action: "bill" });
        api.setHandler(null);
        assert.ok(!result.isError, `bill must succeed on post-action evidence: ${result.content?.[0]?.text}`);
        assert.equal(result.structuredContent.data.time.status, 1);
    });
});

describe("successful actions return the raw envelope", () => {
    test("start on a stopped timer succeeds and the timer runs", async () => {
        api.reset();
        setEntry({ started_ts: null, status: 0 });
        const result = await mcp.call("fc_time_action", { time_id: "t1", action: "start" });
        assert.equal(result.structuredContent.data.time.started_ts, 1700000123);
    });

    test("start when the POST response has started_ts still null → isError (API noop)", async () => {
        api.reset();
        // The action endpoint echoes the entry unchanged (timer did not start).
        api.setHandler((info) => {
            if (info.method === "POST" && info.body?.action === "start") {
                return { body: { data: { time: { started_ts: null, status: 0 } }, msg: "OK" } };
            }
            return undefined;
        });
        setEntry({ started_ts: null, status: 0 });
        const result = await mcp.callRaw("fc_time_action", { time_id: "t1", action: "start" });
        api.setHandler(null);
        assert.equal(result.isError, true);
        assert.match(result.content[0].text, /did not start/);
    });
});

describe("fc_add_time", () => {
    test("f_started=1 with a confirmed started_ts succeeds", async () => {
        api.reset();
        const result = await mcp.call("fc_add_time", {
            project_id: "77",
            description: "Work",
            date: "2026-01-01",
            minutes_count: 60,
            f_started: true
        });
        const req = api.requests.find((r) => r.method === "POST" && r.path === "/times");
        assert.equal(req.body.f_started, 1, "BoolFlag normalizes true → 1");
        assert.equal(req.body.assigned_to_id, "111", "defaults to the session user");
    });

    test("f_started=1 but API returns started_ts null → isError, not a false success", async () => {
        api.reset();
        api.setHandler((info) => {
            if (info.method === "POST" && info.path === "/times") {
                return { body: { data: { time: { started_ts: null } }, msg: "OK" } };
            }
            return undefined;
        });
        const result = await mcp.callRaw("fc_add_time", {
            project_id: "77",
            description: "Work",
            date: "2026-01-01",
            minutes_count: 60,
            f_started: true
        });
        api.setHandler(null);
        assert.equal(result.isError, true);
        assert.match(result.content[0].text, /timer did not start/);
        assert.equal(result.structuredContent.action, "start");
    });

    test("assigned_to_id omitted and no session user → clear error before any POST", async () => {
        // Point at a dead port: the session fetch fails, userId stays unknown,
        // and addTime must fail loudly instead of silently assigning "everyone".
        const fc = makeHandler("http://127.0.0.1:1");
        await assert.rejects(
            () => fc.addTime({ project_id: "77", date: "2026-01-01", minutes_count: 30 }),
            (err) => {
                assert.match(err.message, /requires assigned_to_id/);
                return true;
            }
        );
    });
});
