export function loginPage({ error = null, query = {}, hint = "" } = {}) {
    const qs = new URLSearchParams(query).toString();
    const action = `/oauth/authorize${qs ? `?${qs}` : ""}`;
    const safe = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Freedcamp MCP — Login</title>
<style>
  :root { --bg:#0f172a; --card:#1e293b; --accent:#38bdf8; --text:#e2e8f0; --muted:#94a3b8; --err:#f87171; }
  *{box-sizing:border-box} body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:var(--bg);color:var(--text);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{background:var(--card);border-radius:16px;padding:32px;max-width:440px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.4)}
  h1{margin:0 0 8px;font-size:22px} p{margin:0 0 20px;color:var(--muted);line-height:1.5;font-size:14px}
  label{display:block;font-size:13px;color:var(--muted);margin:12px 0 6px}
  input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:var(--text);font-size:14px}
  input:focus{outline:2px solid var(--accent);border-color:var(--accent)}
  button{margin-top:20px;width:100%;padding:12px;border:0;border-radius:8px;background:var(--accent);color:#0f172a;font-weight:700;font-size:15px;cursor:pointer}
  button:hover{opacity:.9}
  .error{background:rgba(248,113,113,.15);border:1px solid rgba(248,113,113,.4);color:var(--err);padding:10px 12px;border-radius:8px;font-size:13px;margin-bottom:16px}
  .hint{font-size:12px;color:var(--muted);margin-top:16px;background:rgba(56,189,248,.08);padding:10px 12px;border-radius:8px;line-height:1.4}
  .brand{font-size:28px;margin-bottom:4px} a{color:var(--accent);text-decoration:none}
  .divider{height:1px;background:#334155;margin:20px 0}
  .meta{font-size:11px;color:var(--muted);text-align:center;margin-top:16px}
  .row{display:flex;gap:12px}
  .row>div{flex:1}
</style>
</head>
<body>
<div class="card">
  <div class="brand">🔐 Freedcamp MCP</div>
  <h1>Connect your account</h1>
  <p>Mimicked OAuth — hosted locally. Enter your <strong>Freedcamp API credentials</strong> to authorize this MCP client. Your <em>Username</em> is your API Key, <em>Password</em> is your API Secret.</p>
  ${error ? `<div class="error">${safe(error)}</div>` : ""}
  <form method="POST" action="${safe(action)}">
    <label for="username">Username — Freedcamp API Key</label>
    <input id="username" name="username" type="text" placeholder="e.g. e43fecf2977c3..." required autocomplete="username" value="${safe(query.username || "")}"/>
    <label for="password">Password — Freedcamp API Secret</label>
    <input id="password" name="password" type="password" placeholder="••••••••••••••••" required autocomplete="current-password"/>
    <button type="submit">Authorize &amp; Continue</button>
  </form>
  <div class="hint">
    <strong>Where to find them?</strong> Freedcamp → Settings → API. Copy your <em>API Key</em> and <em>API Secret</em>.<br/>
    Direct token exchange also works: <code>POST /oauth/token</code> with <code>grant_type=password&amp;username=&lt;key&gt;&amp;password=&lt;secret&gt;</code>
  </div>
  <div class="divider"></div>
  <p style="font-size:12px">This OAuth server is <em>hosted by your MCP</em> — it validates credentials against <code>https://freedcamp.com/api/v1/sessions/current</code> and then issues local Bearer tokens for MCP access. No credentials are sent to any third party beyond Freedcamp itself.</p>
  <div class="meta">Freedcamp MCP Server • OAuth mimic • <a href="/.well-known/oauth-authorization-server" target="_blank">discovery</a> • <a href="/health" target="_blank">health</a></div>
</div>
</body>
</html>`;
}

export function homePage({ baseUrl, oauthEnabled }) {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Freedcamp MCP Server</title>
<style>
  :root{--bg:#0f172a;--card:#1e293b;--accent:#38bdf8;--text:#e2e8f0;--muted:#94a3b8}
  *{box-sizing:border-box} body{margin:0;font-family:system-ui;background:var(--bg);color:var(--text);padding:32px;line-height:1.6}
  .wrap{max-width:900px;margin:0 auto}
  h1{font-size:28px;margin:0 0 8px} h2{font-size:18px;margin:24px 0 8px;color:var(--accent)}
  .card{background:var(--card);border-radius:12px;padding:20px;margin:16px 0}
  code{background:#0f172a;padding:2px 6px;border-radius:4px;font-size:13px}
  pre{background:#0f172a;padding:16px;border-radius:8px;overflow:auto;font-size:13px}
  a{color:var(--accent)}
  .badge{display:inline-block;background:rgba(56,189,248,.15);color:var(--accent);padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600}
  table{width:100%;border-collapse:collapse;font-size:13px} th,td{text-align:left;padding:8px;border-bottom:1px solid #334155}
</style>
</head>
<body>
<div class="wrap">
  <h1>🚀 Freedcamp MCP Server</h1>
  <p class="badge">${oauthEnabled ? "OAuth mimic enabled — hosted locally" : "Stdio mode (OAuth disabled)"} </p>
  <p>Base URL: <code>${baseUrl}</code></p>

  <div class="card">
    <h2>What is the mimicked OAuth?</h2>
    <p>This server <strong>hosts its own OAuth 2.1 provider</strong> so MCP clients that expect OAuth can connect, even though Freedcamp's API itself only uses HMAC API Key/Secret. The flow is:</p>
    <ol>
      <li>MCP client discovers <code>/.well-known/oauth-authorization-server</code></li>
      <li>User is sent to <code>/oauth/authorize</code> → login with <em>Username = API Key</em>, <em>Password = API Secret</em></li>
      <li>Server validates the pair against <code>https://freedcamp.com/api/v1/sessions/current</code></li>
      <li>On success, an authorization <code>code</code> is issued and redirected to the client</li>
      <li>Client exchanges the code at <code>/oauth/token</code> (PKCE-verified) for <code>access_token</code> + <code>refresh_token</code></li>
      <li>All subsequent MCP calls carry <code>Authorization: Bearer &lt;token&gt;</code> and are mapped back to that user's Freedcamp credentials</li>
    </ol>
    <p>Shortcut: you can also <code>POST /oauth/token</code> with <code>grant_type=password</code> directly.</p>
  </div>

  <div class="card">
    <h2>Quick test (password grant)</h2>
    <pre>curl -X POST ${baseUrl}/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=password" \\
  -d "username=YOUR_API_KEY" \\
  -d "password=YOUR_API_SECRET"

# → { access_token, refresh_token, expires_in }

curl -H "Authorization: Bearer &lt;access_token&gt;" ${baseUrl}/health
# or connect your MCP client to ${baseUrl}/sse</pre>
  </div>

  <div class="card">
    <h2>Endpoints</h2>
    <table>
      <tr><th>Endpoint</th><th>Purpose</th></tr>
      <tr><td><code>GET /.well-known/oauth-authorization-server</code></td><td>Discovery (RFC 8414)</td></tr>
      <tr><td><code>GET /.well-known/oauth-protected-resource</code></td><td>Protected resource metadata</td></tr>
      <tr><td><code>POST /oauth/register</code></td><td>Dynamic client registration</td></tr>
      <tr><td><code>GET /oauth/authorize</code></td><td>Login & consent (shows form)</td></tr>
      <tr><td><code>POST /oauth/authorize</code></td><td>Submit username/password → code</td></tr>
      <tr><td><code>POST /oauth/token</code></td><td>Exchange code / refresh / password</td></tr>
      <tr><td><code>POST /oauth/revoke</code></td><td>Revoke token</td></tr>
      <tr><td><code>GET /oauth/userinfo</code></td><td>Bearer token info</td></tr>
      <tr><td><code>GET /sse</code></td><td>MCP SSE stream (needs Bearer)</td></tr>
      <tr><td><code>POST /messages?sessionId=...</code></td><td>MCP JSON-RPC messages</td></tr>
      <tr><td><code>GET /health</code></td><td>Health check</td></tr>
    </table>
  </div>

  <div class="card">
    <h2>MCP client config</h2>
    <p>For a remote MCP client that supports OAuth (Streamable HTTP / SSE):</p>
    <pre>{
  "mcpServers": {
    "freedcamp": {
      "url": "${baseUrl}/sse",
      "auth": "oauth"
    }
  }
}</pre>
    <p>Stdio clients can still use env vars:</p>
    <pre>FREEDCAMP_API_KEY=xxx FREEDCAMP_API_SECRET=yyy npx freedcamp-mcp-server</pre>
  </div>

  <p style="color:var(--muted);font-size:12px">Freedcamp MCP v1 • hosted OAuth mimic • tokens are local-only and never leave this host except to validate against Freedcamp.</p>
</div>
</body>
</html>`;
}

export function errorPage({ status = 400, message = "Error", detail = "" } = {}) {
    return `<!doctype html><html><head><meta charset="utf-8"/><title>${status} — ${message}</title>
<style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#1e293b;padding:32px;border-radius:12px;max-width:520px;width:100%} h1{margin:0 0 8px} p{color:#94a3b8} code{background:#0f172a;padding:2px 6px;border-radius:4px}</style>
</head><body><div class="card"><h1>${status} — ${message}</h1><p>${detail || ""}</p><p><a href="/" style="color:#38bdf8">← Home</a> · <a href="/oauth/authorize" style="color:#38bdf8">Login</a></p></div></body></html>`;
}
