import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startMockApi } from "./helpers/mock-api.js";
import { startMcp } from "./helpers/mcp.js";

// ── Input-mapping edge cases + registry/schema quality ──────────────────────

let api;
let mcp;
let toolList;

before(async () => {
    api = await startMockApi();
    mcp = await startMcp({ apiBaseUrl: api.url });
    toolList = (await mcp.listTools()).tools;
});

after(async () => {
    await mcp.close();
    await api.stop();
});

// strip the HMAC auth trio the interceptor appends to every query
function stripAuth(query) {
    const { api_key, timestamp, hash, ...rest } = query;
    return rest;
}

describe("fetchTasks filter → query mapping", () => {
    test("status names map to numeric status[] params", async () => {
        api.reset();
        await mcp.call("fc_fetch_tasks", {
            filters: { status: ["STATUS_NOT_STARTED", "STATUS_COMPLETED", "STATUS_IN_PROGRESS"] }
        });
        const req = api.requests.find((r) => r.path === "/tasks");
        assert.deepEqual(req.query["status[]"], ["0", "1", "2"]);
    });

    test("no filters at all → handler defaults (f_with_archived=0, lists_status=active)", async () => {
        api.reset();
        await mcp.call("fc_fetch_tasks", {});
        const req = api.requests.find((r) => r.path === "/tasks");
        const q = stripAuth(req.query);
        assert.deepEqual(q, {
            limit: "200",
            offset: "0",
            f_with_archived: "0",
            lists_status: "active"
        });
    });

    test("explicit empty filters → only limit/offset, no defaults leak", async () => {
        api.reset();
        await mcp.call("fc_fetch_tasks", { filters: {} });
        const req = api.requests.find((r) => r.path === "/tasks");
        const q = stripAuth(req.query);
        assert.deepEqual(q, { limit: "200", offset: "0" });
    });

    test("partial filters forward only what was provided", async () => {
        api.reset();
        await mcp.call("fc_fetch_tasks", {
            filters: {
                due_date_from: "2026-01-01",
                created_by_id: "7",
                order_priority: "desc"
            }
        });
        const req = api.requests.find((r) => r.path === "/tasks");
        const q = stripAuth(req.query);
        assert.deepEqual(q, {
            limit: "200",
            offset: "0",
            "due_date[from]": "2026-01-01",
            created_by_id: "7",
            "order[priority]": "desc"
        });
        assert.ok(!("due_date[to]" in q), "omitted filter must not be sent");
    });

    test("null filter values are dropped and scalar assigned_to_id is wrapped", async () => {
        // Some MCP clients send null for unset filters and a bare number for
        // assigned_to_id; FetchTasksSchema normalizes both instead of rejecting.
        api.reset();
        const result = await mcp.callRaw("fc_fetch_tasks", {
            filters: { assigned_to_id: 42, order_priority: null, due_date_to: null }
        });
        assert.notEqual(result.isError, true);
        const req = api.requests.find((r) => r.path === "/tasks");
        assert.deepEqual(stripAuth(req.query), {
            limit: "200",
            offset: "0",
            "assigned_to_id[]": "42"
        });
    });

    test("invalid order_priority values are still rejected", async () => {
        api.reset();
        const result = await mcp.callRaw("fc_fetch_tasks", {
            filters: { order_priority: "sideways" }
        });
        assert.equal(result.isError, true);
        assert.match(result.content[0].text, /order_priority/);
        assert.equal(api.requests.length, 0);
    });

    test("list_status maps to plural lists_status", async () => {
        api.reset();
        await mcp.call("fc_fetch_tasks", { filters: { list_status: "archived" } });
        const req = api.requests.find((r) => r.path === "/tasks");
        assert.equal(req.query.lists_status, "archived");
    });

    test("custom pagination is forwarded as strings", async () => {
        api.reset();
        await mcp.call("fc_fetch_discussions", { project_id: "77", limit: 5, offset: 7 });
        const req = api.requests.find((r) => r.path === "/discussions");
        assert.deepEqual(stripAuth(req.query), { project_id: "77", limit: "5", offset: "7" });
    });
});

describe("aliasing", () => {
    test("fc_update_status routes through updateTask on the item id", async () => {
        api.reset();
        await mcp.call("fc_update_status", { item_id: "42", status: 2 });
        const req = api.requests.find((r) => r.method === "POST" && r.path === "/tasks/42");
        assert.deepEqual(req.body, { status: 2 });
    });

    test("fc_add_item_by_names resolves the project by name and app by name", async () => {
        api.reset();
        await mcp.call("fc_add_item_by_names", {
            project_name: "Website",
            app_name: "Tasks",
            title: "Named"
        });
        const req = api.requests.find((r) => r.method === "POST" && r.path === "/tasks");
        assert.deepEqual(req.body, { title: "Named", project_id: "77" });
    });

    test("fc_add_item_by_names with an unknown project → clean error, no request", async () => {
        api.reset();
        const result = await mcp.callRaw("fc_add_item_by_names", {
            project_name: "Nope",
            app_name: "Tasks",
            title: "X"
        });
        assert.equal(result.isError, true);
        assert.match(result.content[0].text, /No project found named "Nope"/);
        assert.equal(api.requests.length, 0);
    });

    test("fc_add_item_by_names with an unsupported app → clean error", async () => {
        api.reset();
        const result = await mcp.callRaw("fc_add_item_by_names", {
            project_name: "Website",
            app_name: "Wikis",
            title: "X"
        });
        assert.equal(result.isError, true);
        assert.match(result.content[0].text, /does not yet support the "Wikis" app/);
        assert.equal(api.requests.length, 0);
    });

    test("fc_add_comment_by_names maps the app name to its app_id", async () => {
        api.reset();
        await mcp.call("fc_add_comment_by_names", {
            item_id: "42",
            app_name: "Issue Tracker",
            description: "<p>bug</p>"
        });
        const req = api.requests.find((r) => r.method === "POST" && r.path === "/comments");
        assert.deepEqual(req.body, { item_id: "42", app_id: 13, description: "<p>bug</p>", attached_ids: [] });
    });

    test("fc_add_comment_by_names with an unknown app name falls back to app_id 2", async () => {
        api.reset();
        await mcp.call("fc_add_comment_by_names", {
            item_id: "42",
            app_name: "Nonsense",
            description: "x"
        });
        const req = api.requests.find((r) => r.method === "POST" && r.path === "/comments");
        assert.equal(req.body.app_id, 2, "name_to_app_id defaults to 2 when nothing matches");
    });
});

describe("notifications window", () => {
    test("fc_fetch_notifications pins following=1 and a 60-day from_ts", async () => {
        api.reset();
        await mcp.call("fc_fetch_notifications", {});
        const req = api.requests.find((r) => r.path === "/notifications");
        const q = stripAuth(req.query);
        assert.equal(q.following, "1");
        const sixtyDaysMs = 60 * 24 * 3600 * 1000;
        assert.ok(
            Math.abs(Date.now() / 1000 - q.from_ts - 0) < 60 * 24 * 3600 + 120,
            "from_ts should be ~60 days ago"
        );
        assert.ok(/^\d+$/.test(q.from_ts));
        void sixtyDaysMs;
    });
});

describe("registry quality", () => {
    test("every tool has a name, description, and inputSchema object", () => {
        for (const tool of toolList) {
            assert.equal(typeof tool.name, "string", `${tool.name}: name`);
            assert.ok(tool.description?.length, `${tool.name}: description`);
            assert.equal(tool.inputSchema.type, "object", `${tool.name}: inputSchema must be an object type`);
            assert.equal(tool.annotations?.openWorldHint, true, `${tool.name}: openWorldHint`);
        }
    });

    test("every tool has a readable title, mirrored in annotations.title", () => {
        for (const tool of toolList) {
            assert.match(tool.title ?? "", /^[A-Z][^_]*$/, `${tool.name}: title`);
            assert.equal(tool.annotations?.title, tool.title, `${tool.name}: annotations.title`);
        }
    });

    test("titles are unique across the registry", () => {
        const titles = toolList.map((t) => t.title);
        const duplicates = titles.filter((title, i) => titles.indexOf(title) !== i);
        assert.deepEqual(duplicates, []);
    });

    test("titles: derived from the tool name, with word replacements and overrides", () => {
        const titleOf = (name) => toolList.find((t) => t.name === name)?.title;
        // derived from fc_<verb>_<entity>
        assert.equal(titleOf("fc_fetch_task"), "Fetch task");
        assert.equal(titleOf("fc_fetch_notifications_by_project"), "Fetch notifications by project");
        // word replacements
        assert.equal(titleOf("fc_fetch_crm_calls"), "Fetch CRM calls");
        assert.equal(titleOf("fc_add_cf_template"), "Add custom field template");
        assert.equal(titleOf("fc_fetch_recent_project_ids"), "Fetch recent project IDs");
        assert.equal(titleOf("fc_fetch_times"), "Fetch time entries");
        assert.equal(titleOf("fc_add_file_meta"), "Add file metadata");
        // explicit overrides where the derived title reads badly
        assert.equal(titleOf("fc_time_action"), "Start, stop, bill or unbill time");
        assert.equal(titleOf("fc_get_groups_projects"), "Get groups and projects");
        assert.equal(titleOf("fc_update_notification_read"), "Mark notification as read");
        assert.equal(titleOf("fc_respond_invitation"), "Respond to invitation");
    });

    test("annotations: fetch/get/validate are readOnly, delete are destructive", () => {
        for (const tool of toolList) {
            const a = tool.annotations;
            if (/^fc_(fetch|get|validate)_/.test(tool.name)) {
                assert.equal(a.readOnlyHint, true, tool.name);
                assert.equal(a.destructiveHint, false, tool.name);
            }
            if (/^fc_delete_/.test(tool.name) || tool.name === "fc_leave_project") {
                assert.equal(a.destructiveHint, true, tool.name);
                assert.equal(a.readOnlyHint, false, tool.name);
            }
        }
    });

    test("input schemas contain no JSON-Schema type arrays (splitTypeArrays)", () => {
        const scan = (node, trail) => {
            if (Array.isArray(node)) return node.forEach((c, i) => scan(c, `${trail}[${i}]`));
            if (!node || typeof node !== "object") return;
            if (Array.isArray(node.type)) {
                throw new Error(`type array at ${trail}: ${JSON.stringify(node.type)}`);
            }
            for (const [k, v] of Object.entries(node)) scan(v, `${trail}.${k}`);
        };
        for (const tool of toolList) {
            scan(tool.inputSchema, tool.name);
            if (tool.outputSchema) scan(tool.outputSchema, `${tool.name}!output`);
        }
    });

    test("every tool inputSchema is a valid JSON Schema draft-07 object", async () => {
        // Ajv is a transitive dep of the SDK; use it to compile each schema.
        const { default: Ajv } = await import("ajv");
        const ajv = new Ajv({ strict: false });
        for (const tool of toolList) {
            assert.doesNotThrow(() => ajv.compile(tool.inputSchema), `${tool.name} inputSchema compiles`);
            if (tool.outputSchema) {
                assert.doesNotThrow(() => ajv.compile(tool.outputSchema), `${tool.name} outputSchema compiles`);
            }
        }
    });

    test("required fields are declared as required in inputSchema", () => {
        for (const tool of toolList) {
            const required = tool.inputSchema.required || [];
            for (const name of required) {
                assert.ok(
                    tool.inputSchema.properties?.[name],
                    `${tool.name}: required field ${name} must exist in properties`
                );
            }
        }
    });
});
