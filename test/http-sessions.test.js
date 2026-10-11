import { test, after } from "node:test";
import assert from "node:assert/strict";

process.env.PORT = "0";
process.env.HOST = "127.0.0.1";
process.env.OAUTH_TOKEN_SECRET = "test-secret";
process.env.MCP_SESSION_IDLE_MS = "1500";
process.env.MCP_SESSION_SWEEP_MS = "100";
process.env.MCP_STATS_INTERVAL_MS = "100000";

const { startHttpServer } = await import("../http.js");
const { FreedcampOAuthProvider } = await import("../oauth.js");
const { buildServer } = await import("../index.js");

const handlers = new Map();
const dropped = [];
const listener = await startHttpServer({
    buildServer,
    handlerForToken: (token) => {
        if (!handlers.has(token)) handlers.set(token, { apiKey: "k", apiSecret: "s" });
        return handlers.get(token);
    },
    dropHandlerForToken: (token) => {
        handlers.delete(token);
        dropped.push(token);
    },
    handlerCount: () => handlers.size
});
after(() => listener.close());

const base = `http://127.0.0.1:${listener.address().port}`;
const token = new FreedcampOAuthProvider({ tokenSecret: "test-secret" })._encrypt({
    apiKey: "k",
    apiSecret: "s",
    exp: Math.floor(Date.now() / 1000) + 3600
});

function post(body, sessionId) {
    return fetch(`${base}/mcp`, {
        method: "POST",
        headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
            ...(sessionId ? { "mcp-session-id": sessionId } : {})
        },
        body: JSON.stringify(body)
    });
}

const initialize = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test("unknown session ID returns 404 so clients re-initialize", async () => {
    const res = await post({ jsonrpc: "2.0", id: 2, method: "tools/list" }, "does-not-exist");
    assert.equal(res.status, 404);
});

test("active sessions survive, idle sessions are evicted and their handler dropped", async () => {
    const res = await post(initialize);
    assert.equal(res.status, 200);
    const sid = res.headers.get("mcp-session-id");
    assert.ok(sid);

    // Keep it active across several sweeps.
    for (let i = 0; i < 4; i++) {
        await sleep(400);
        const r = await post({ jsonrpc: "2.0", id: 10 + i, method: "tools/list" }, sid);
        assert.equal(r.status, 200);
    }

    await sleep(2500);
    const stale = await post({ jsonrpc: "2.0", id: 99, method: "tools/list" }, sid);
    assert.equal(stale.status, 404);
    assert.equal(handlers.size, 0);
    assert.ok(dropped.includes(token));

    // Client recovers by re-initializing.
    const again = await post(initialize);
    assert.equal(again.status, 200);
    assert.notEqual(again.headers.get("mcp-session-id"), sid);
});
