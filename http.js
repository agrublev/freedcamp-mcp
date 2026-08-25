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
import crypto from "crypto";
import {
    mcpAuthRouter,
    getOAuthProtectedResourceMetadataUrl
} from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { FreedcampOAuthProvider } from "./oauth.js";

export async function startHttpServer({ buildServer, handlerForToken, dropHandlerForToken }) {
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

    // Active MCP sessions: sessionId → { transport, server, token }
    const sessions = new Map();

    // Map token → Set<sessionId> to track all sessions for a user
    const tokenSessions = new Map();

    const getHandler = async (token, auth) => {
        const fc = handlerForToken(token);
        if (!fc.apiKey) {
            fc.apiKey = auth.extra?.apiKey;
            fc.apiSecret = auth.extra?.apiSecret;
            fc.sessionToken = null;
            fc.userId = null;
            await fc.initialize();
        }
        return fc;
    };

    app.post("/mcp", bearerAuth, async (req, res) => {
        const token = req.auth.token;
        const sessionId = req.headers["mcp-session-id"];
        try {
            let session;
            if (sessionId && sessions.has(sessionId)) {
                session = sessions.get(sessionId);
                // Verify that this session belongs to the authenticated token
                if (session.token !== token) {
                    res.status(403).json({
                        jsonrpc: "2.0",
                        error: {
                            code: -32000,
                            message: "Forbidden: Session belongs to a different user"
                        },
                        id: null
                    });
                    return;
                }
            } else if (!sessionId && isInitializeRequest(req.body)) {
                // New initialization request
                const fc = await getHandler(token, req.auth);
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => crypto.randomUUID(),
                    enableJsonResponse: true,
                    onsessioninitialized: (sid) => {
                        sessions.set(sid, { transport, server, token });
                        let sids = tokenSessions.get(token);
                        if (!sids) {
                            sids = new Set();
                            tokenSessions.set(token, sids);
                        }
                        sids.add(sid);
                    },
                    onsessionclosed: (sid) => {
                        sessions.delete(sid);
                        const sids = tokenSessions.get(token);
                        if (sids) {
                            sids.delete(sid);
                            if (sids.size === 0) {
                                tokenSessions.delete(token);
                                dropHandlerForToken(token);
                            }
                        }
                    }
                });
                const server = buildServer(fc);
                await server.connect(transport);
                await transport.handleRequest(req, res, req.body);
                return;
            } else {
                res.status(400).json({
                    jsonrpc: "2.0",
                    error: {
                        code: -32000,
                        message: "Bad Request: No valid session ID provided or session expired"
                    },
                    id: null
                });
                return;
            }

            await session.transport.handleRequest(req, res, req.body);
        } catch (error) {
            console.error("[http] MCP request failed:", error);
            if (!res.headersSent) {
                res.status(500).json({ error: "internal_error", message: error.message });
            }
        }
    });

    app.get("/mcp", bearerAuth, async (req, res) => {
        const token = req.auth.token;
        const sessionId = req.headers["mcp-session-id"];
        const session = sessionId ? sessions.get(sessionId) : null;
        if (!session || session.token !== token) {
            res.status(400).send("Invalid or missing session ID");
            return;
        }
        await session.transport.handleRequest(req, res);
    });

    app.delete("/mcp", bearerAuth, async (req, res) => {
        const token = req.auth.token;
        const sessionId = req.headers["mcp-session-id"];
        const session = sessionId ? sessions.get(sessionId) : null;
        if (!session || session.token !== token) {
            res.status(400).send("Invalid or missing session ID");
            return;
        }
        await session.transport.handleRequest(req, res);
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
