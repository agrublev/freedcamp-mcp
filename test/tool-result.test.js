import { test } from "node:test";
import assert from "node:assert/strict";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { asStructuredContent, ok } from "../common/tool-result.js";
import { getGroupsAndProjects, GroupsProjectsOutputSchema } from "../operations/helpers.js";

test("asStructuredContent passes objects through", () => {
    const obj = { tasks: [{ id: "1" }], meta: { total: 1 } };
    assert.equal(asStructuredContent(obj), obj);
});

test("asStructuredContent wraps arrays as { items }", () => {
    const items = [{ id: "1" }, { id: "2" }];
    assert.deepEqual(asStructuredContent(items), { items });
});

test("asStructuredContent wraps scalars and null as { value }", () => {
    assert.deepEqual(asStructuredContent("ok"), { value: "ok" });
    assert.deepEqual(asStructuredContent(true), { value: true });
    assert.deepEqual(asStructuredContent(null), { value: null });
    assert.deepEqual(asStructuredContent(undefined), { value: null });
});

test("ok() result is a valid CallToolResult even when data is an array", () => {
    const result = ok([{ id: "1" }, { id: "2" }]);
    const parsed = CallToolResultSchema.parse(result);
    assert.deepEqual(parsed.structuredContent, { items: [{ id: "1" }, { id: "2" }] });
    assert.equal(parsed.content[0].type, "text");
    assert.match(parsed.content[0].text, /"items"/);
});

test("ok() result is a valid CallToolResult for object payloads", () => {
    const data = { data: { id: "1" }, msg: "OK", status: "success" };
    const parsed = CallToolResultSchema.parse(ok(data));
    assert.deepEqual(parsed.structuredContent, data);
});

test("raw array structuredContent is rejected by the MCP schema (the original bug)", () => {
    const bad = {
        content: [{ type: "text", text: "[]" }],
        structuredContent: []
    };
    assert.throws(() => CallToolResultSchema.parse(bad), /expected record, received array|Invalid input/i);
});

test("getGroupsAndProjects returns a { groups } object, not a top-level array", () => {
    const session = {
        groups: [
            {
                name: "Acme",
                group_id: "g1",
                applications: [2],
                projects: ["p1"]
            }
        ],
        projects: [{ id: "p1", project_name: "Website", applications: [2] }]
    };
    const result = getGroupsAndProjects(session);
    assert.ok(!Array.isArray(result));
    assert.equal(typeof result, "object");
    assert.ok(Array.isArray(result.groups));
    GroupsProjectsOutputSchema.parse(result);
    CallToolResultSchema.parse(ok(result));
});
