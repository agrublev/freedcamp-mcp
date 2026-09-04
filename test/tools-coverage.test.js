import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startMockApi } from "./helpers/mock-api.js";
import { startMcp, assertEnvelopeOk } from "./helpers/mcp.js";
import { COVERAGE } from "./tools-coverage.data.js";

// ── Data-driven coverage of every registered MCP tool ─────────────────────
// Each row drives a real client → server → handler → mock HTTP round-trip and
// asserts the REST endpoint, method, query, body (input format), and the
// structuredContent (output format; the SDK client additionally validates it
// against each tool's declared outputSchema).

let api;
let mcp;

before(async () => {
    api = await startMockApi();
    mcp = await startMcp({ apiBaseUrl: api.url });
    await mcp.listTools(); // caches outputSchema validators on the client
});

after(async () => {
    await mcp.close();
    await api.stop();
});

test("coverage table lists every tool exactly the registry does", async () => {
    const registry = (await mcp.listTools()).tools.map((t) => t.name);
    const expected = [...new Set(COVERAGE.map((row) => row.tool))];

    const missing = expected.filter((name) => !registry.includes(name));
    const extra = registry.filter((name) => !expected.includes(name));

    assert.deepEqual(
        { missing, extra },
        { missing: [], extra: [] },
        "COVERAGE table and server registry must stay in 1:1 sync"
    );
});

// One test per row (subtests report individually and failures don't halt the suite).
for (const row of COVERAGE) {
    test(`fc tool ${row.tool}`, async () => {
        // The session fetched during initialize() is one request; clear it so
        // request assertions only see this call's traffic.
        api.reset();
        if (row.entry) api.setTimeEntry(row.entry);

        if (row.respond) {
            api.setHandler(() => ({ body: row.respond }));
        }

        const result = await mcp.call(row.tool, row.args);

        if (row.noApi) {
            assert.equal(api.requests.length, 0, "expected no HTTP traffic");
        } else {
            assert.ok(api.requests.length >= 1, `expected an HTTP request for ${row.tool}`);
        }

        if (row.path !== undefined) {
            const expectedMethod = row.method || "GET";
            const reqs = api.requests.filter(
                (r) =>
                    (row.path instanceof RegExp ? row.path.test(r.path) : r.path === row.path) &&
                    r.method === expectedMethod
            );
            assert.ok(reqs.length >= 1, `no ${expectedMethod} to ${row.path} (got ${api.requests.map((r) => r.method + " " + r.path).join(", ") || "none"})`);
            const req = reqs[0];
            if (row.query !== undefined) assert.deepEqual(req.query, row.query);
            if (row.body !== undefined) assert.deepEqual(req.body, row.body);
            if (row.form) assert.deepEqual(
                Object.keys(req.body).filter((k) => k !== "file"),
                row.form,
                "multipart metadata fields"
            );
        }

        // Output format: text content is the JSON serialization of structuredContent.
        assertEnvelopeOk(result);

        if (row.check) row.check(result, mcp, api);
    });
}

// ── Input validation: malformed input must fail cleanly (and hit no API) ────
describe("input rejection", () => {
    const cases = [
        { tool: "fc_fetch_task", args: {} }, // missing required task_id
        { tool: "fc_add_task", args: { project_id: "77" } }, // missing title
        { tool: "fc_delete_task", args: {} },
        { tool: "fc_add_time", args: { project_id: "77", date: "2026-01-01" } }, // missing minutes_count
        { tool: "fc_time_action", args: { time_id: "t1", action: "bogus" } }, // invalid enum
        { tool: "fc_batch_edit_tasks", args: { batch_ids: [] } }, // min(1)
        { tool: "fc_register_user", args: { email: "not-an-email", password: "x", first_name: "A", last_name: "B" } },
        { tool: "fc_upload_file", args: { filename: "x" } } // refine: file_path or content_base64
    ];

    for (const { tool, args } of cases) {
        test(`${tool} rejects invalid input without calling the API`, async () => {
            api.reset();
            const result = await mcp.callRaw(tool, args);
            assert.equal(result.isError, true, `expected isError for ${JSON.stringify(args)}`);
            assert.ok(
                result.content[0].text.startsWith("Invalid input for"),
                `expected zod message, got: ${result.content[0].text}`
            );
            if (result.structuredContent) assert.fail("error results must not carry structuredContent");
            assert.equal(api.requests.length, 0, "no HTTP request may be made for invalid input");
        });
    }
});

// ── API error propagation: non-2xx responses become isError:true results ───
describe("API error propagation", () => {
    test("HTTP 404 becomes an isError result with the described error", async () => {
        api.reset();
        api.setHandler(() => ({ status: 404, body: { msg: "Not found", status: "error" } }));
        const result = await mcp.callRaw("fc_fetch_task", { task_id: "42" });
        assert.equal(result.isError, true);
        assert.match(result.content[0].text, /GET \/tasks\/42 failed \(HTTP 404\)/);
        assert.match(result.content[0].text, /not found — verify the ID exists/);
        api.setHandler(null);
    });

    test("HTTP 403 includes the permission hint", async () => {
        api.reset();
        api.setHandler(() => ({ status: 403, body: { msg: "nope", status: "error" } }));
        const result = await mcp.callRaw("fc_fetch_task", { task_id: "42" });
        assert.equal(result.isError, true);
        assert.match(result.content[0].text, /permission denied/);
        api.setHandler(null);
    });
});
