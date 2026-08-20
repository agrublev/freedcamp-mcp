# Freedcamp MCP — Hosted OAuth (Mimic)

This server **hosts its own OAuth 2.1 provider** so MCP clients that expect OAuth can connect, even though Freedcamp's own API only supports HMAC `api_key + timestamp → HMAC-SHA1(secret)`.

The mimic is **local-only**: your browser/client talks to *this* host, you log in with your normal Freedcamp credentials (Username = API Key, Password = API Secret), the server validates them against `https://freedcamp.com/api/v1/sessions/current`, and then issues **local Bearer tokens** that are mapped back to that user's Freedcamp credentials for all subsequent MCP calls. No credentials are sent anywhere except Freedcamp.

## Quick start

```bash
# 1. Start the hosted MCP + OAuth server (no env creds required — per-user login)
PORT=3000 npx freedcamp-mcp-server
# or
npx freedcamp-mcp-server --http --port 3000

# Logs:
# 🔐 Hosted OAuth mimic enabled — login with username=API Key, password=API Secret
#   Discovery: http://localhost:3000/.well-known/oauth-authorization-server
#   Login:     http://localhost:3000/oauth/authorize
#   Token:     POST http://localhost:3000/oauth/token  grant_type=password&username=KEY&password=SECRET
#   MCP SSE:   http://localhost:3000/sse  (Authorization: Bearer <token>)
#   MCP stateless: http://localhost:3000/mcp  (POST JSON-RPC)
```

Open `http://localhost:3000/` for a human-readable overview.

## Modes

| Mode | How to run | Auth |
|------|-----------|------|
| **stdio** (default, Claude Desktop) | `FREEDCAMP_API_KEY=xxx FREEDCAMP_API_SECRET=yyy npx freedcamp-mcp-server` | Env single-tenant |
| **http + OAuth mimic** | `PORT=3000 npx freedcamp-mcp-server` | Per-user Bearer tokens (multi-tenant) |
| **http + env fallback (dev)** | `PORT=3000 FREEDCAMP_API_KEY=xxx FREEDCAMP_API_SECRET=yyy npx freedcamp-mcp-server` | Bearer preferred, env fallback if no token (controlled by `OAUTH_ALLOW_ENV_FALLBACK=1`) |

Stdio is preserved exactly as before. HTTP mode enables the OAuth layer.

## Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /` | Human overview + curl examples |
| `GET /health` | `{ status, oauth, transports, store }` |
| `GET /.well-known/oauth-authorization-server` | Discovery (RFC 8414) |
| `GET /.well-known/oauth-protected-resource` | Protected resource metadata (also `/.well-known/oauth-protected-resource/mcp`) |
| `POST /oauth/register` | Dynamic client registration (RFC 7591) |
| `GET /oauth/authorize` | Login & consent — shows form (Username=API Key, Password=API Secret) |
| `POST /oauth/authorize` | Submit credentials → `302` to `redirect_uri?code=…&state=…` |
| `POST /oauth/token` | Exchange `code` / `refresh_token` / `password` for tokens |
| `POST /oauth/revoke` | Revoke `access_token` or `refresh_token` |
| `GET /oauth/userinfo` | Bearer token info |
| `POST /oauth/introspect` | `{ active }` check |
| `GET /sse` | MCP via SSE (needs `Authorization: Bearer <token>` or `?access_token=`) |
| `POST /messages?sessionId=…` | MCP JSON-RPC over SSE |
| `POST /mcp` | MCP stateless Streamable HTTP (POST JSON-RPC, no SSE) |
| `GET /login`, `POST /login` | Direct login alias (issues tokens as HTML) |

## Flows

### 1. Authorization Code + PKCE (standard OAuth)

Best for MCP clients that do discovery (Claude, Cursor, etc.):

```bash
# Client discovers
curl http://localhost:3000/.well-known/oauth-authorization-server

# Client registers
curl -X POST http://localhost:3000/oauth/register \
  -H "Content-Type: application/json" \
  -d '{"redirect_uris":["http://localhost:3000/callback"],"client_name":"My Client"}'
# → { client_id, client_secret }

# User is redirected to:
# http://localhost:3000/oauth/authorize?client_id=xxx&redirect_uri=http://localhost:3000/callback&response_type=code&code_challenge=YYY&code_challenge_method=S256&state=zzz
# → Login form (API Key / API Secret) → 302 to redirect_uri?code=CODE&state=zzz

# Client exchanges code (PKCE verifier must match)
curl -X POST http://localhost:3000/oauth/token \
  -d "grant_type=authorization_code&code=CODE&redirect_uri=http://localhost:3000/callback&client_id=xxx&code_verifier=VERIFIER"
# → { access_token, refresh_token, expires_in: 3600 }
```

PKCE `S256` and `plain` are supported; `code_verifier` is required when a `code_challenge` was sent.

### 2. Password grant (fast path — "normal username pass to login")

Mimicked Resource Owner Password Credentials grant. Use your API Key as username and API Secret as password:

```bash
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=YOUR_API_KEY" \
  -d "password=YOUR_API_SECRET"
# → { access_token, refresh_token, token_type: "Bearer", expires_in: 3600 }
```

Works with `username`/`password` or `api_key`/`api_secret` field names.

### 3. Refresh

```bash
curl -X POST http://localhost:3000/oauth/token \
  -d "grant_type=refresh_token&refresh_token=YOUR_REFRESH_TOKEN"
```

### 4. Use the token with MCP

**SSE (SDK 1.0.1):**

```bash
# Option A: Authorization header
curl -N -H "Authorization: Bearer <access_token>" http://localhost:3000/sse
# → event: endpoint\ndata: /messages?sessionId=...

# Option B: query param (for EventSource clients that can't set headers)
curl -N http://localhost:3000/sse?access_token=<access_token>
```

Then POST JSON-RPC to the returned endpoint:

```bash
curl -X POST "http://localhost:3000/messages?sessionId=..." \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```

Or via SDK `SSEClientTransport` pointing at `http://localhost:3000/sse?access_token=...`.

**Stateless Streamable HTTP (MCP 2025-03-26, no SSE needed):**

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"fc_fetch_projects","arguments":{}}}'
```

## Configuration

| Env | Default | Purpose |
|-----|---------|---------|
| `PORT` | `3000` when `--http` | HTTP port |
| `HOST` | `0.0.0.0` | Bind host |
| `MCP_SERVER_URL` / `OAUTH_ISSUER` | `http://localhost:$PORT` | Issuer/base URL used in discovery |
| `OAUTH_ENABLED` | auto (`1` in http mode) | Force `1`/`0` |
| `OAUTH_STORE_PATH` | `./oauth-store.json` | Persist clients/tokens (ignored by git); set to `0` or `/dev/null` for memory-only |
| `OAUTH_JWT_SECRET` | random / `FREEDCAMP_API_SECRET` | For optional JWT signing (not required for opaque tokens) |
| `OAUTH_ALLOW_ENV_FALLBACK` | `1` | If `1`, `/sse` and `/mcp` without Bearer fall back to `FREEDCAMP_API_KEY/SECRET` env (dev convenience); set `0` to require Bearer strictly |
| `MCP_TRANSPORT` | — | `stdio` or `http`/`sse` |
| `FREEDCAMP_API_KEY` / `FREEDCAMP_API_SECRET` | — | Required for stdio; optional fallback for http |

CLI flags mirror env: `--http`, `--port <n>`, `--host <h>`, `--transport <stdio|http>`, `--help`.

## Security notes

- Tokens are **opaque random strings** (`base64url` 48 bytes) with 1h access / 30d refresh expiry, stored in `oauth-store.json` (or memory). They map to the Freedcamp `apiKey`/`apiSecret` that were validated at login. The Freedcamp credentials are stored alongside the token *on this host only*.
- `oauth-store.json` is `.gitignore`d and should be kept private (it contains API secrets in plaintext for local use). For production, restrict file permissions and consider memory-only (`OAUTH_STORE_PATH=/dev/null`) or an external store.
- The login form validates by calling `GET https://freedcamp.com/api/v1/sessions/current` with the supplied HMAC. If that succeeds, the pair is considered valid.
- No credentials are forwarded except to Freedcamp itself.
- Rate limiting and 401 refresh are inherited from `FreedcampHandler`.

## Client configs

**Remote MCP with OAuth (Cursor/VS Code):**

```json
{
  "mcpServers": {
    "freedcamp": {
      "url": "http://localhost:3000/sse",
      "auth": "oauth"
    }
  }
}
```

Client will discover `/.well-known/oauth-authorization-server`, open the login page, and you enter `API Key` / `API Secret`.

**Stateless HTTP client:**

```json
{
  "mcpServers": {
    "freedcamp": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

**Claude Desktop (stdio) stays unchanged:**

```json
{
  "mcpServers": {
    "freedcamp": {
      "command": "npx",
      "args": ["-y", "freedcamp-mcp-server"],
      "env": { "FREEDCAMP_API_KEY": "...", "FREEDCAMP_API_SECRET": "..." }
    }
  }
}
```

## Troubleshooting

- `401 unauthorized` on `/sse` or `/mcp`: missing/invalid Bearer. `POST /oauth/token` with `grant_type=password` to get one, or set `OAUTH_ALLOW_ENV_FALLBACK=1` with env creds for dev.
- `invalid_grant` on `authorization_code`: code expired (10 min), `code_verifier` missing/mismatched, `redirect_uri` mismatch, or `client_id` mismatch.
- `unknown client_id` on `/oauth/authorize`: register first via `POST /oauth/register`, or use a client that skips registration and uses `password` grant directly.
- Need to inspect store: `cat oauth-store.json | jq .` (contains secrets — don't share).

## Architecture

```
index.js                    # Dual-mode entry: stdio vs http+oauth
src/server/mcp.js           # Tool registry + createMcpServer(fcHandler)
src/server/http.js          # HTTP server, CORS, OAuth routes, SSE + stateless MCP
src/server/html.js          # Login / home HTML
src/auth/tokens.js          # Random, PKCE, JWT, AES helpers
src/auth/store.js           # OAuthStore (clients/codes/tokens)
src/auth/oauth.js           # OAuthServer (discovery, register, authorize, token)
operations/fc-handler.js    # Freedcamp API (HMAC, per-request handler with sessionFilePath:null)
```
