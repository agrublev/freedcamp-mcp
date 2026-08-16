// ── Streamable HTTP transport with OAuth 2.1 authorization ─────────────────
//
// Enabled with MCP_TRANSPORT=http. Exposes:
//   POST/GET/DELETE /mcp                     — MCP endpoint (bearer auth)
//   /.well-known/oauth-authorization-server  — OAuth metadata
//   /authorize, /token, /register            — OAuth flow endpoints
//
// Each MCP client completes the OAuth flow (entering its own Freedcamp API
// key/secret on the /authorize page). The resulting bearer token identifies
// the user; buildServer is called once per user with a FreedcampHandler
// created from their credentials.

import express from "express";
import {
    mcpAuthRouter,
    getOAuthProtectedResourceMetadataUrl
} from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { FreedcampOAuthProvider } from "./oauth.js";

export async function startHttpServer({ buildServer, handlerForToken }) {
    const port = Number(process.env.PORT || 3000);
    const host = process.env.HOST || "127.0.0.1";
    const publicUrl = (
        process.env.MCP_PUBLIC_URL || `http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`
    ).replace(/\/$/, "");

    const provider = new FreedcampOAuthProvider({
        tokenSecret: process.env.OAUTH_TOKEN_SECRET
    });
    if (!process.env.OAUTH_TOKEN_SECRET) {
        console.error(
            "[oauth] OAUTH_TOKEN_SECRET is not set — generated a random secret. " +
                "All issued tokens become invalid when the server restarts. " +
                "Set OAUTH_TOKEN_SECRET to a stable random value in production."
        );
    }

    const app = express();
    app.disable("x-powered-by");
    app.set("trust proxy", 1);
    app.use(express.json());

    const mcpUrl = new URL(`${publicUrl}/mcp`);
    const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(mcpUrl);

    // Convenience alias: some clients probe the bare well-known path (without
    // the /mcp suffix) for protected-resource metadata.
    app.get("/.well-known/oauth-protected-resource", (_req, res) =>
        res.redirect(308, resourceMetadataUrl)
    );

    // OAuth authorization server endpoints (metadata, /authorize, /token, /register).
    app.use(
        mcpAuthRouter({
            provider,
            issuerUrl: new URL(publicUrl),
            baseUrl: new URL(publicUrl),
            resourceServerUrl: mcpUrl,
            serviceDocumentationUrl: new URL(
                "https://github.com/agrublev/freedcamp-mcp#readme"
            )
        })
    );

    const bearerAuth = requireBearerAuth({
        verifier: provider,
        resourceMetadataUrl
    });

    // One MCP session per bearer token: transports and servers keyed by token.
    const sessions = new Map(); // token → { transport, server }

    app.all("/mcp", bearerAuth, async (req, res) => {
        // requireBearerAuth already guarantees a verified token on req.auth.
        const token = req.auth.token;
        try {
            let session = sessions.get(token);
            if (!session) {
                const auth = req.auth;
                const fc = handlerForToken(token);
                // First request for this token: wire credentials from the token
                // into a dedicated Freedcamp handler and build an MCP server.
                fc.apiKey = auth.extra?.apiKey;
                fc.apiSecret = auth.extra?.apiSecret;
                fc.sessionToken = null;
                fc.userId = null;
                await fc.initialize();

                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => token.slice(0, 24),
                    enableJsonResponse: true,
                    onsessionclosed: () => {
                        sessions.delete(token);
                    }
                });
                const server = buildServer(fc);
                await server.connect(transport);
                session = { transport, server };
                sessions.set(token, session);
            }
            await session.transport.handleRequest(req, res, req.body);
        } catch (error) {
            console.error("[http] MCP request failed:", error);
            if (!res.headersSent) {
                res.status(500).json({ error: "internal_error", message: error.message });
            }
        }
    });

    app.get("/healthz", (_req, res) => res.json({ ok: true }));

    await new Promise((resolve, reject) => {
        const listener = app.listen(port, host, () => {
            console.error(`Freedcamp MCP Server (HTTP + OAuth) listening on http://${host}:${port}`);
            console.error(`  MCP endpoint:      ${publicUrl}/mcp`);
            console.error(`  OAuth metadata:    ${publicUrl}/.well-known/oauth-authorization-server`);
            console.error(`  Authorization URL: ${publicUrl}/authorize`);
            resolve();
        });
        listener.on("error", reject);
    });
}
