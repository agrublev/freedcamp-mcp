import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

// ── Real end-to-end over stdio: the production boot path ────────────────────
// Spawns `node index.js` exactly the way MCP clients (Claude Desktop, etc.)
// do, with dummy credentials. initialize() fails against the real API
// non-fatally (HMAC fallback), then listTools + a session-only tool must work.

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

test("server boots over stdio, lists its tools, and serves a session-only call", { timeout: 20_000 }, async () => {
    const transport = new StdioClientTransport({
        command: process.execPath, // the same node running the tests
        args: [path.join(root, "index.js")],
        env: {
            ...process.env,
            FREEDCAMP_API_KEY: "dummy-key",
            FREEDCAMP_API_SECRET: "dummy-secret"
        },
        stderr: "pipe"
    });

    const client = new Client({ name: "stdio-e2e", version: "1.0.0" }, { capabilities: {} });
    try {
        await client.connect(transport);
        const tools = await client.listTools();
        assert.equal(tools.tools.length >= 100, true, `expected the full registry, got ${tools.tools.length}`);

        // Session-only helper: works with an empty session (no API call needed).
        const result = await client.callTool({ name: "fc_get_groups_projects", arguments: {} });
        assert.ok(!result.isError);
        assert.deepEqual(result.structuredContent, { groups: [] });
    } finally {
        await client.close().catch(() => {});
    }
});
