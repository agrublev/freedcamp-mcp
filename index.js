#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import FreedcampHandler from "./operations/fc-handler.js";
import { VERSION } from "./common/version.js";
import { createMcpServer } from "./src/server/mcp.js";
import { OAuthStore } from "./src/auth/store.js";
import { OAuthServer } from "./src/auth/oauth.js";
import { createHttpServer } from "./src/server/http.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ── Env & args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const hasFlag = (f) => args.includes(f);
const getFlagVal = (f) => {
    const idx = args.indexOf(f);
    return idx !== -1 ? args[idx + 1] : null;
};

const _portRaw = process.env.PORT || getFlagVal("--port") || "";
const _parsedPort = _portRaw !== "" ? parseInt(_portRaw, 10) : NaN;
const PORT = Number.isFinite(_parsedPort) ? _parsedPort : null;
const HOST = process.env.HOST || getFlagVal("--host") || "0.0.0.0";
const BASE_URL = process.env.MCP_SERVER_URL || process.env.OAUTH_ISSUER || (PORT !== null ? `http://localhost:${PORT}` : null);
const MCP_TRANSPORT = (process.env.MCP_TRANSPORT || getFlagVal("--transport") || "").toLowerCase();
const OAUTH_ENABLED_RAW = process.env.OAUTH_ENABLED;
const OAUTH_ENABLED = OAUTH_ENABLED_RAW !== undefined
    ? ["1", "true", "yes", "on"].includes(String(OAUTH_ENABLED_RAW).toLowerCase())
    : (PORT !== null || MCP_TRANSPORT === "http" || MCP_TRANSPORT === "sse" || hasFlag("--http"));
const OAUTH_STORE_PATH = process.env.OAUTH_STORE_PATH || path.join(path.dirname(fileURLToPath(import.meta.url)), "oauth-store.json");
const ALLOW_ENV_FALLBACK = !["0", "false", "no", "off"].includes(String(process.env.OAUTH_ALLOW_ENV_FALLBACK || "1").toLowerCase());

const useHttp = OAUTH_ENABLED || PORT !== null || MCP_TRANSPORT === "http" || MCP_TRANSPORT === "sse" || hasFlag("--http");

// ── Help ──────────────────────────────────────────────────────────────────

if (hasFlag("--help") || hasFlag("-h")) {
    console.log(`
Freedcamp MCP Server v${VERSION}

Usage:
  npx freedcamp-mcp-server [options]

Modes:
  stdio (default)  MCP over stdin/stdout. Requires FREEDCAMP_API_KEY/SECRET env.
  http             Hosted MCP over SSE + mimicked OAuth (username=API Key, password=API Secret)

Options:
  --http                 Force HTTP mode (same as PORT=3000)
  --port <n>             HTTP port (default: 3000 or $PORT)
  --host <host>          HTTP host (default: 0.0.0.0 or $HOST)
  --transport <stdio|http|sso>  Explicit transport

Env:
  FREEDCAMP_API_KEY / FREEDCAMP_API_SECRET  Freedcamp HMAC credentials (required for stdio, optional fallback for http)
  PORT / HOST / MCP_SERVER_URL              HTTP binding
  OAUTH_ENABLED=1/0                         Force enable/disable hosted OAuth (auto-enabled in http mode)
  OAUTH_STORE_PATH                          File to persist OAuth clients/tokens (default: ./oauth-store.json)
  OAUTH_JWT_SECRET                          Secret for signing (auto-generated if not set)
  OAUTH_ALLOW_ENV_FALLBACK=1/0              Allow /sse without Bearer to use env creds (default: 1 for dev)

Examples:
  # stdio (Claude Desktop)
  FREEDCAMP_API_KEY=xxx FREEDCAMP_API_SECRET=yyy npx freedcamp-mcp-server

  # hosted OAuth mimic + HTTP
  PORT=3000 npx freedcamp-mcp-server
  # → OAuth at http://localhost:3000/.well-known/oauth-authorization-server
  # → MCP at http://localhost:3000/sse  (Bearer required)

  # direct password grant test
  curl -X POST http://localhost:3000/oauth/token -d "grant_type=password&username=KEY&password=SECRET"

  # use token
  curl -H "Authorization: Bearer <token>" http://localhost:3000/sse
`);
    process.exit(0);
}

// ── HTTP mode ─────────────────────────────────────────────────────────────

if (useHttp) {
    const port = PORT || 3000;
    const issuer = BASE_URL || `http://localhost:${port}`;
    const jwtSecret = process.env.OAUTH_JWT_SECRET || process.env.FREEDCAMP_API_SECRET || "freedcamp-oauth-dev-secret-change-me";

    // Allow http without env creds when OAuth is enabled (multi-tenant)
    const needEnvCreds = !OAUTH_ENABLED;
    if (needEnvCreds) {
        const apiKey = process.env.FREEDCAMP_API_KEY;
        const apiSecret = process.env.FREEDCAMP_API_SECRET;
        const missing = [!apiKey && "FREEDCAMP_API_KEY", !apiSecret && "FREEDCAMP_API_SECRET"].filter(Boolean);
        if (missing.length) {
            console.error(`Missing ${missing.join(", ")} — required when OAUTH_ENABLED=0 in http mode.`);
            console.error(`Either set OAUTH_ENABLED=1 for mimicked OAuth, or provide env creds.`);
            process.exit(1);
        }
    }

    const storePath = OAUTH_STORE_PATH && OAUTH_STORE_PATH !== "0" && OAUTH_STORE_PATH !== "/dev/null" ? OAUTH_STORE_PATH : null;
    const store = new OAuthStore({ filePath: storePath, jwtSecret });
    const oauth = new OAuthServer({ store, issuer, baseUrl: issuer });

    const httpSrv = createHttpServer({
        store,
        oauth,
        port,
        host: HOST,
        baseUrl: issuer,
        enableOAuth: OAUTH_ENABLED,
        allowEnvFallback: ALLOW_ENV_FALLBACK
    });

    await httpSrv.listen();

    if (OAUTH_ENABLED) {
        console.error(`\n🔐 Hosted OAuth mimic enabled — login with username=API Key, password=API Secret`);
        console.error(`   Discovery: ${issuer}/.well-known/oauth-authorization-server`);
        console.error(`   Login:     ${issuer}/oauth/authorize`);
        console.error(`   Token:     POST ${issuer}/oauth/token  grant_type=password&username=KEY&password=SECRET`);
        console.error(`   MCP SSE:   ${issuer}/sse  (Authorization: Bearer <token>)\n`);
    }

    // Graceful shutdown
    const shutdown = async () => {
        console.error("Shutting down HTTP server...");
        store.close();
        await httpSrv.close();
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
} else {
    // ── Stdio mode ────────────────────────────────────────────────────────
    const apiKey = process.env.FREEDCAMP_API_KEY;
    const apiSecret = process.env.FREEDCAMP_API_SECRET;
    const missingCreds = [!apiKey && "FREEDCAMP_API_KEY", !apiSecret && "FREEDCAMP_API_SECRET"].filter(Boolean);
    if (missingCreds.length) {
        console.error("=== LOGIN ERROR ===");
        console.error(`Missing required credential env var(s): ${missingCreds.join(", ")}`);
        console.error("The Freedcamp MCP server cannot authenticate without these in stdio mode.");
        console.error("Pass them when launching the server, e.g.:");
        console.error("  FREEDCAMP_API_KEY=xxx FREEDCAMP_API_SECRET=yyy npx freedcamp-mcp-server");
        console.error("");
        console.error("Or run in hosted OAuth mode (no env creds needed, per-user login):");
        console.error("  PORT=3000 npx freedcamp-mcp-server");
        console.error("  → then POST /oauth/token with grant_type=password&username=KEY&password=SECRET");
        process.exit(1);
    }

    const fc = new FreedcampHandler(apiKey, apiSecret, undefined, { sessionFilePath: null });
    await fc.initialize();
    const server = createMcpServer(fc);

    async function runServer() {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Freedcamp MCP Server running on stdio");
    }

    await runServer();
}
