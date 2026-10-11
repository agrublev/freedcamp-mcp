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

// Sessions with no request (and no open GET stream) for this long are closed.
// Most clients never send DELETE /mcp, so without this, sessions accumulate
// until the process hits its memory limit. Clients transparently re-initialize
// after a 404 on an unknown session ID (MCP spec, Streamable HTTP §Session
// Management), and all user state lives in the bearer token, not the session.
const SESSION_IDLE_MS = Number(process.env.MCP_SESSION_IDLE_MS ?? 30 * 60 * 1000);
const MAX_SESSIONS = Number(process.env.MCP_MAX_SESSIONS || 1000);
const SWEEP_INTERVAL_MS = Number(process.env.MCP_SESSION_SWEEP_MS || 60 * 1000);
const STATS_INTERVAL_MS = Number(process.env.MCP_STATS_INTERVAL_MS || 5 * 60 * 1000);

export async function startHttpServer({ buildServer, handlerForToken, dropHandlerForToken, handlerCount }) {
    const port = Number(process.env.PORT || 3000);
    const host = process.env.HOST || "127.0.0.1";
    const publicUrl = (
        process.env.MCP_PUBLIC_URL || `http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`
    ).replace(/\/$/, "");

    const provider = new FreedcampOAuthProvider({
        tokenSecret: process.env.OAUTH_TOKEN_SECRET,
        allowedRedirectHosts: (process.env.OAUTH_ALLOWED_REDIRECT_HOSTS || "")
            .split(",")
            .map((h) => h.trim().toLowerCase())
            .filter(Boolean)
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

    // Active MCP sessions: sessionId → { transport, server, token, lastActivity, openStreams }
    const sessions = new Map();

    // Map token → Set<sessionId> to track all sessions for a user
    const tokenSessions = new Map();

    // Counters since process start, logged with periodic stats.
    const counters = { created: 0, closedByClient: 0, evictedIdle: 0, evictedCap: 0, unknownSessionId: 0 };

    const forgetSession = (sid, token) => {
        if (!sessions.delete(sid)) return false;
        const sids = tokenSessions.get(token);
        if (sids) {
            sids.delete(sid);
            if (sids.size === 0) {
                tokenSessions.delete(token);
                dropHandlerForToken(token);
            }
        }
        return true;
    };

    const evictSession = (sid, reason) => {
        const session = sessions.get(sid);
        if (!session || !forgetSession(sid, session.token)) return;
        counters[reason]++;
        session.transport.close().catch(() => {});
        session.server.close().catch(() => {});
    };

    const touch = (session) => {
        session.lastActivity = Date.now();
    };

    const sweepSessions = () => {
        const now = Date.now();
        if (SESSION_IDLE_MS > 0) {
            for (const [sid, session] of sessions) {
                if (session.openStreams === 0 && now - session.lastActivity > SESSION_IDLE_MS) {
                    evictSession(sid, "evictedIdle");
                }
            }
        }
        if (sessions.size > MAX_SESSIONS) {
            const oldest = [...sessions.entries()].sort((a, b) => a[1].lastActivity - b[1].lastActivity);
            for (const [sid] of oldest.slice(0, sessions.size - MAX_SESSIONS)) evictSession(sid, "evictedCap");
        }
        provider.pruneExpiredCodes();
    };
    setInterval(sweepSessions, SWEEP_INTERVAL_MS).unref();

    // One JSON line per interval to correlate session counts with memory use.
    const logStats = () => {
        const mem = process.memoryUsage();
        let oldestIdleS = 0;
        for (const session of sessions.values()) {
            oldestIdleS = Math.max(oldestIdleS, Math.round((Date.now() - session.lastActivity) / 1000));
        }
        console.error(
            "[stats] " +
                JSON.stringify({
                    sessions: sessions.size,
                    users: tokenSessions.size,
                    handlers: handlerCount ? handlerCount() : undefined,
                    oauthClients: provider.clientCount(),
                    pendingCodes: provider.pendingCodeCount(),
                    oldestIdleS,
                    ...counters,
                    rssMB: Math.round(mem.rss / 1048576),
                    heapUsedMB: Math.round(mem.heapUsed / 1048576),
                    uptimeS: Math.round(process.uptime())
                })
        );
    };
    setInterval(logStats, STATS_INTERVAL_MS).unref();

    const unknownSession = (res) => {
        counters.unknownSessionId++;
        res.status(404).json({
            jsonrpc: "2.0",
            error: { code: -32001, message: "Session not found" },
            id: null
        });
    };

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
            if (sessionId && !sessions.has(sessionId)) {
                unknownSession(res);
                return;
            } else if (sessionId) {
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
                        counters.created++;
                        sessions.set(sid, { transport, server, token, lastActivity: Date.now(), openStreams: 0 });
                        let sids = tokenSessions.get(token);
                        if (!sids) {
                            sids = new Set();
                            tokenSessions.set(token, sids);
                        }
                        sids.add(sid);
                    },
                    onsessionclosed: (sid) => {
                        if (forgetSession(sid, token)) counters.closedByClient++;
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

            touch(session);
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
        if (!sessionId) {
            res.status(400).send("Missing session ID");
            return;
        }
        const session = sessions.get(sessionId);
        if (!session) return unknownSession(res);
        if (session.token !== token) {
            res.status(403).send("Session belongs to a different user");
            return;
        }
        // An open GET stream keeps the session alive; activity resumes from when it closes.
        touch(session);
        session.openStreams++;
        res.on("close", () => {
            session.openStreams--;
            touch(session);
        });
        await session.transport.handleRequest(req, res);
    });

    app.delete("/mcp", bearerAuth, async (req, res) => {
        const token = req.auth.token;
        const sessionId = req.headers["mcp-session-id"];
        if (!sessionId) {
            res.status(400).send("Missing session ID");
            return;
        }
        const session = sessions.get(sessionId);
        if (!session) return unknownSession(res);
        if (session.token !== token) {
            res.status(403).send("Session belongs to a different user");
            return;
        }
        await session.transport.handleRequest(req, res);
    });

    app.get("/healthz", (_req, res) => res.json({ ok: true }));

    return await new Promise((resolve, reject) => {
        const listener = app.listen(port, host, () => {
            console.error(`Freedcamp MCP Server (HTTP + OAuth) listening on http://${host}:${port}`);
            console.error(`  MCP endpoint:      ${publicUrl}/mcp`);
            console.error(`  OAuth metadata:    ${publicUrl}/.well-known/oauth-authorization-server`);
            console.error(`  Authorization URL: ${publicUrl}/authorize`);
            resolve(listener);
        });
        listener.on("error", reject);
    });
}
