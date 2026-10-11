import { test } from "node:test";
import assert from "node:assert/strict";
import { FreedcampOAuthProvider } from "../oauth.js";

function fakeRes(method = "GET") {
    const res = {
        req: { method, body: {} },
        headers: {},
        statusCode: 200,
        status(c) { this.statusCode = c; return this; },
        setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
        send(b) { this.body = b; }
    };
    return res;
}

function register(provider, redirectUri, name) {
    return provider.clientsStore.registerClient({ redirect_uris: [redirectUri], client_name: name });
}

async function render(provider, client) {
    const res = fakeRes();
    await provider.authorize(client, { redirectUri: client.redirect_uris[0], codeChallenge: "x", state: "s" }, res);
    return res;
}

test("consent page discloses client name and redirect host, warns on unknown host", async () => {
    const p = new FreedcampOAuthProvider({ tokenSecret: "t" });
    const res = await render(p, register(p, "https://attacker.example.com/callback", "<b>Evil</b>"));
    assert.match(res.body, /attacker\.example\.com/);
    assert.match(res.body, /&lt;b&gt;Evil&lt;\/b&gt;/);
    assert.match(res.body, /unverified application/);
    assert.equal(res.headers["x-frame-options"], "DENY");
    assert.equal(res.headers["cache-control"], "no-store");
});

test("no warning for known clients and loopback redirects", async () => {
    const p = new FreedcampOAuthProvider({ tokenSecret: "t" });
    for (const uri of ["https://claude.ai/api/mcp/auth_callback", "http://localhost:33418/callback", "cursor://anysphere/cb"]) {
        const res = await render(p, register(p, uri, "Client"));
        assert.doesNotMatch(res.body, /unverified application/, uri);
    }
});

test("allowlist rejects unknown web hosts but keeps loopback and custom schemes", () => {
    const p = new FreedcampOAuthProvider({ tokenSecret: "t", allowedRedirectHosts: ["claude.ai"] });
    assert.throws(() => register(p, "https://attacker.example.com/cb"), /redirect_uri not allowed/);
    assert.throws(() => register(p, "http://claude.ai/cb"), /redirect_uri not allowed/);
    assert.ok(register(p, "https://claude.ai/api/mcp/auth_callback").client_id);
    assert.ok(register(p, "http://127.0.0.1:5000/cb").client_id);
    assert.ok(register(p, "vscode://cb").client_id);
});
