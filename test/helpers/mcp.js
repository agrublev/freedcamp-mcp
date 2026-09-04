import assert from "node:assert/strict";
import FreedcampHandler from "../../operations/fc-handler.js";
import { buildServer } from "../../index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

// ── MCP test harness ────────────────────────────────────────────────────────
// Spins up a real SDK Client ↔ Server pair over the in-memory transport and
// points the FreedcampHandler at the given mock API base URL, so every test
// exercises the full path: client request → zod parse → handler → HTTP →
// response → ok() envelope → client-side outputSchema validation.

export async function startMcp({
    apiBaseUrl,
    apiKey = "test-key",
    apiSecret = "test-secret",
    initialize = true
} = {}) {
    const fc = new FreedcampHandler(apiKey, apiSecret, apiBaseUrl, { sessionFilePath: null });
    if (initialize) await fc.initialize();

    const server = buildServer(fc);
    const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    return {
        fc,
        client,
        server,
        listTools() {
            return client.listTools();
        },
        async call(name, args = {}) {
            const result = await client.callTool({ name, arguments: args });
            assert.ok(!result.isError, `tool ${name} returned isError: ${result.content?.[0]?.text}`);
            return result;
        },
        async callRaw(name, args = {}) {
            return client.callTool({ name, arguments: args });
        },
        async close() {
            await Promise.allSettled([client.close(), server.close()]);
        }
    };
}

// Tests that need raw handler access without the MCP layer.
export function makeHandler(apiBaseUrl, { apiKey = "test-key", apiSecret = "test-secret" } = {}) {
    return new FreedcampHandler(apiKey, apiSecret, apiBaseUrl, { sessionFilePath: null });
}

/** Text content must be a JSON serialization of structuredContent. */
export function assertEnvelopeOk(result) {
    assert.equal(result.content?.[0]?.type, "text");
    assert.ok("structuredContent" in result, "expected structuredContent on the result");
    const parsed = JSON.parse(result.content[0].text);
    assert.deepEqual(parsed, result.structuredContent, "text content and structuredContent must agree");
    return parsed;
}
