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

test("registered clients survive a restart with the same token secret", () => {
    const before = new FreedcampOAuthProvider({ tokenSecret: "t" });
    const client = register(before, "http://127.0.0.1:6274/oauth/callback", "MCP Inspector");
    const after = new FreedcampOAuthProvider({ tokenSecret: "t" });
    const found = after.clientsStore.getClient(client.client_id);
    assert.equal(found.client_id, client.client_id);
    assert.deepEqual(found.redirect_uris, ["http://127.0.0.1:6274/oauth/callback"]);
    assert.equal(found.client_name, "MCP Inspector");
});

test("forged, tampered, or foreign-secret client ids are rejected", async () => {
    const p = new FreedcampOAuthProvider({ tokenSecret: "t" });
    const { client_id } = register(p, "http://localhost/cb", "C");
    const other = new FreedcampOAuthProvider({ tokenSecret: "different" });
    assert.equal(other.clientsStore.getClient(client_id), undefined);
    const fresh = new FreedcampOAuthProvider({ tokenSecret: "t" });
    assert.equal(fresh.clientsStore.getClient(client_id.slice(0, -2) + "AA"), undefined);
    assert.equal(fresh.clientsStore.getClient("21f33811-cf9e-4ac0-893b-8dc92f5d17da"), undefined);
    // An access token (same cipher) must not be accepted as a client id.
    const token = p._encrypt({ apiKey: "k", apiSecret: "s" });
    assert.equal(fresh.clientsStore.getClient("fc1." + token), undefined);
});

test("unknown client ids are adopted as public clients at /authorize", async () => {
    const p = new FreedcampOAuthProvider({ tokenSecret: "t" });
    const stale = "82bad9c4-b02a-4ad8-8473-8d567d145cea";
    assert.equal(p.clientsStore.getClient(stale), undefined);
    const client = p.adoptClient(stale, "http://localhost:57484/callback");
    assert.equal(client.token_endpoint_auth_method, "none");
    assert.equal(client.client_secret, undefined);
    assert.equal(p.clientsStore.getClient(stale), client);
    // A later attempt on another port/redirect is merged in, not rejected.
    p.adoptClient(stale, "http://127.0.0.1:6000/cb");
    assert.deepEqual(p.clientsStore.getClient(stale).redirect_uris, [
        "http://localhost:57484/callback",
        "http://127.0.0.1:6000/cb"
    ]);
    const res = await render(p, p.clientsStore.getClient(stale));
    assert.match(res.body, /An unregistered application/);
});

test("adoption respects the redirect allowlist, never shadows real clients, and is bounded", () => {
    const strict = new FreedcampOAuthProvider({ tokenSecret: "t", allowedRedirectHosts: ["claude.ai"] });
    assert.equal(strict.adoptClient("old-id", "https://attacker.example.com/cb"), undefined);
    assert.ok(strict.adoptClient("old-id", "http://localhost:1234/cb"));

    const p = new FreedcampOAuthProvider({ tokenSecret: "t" });
    const real = register(p, "https://claude.ai/api/mcp/auth_callback", "Claude");
    assert.equal(p.adoptClient(real.client_id, "https://attacker.example.com/cb"), undefined);
    assert.deepEqual(p.clientsStore.getClient(real.client_id).redirect_uris, ["https://claude.ai/api/mcp/auth_callback"]);
    assert.equal(p.adoptClient("x".repeat(300), "http://localhost/cb"), undefined);
    assert.equal(p.adoptClient("bad id", "http://localhost/cb"), undefined);
    assert.equal(p.adoptClient("id", "not a url"), undefined);

    for (let i = 0; i < 1100; i++) p.adoptClient(`id-${i}`, "http://localhost/cb");
    assert.equal(p.adoptedClientCount(), 1000);
    assert.equal(p.clientsStore.getClient("id-0"), undefined);
    assert.ok(p.clientsStore.getClient("id-1099"));
});
