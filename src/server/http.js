import http from "http";
import { URL } from "url";
import crypto from "crypto";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import FreedcampHandler from "../../operations/fc-handler.js";
import { createMcpServer } from "./mcp.js";
import { loginPage, homePage, errorPage } from "./html.js";

// ── Helpers ───────────────────────────────────────────────────────────────

function sendJson(res, status, obj, extraHeaders = {}) {
    const body = JSON.stringify(obj, null, 2);
    res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), ...extraHeaders, ...corsHeaders() });
    res.end(body);
}

function sendHtml(res, status, html) {
    res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Content-Length": Buffer.byteLength(html), ...corsHeaders() });
    res.end(html);
}

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Expose-Headers": "WWW-Authenticate"
    };
}

function parseCookies(req) {
    const header = req.headers.cookie || "";
    const out = {};
    for (const part of header.split(";")) {
        const [k, ...v] = part.trim().split("=");
        if (!k) continue;
        out[k.trim()] = decodeURIComponent((v.join("=") || "").trim());
    }
    return out;
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => {
            const ct = (req.headers["content-type"] || "").toLowerCase();
            if (ct.includes("application/json")) {
                if (!data) return resolve({});
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`invalid json: ${e.message}`));
                }
            } else if (ct.includes("application/x-www-form-urlencoded")) {
                const params = new URLSearchParams(data);
                const obj = {};
                for (const [k, v] of params) obj[k] = v;
                resolve(obj);
            } else {
                // try to parse as urlencoded anyway if data looks like it
                if (data.includes("=")) {
                    const params = new URLSearchParams(data);
                    const obj = {};
                    for (const [k, v] of params) obj[k] = v;
                    if (Object.keys(obj).length) return resolve(obj);
                }
                if (!data) return resolve({});
                try {
                    resolve(JSON.parse(data));
                } catch {
                    resolve({ _raw: data });
                }
            }
        });
        req.on("error", reject);
    });
}

function getBearer(req) {
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    return m ? m[1].trim() : null;
}

// ── HTTP Server ───────────────────────────────────────────────────────────

export function createHttpServer({ store, oauth, port = 3000, host = "0.0.0.0", baseUrl = null, enableOAuth = true, allowEnvFallback = true }) {
    const transports = new Map(); // sessionId -> { transport, server, fc }

    // For direct env fallback when OAuth not required or token missing
    const envApiKey = process.env.FREEDCAMP_API_KEY;
    const envApiSecret = process.env.FREEDCAMP_API_SECRET;

    const issuer = baseUrl || `http://localhost:${port}`;

    const server = http.createServer(async (req, res) => {
        // CORS preflight
        if (req.method === "OPTIONS") {
            res.writeHead(204, corsHeaders());
            return res.end();
        }

        const url = new URL(req.url, issuer);
        const path = url.pathname;
        const query = Object.fromEntries(url.searchParams.entries());

        // ── Helpers for auth ──────────────────────────────────────────
        const requireAuth = () => {
            if (!enableOAuth) return { ok: true, apiKey: envApiKey, apiSecret: envApiSecret };
            const token = getBearer(req);
            if (token) {
                const entry = store.verifyToken(token);
                if (entry) return { ok: true, ...entry, token };
            }
            if (allowEnvFallback && envApiKey && envApiSecret && !token) {
                // Allow env creds when no token provided and fallback enabled (useful for dev)
                // But if OAuth is enabled, we still prefer to require token for MCP endpoints
                // We'll allow fallback only for health/check, not for MCP unless explicitly allowed
                return { ok: false, reason: "no token and fallback disabled for MCP" };
            }
            return { ok: false, reason: "missing or invalid Bearer token" };
        };

        try {
            // ── Home ──────────────────────────────────────────────────
            if (path === "/" && req.method === "GET") {
                return sendHtml(res, 200, homePage({ baseUrl: issuer, oauthEnabled: enableOAuth }));
            }

            if (path === "/health" && req.method === "GET") {
                const auth = enableOAuth ? (getBearer(req) ? store.verifyToken(getBearer(req)) : null) : null;
                return sendJson(res, 200, {
                    status: "ok",
                    oauth: enableOAuth,
                    issuer,
                    transports: transports.size,
                    store: store.countTokens(),
                    authenticated: !!auth,
                    version: process.env.npm_package_version || "1.1.3"
                });
            }

            // ── OAuth Discovery ───────────────────────────────────────
            if ((path === "/.well-known/oauth-authorization-server" || path === "/.well-known/oauth-authorization-server/") && req.method === "GET") {
                return sendJson(res, 200, oauth.getAuthorizationServerMetadata());
            }
            if ((path === "/.well-known/oauth-protected-resource" || path === "/.well-known/oauth-protected-resource/mcp" || path.startsWith("/.well-known/oauth-protected-resource")) && req.method === "GET") {
                // Check for resource param
                const resource = url.searchParams.get("resource") || `${issuer}/mcp`;
                return sendJson(res, 200, oauth.getProtectedResourceMetadata(resource));
            }
            // Also support discovery at /oauth/.well-known/* for some clients
            if ((path === "/oauth/.well-known/oauth-authorization-server" || path === "/oauth/.well-known/openid-configuration") && req.method === "GET") {
                return sendJson(res, 200, oauth.getAuthorizationServerMetadata());
            }

            // ── Client Registration ───────────────────────────────────
            if (path === "/oauth/register" && req.method === "POST") {
                const body = await parseBody(req);
                const result = oauth.handleRegister(body);
                return sendJson(res, 201, result);
            }

            // ── OAuth Authorize (GET shows login, POST handles creds) ─
            if (path === "/oauth/authorize" && req.method === "GET") {
                // Validate params but still show login page; pass query through
                const validation = oauth.validateAuthorizeParams(query);
                if (!validation.valid) {
                    return sendHtml(res, 400, errorPage({ status: 400, message: "Invalid authorize request", detail: validation.error }));
                }
                return sendHtml(res, 200, loginPage({ query }));
            }

            if (path === "/oauth/authorize" && req.method === "POST") {
                const body = await parseBody(req);
                // Merge query params from URL and body (some clients POST with query in URL)
                const mergedQuery = { ...query, ...body };
                // Extract credentials: support username/password or api_key/api_secret
                const username = body.username || body.api_key || body.apiKey || body.email || "";
                const password = body.password || body.api_secret || body.apiSecret || "";

                // Also support redirect_uri etc coming from body if not in query
                const authQuery = {
                    client_id: mergedQuery.client_id || query.client_id,
                    redirect_uri: mergedQuery.redirect_uri || query.redirect_uri,
                    response_type: mergedQuery.response_type || query.response_type || "code",
                    scope: mergedQuery.scope || query.scope,
                    state: mergedQuery.state || query.state,
                    code_challenge: mergedQuery.code_challenge || query.code_challenge,
                    code_challenge_method: mergedQuery.code_challenge_method || query.code_challenge_method
                };

                const result = await oauth.authorizeWithCredentials({
                    query: authQuery,
                    username,
                    password,
                    apiKey: body.api_key || body.apiKey,
                    apiSecret: body.api_secret || body.apiSecret
                });

                if (!result.ok) {
                    // Re-render login with error, preserving query
                    return sendHtml(res, 200, loginPage({ error: result.error, query: authQuery }));
                }

                // Success → redirect to redirect_uri with code & state
                if (result.redirect_uri) {
                    const redirect = new URL(result.redirect_uri);
                    redirect.searchParams.set("code", result.code);
                    if (result.state) redirect.searchParams.set("state", result.state);
                    res.writeHead(302, { Location: redirect.toString(), ...corsHeaders() });
                    return res.end();
                } else {
                    // No redirect_uri → show code directly (for manual copy)
                    return sendHtml(res, 200, `<html><body style="font-family:system-ui;padding:32px"><h2>Authorization successful</h2><p>Copy your code:</p><code style="background:#eee;padding:12px;display:block;word-break:break-all">${result.code}</code><p>State: ${result.state || "(none)"}</p></body></html>`);
                }
            }

            // Also support /login alias
            if ((path === "/login" || path === "/oauth/login") && req.method === "GET") {
                return sendHtml(res, 200, loginPage({ query }));
            }
            if ((path === "/login" || path === "/oauth/login") && req.method === "POST") {
                const body = await parseBody(req);
                const username = body.username || body.api_key || "";
                const password = body.password || body.api_secret || "";
                // Validate creds directly via Freedcamp without code flow — issue tokens directly and show them
                const handler = new FreedcampHandler(username.trim(), password.trim(), undefined, { sessionFilePath: null });
                try {
                    await handler.initialize();
                    const tokens = store.createTokens({ apiKey: username.trim(), apiSecret: password.trim(), client_id: "login-form", scope: "mcp" });
                    return sendHtml(res, 200, `<html><head><meta charset="utf-8"/><style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;padding:32px} code{background:#1e293b;padding:12px;display:block;border-radius:8px;word-break:break-all;margin:8px 0} .card{background:#1e293b;padding:24px;border-radius:12px;max-width:700px}</style></head><body><div class="card"><h2>✅ Login successful</h2><p>Your tokens (keep them safe):</p><p><strong>access_token</strong><code>${tokens.access_token}</code></p><p><strong>refresh_token</strong><code>${tokens.refresh_token}</code></p><p>Use as <code>Authorization: Bearer &lt;access_token&gt;</code> for MCP calls to <code>${issuer}/sse</code></p><p><a href="/" style="color:#38bdf8">← Home</a></p></div></body></html>`);
                } catch (e) {
                    return sendHtml(res, 200, loginPage({ error: `Login failed: ${e.message}`, query }));
                }
            }

            // ── Token endpoint ────────────────────────────────────────
            if (path === "/oauth/token" && req.method === "POST") {
                const body = await parseBody(req);
                const result = await oauth.handleToken(body, req.headers);
                if (!result.ok) {
                    return sendJson(res, result.status || 400, { error: result.error, error_description: result.description }, { "WWW-Authenticate": `Bearer error="${result.error}"` });
                }
                // Success — include expires_in etc.
                return sendJson(res, 200, result.tokens);
            }

            // Token revocation
            if ((path === "/oauth/revoke" || path === "/oauth/revoke_token") && req.method === "POST") {
                const body = await parseBody(req);
                const result = await oauth.handleRevoke(body);
                if (!result.ok) return sendJson(res, 400, { error: result.error });
                return sendJson(res, 200, { ok: true });
            }

            // Userinfo
            if (path === "/oauth/userinfo" && req.method === "GET") {
                const token = getBearer(req);
                if (!token) return sendJson(res, 401, { error: "missing token" }, { "WWW-Authenticate": 'Bearer realm="mcp", error="invalid_token"' });
                const info = oauth.handleUserInfo(token);
                if (!info) return sendJson(res, 401, { error: "invalid_token" }, { "WWW-Authenticate": 'Bearer error="invalid_token"' });
                return sendJson(res, 200, info);
            }

            // Also support introspection style
            if (path === "/oauth/introspect" && req.method === "POST") {
                const body = await parseBody(req);
                const token = body.token || getBearer(req);
                const entry = token ? store.verifyToken(token) : null;
                if (!entry) return sendJson(res, 200, { active: false });
                return sendJson(res, 200, { active: true, scope: entry.scope, client_id: entry.client_id, exp: Math.floor(entry.expiresAt / 1000) });
            }

            // ── MCP SSE ───────────────────────────────────────────────
            // GET /sse → establish SSE connection (requires auth if OAuth enabled)
            // POST /messages → handle client messages (requires same auth, but we check session-based transport)
            // Also support /mcp as alias

            const isSseGet = (path === "/sse" || path === "/mcp") && req.method === "GET";
            const isMessagesPost = (path === "/messages" || path === "/mcp/messages" || path === "/mcp/message") && req.method === "POST";

            // Also handle legacy /sse/messages?
            // For flexibility, handle POST to /sse? and /messages with sessionId query

            if (isSseGet) {
                // Auth check
                let fcHandler = null;
                let authInfo = null;

                if (enableOAuth) {
                    const token = getBearer(req) || url.searchParams.get("access_token") || null;
                    if (token) {
                        const entry = store.verifyToken(token);
                        if (entry) {
                            authInfo = entry;
                            fcHandler = new FreedcampHandler(entry.apiKey, entry.apiSecret, undefined, { sessionFilePath: null });
                            try {
                                await fcHandler.initialize();
                            } catch (e) {
                                return sendJson(res, 401, { error: "Freedcamp auth failed for token", detail: e.message });
                            }
                        } else {
                            // Invalid token
                            res.writeHead(401, { "Content-Type": "application/json", "WWW-Authenticate": 'Bearer error="invalid_token", error_description="Invalid or expired access token"', ...corsHeaders() });
                            return res.end(JSON.stringify({ error: "invalid_token", error_description: "Invalid or expired access token. Obtain a new one via POST /oauth/token" }));
                        }
                    } else if (allowEnvFallback && envApiKey && envApiSecret) {
                        // Fallback to env creds (dev mode)
                        fcHandler = new FreedcampHandler(envApiKey, envApiSecret, undefined, { sessionFilePath: null });
                        await fcHandler.initialize();
                        authInfo = { fallback: true, apiKey: envApiKey };
                    } else {
                        // No token → tell client where to auth
                        const wwwAuth = `Bearer realm="mcp", resource_metadata="${issuer}/.well-known/oauth-protected-resource"`;
                        res.writeHead(401, { "Content-Type": "application/json", "WWW-Authenticate": wwwAuth, ...corsHeaders() });
                        return res.end(JSON.stringify({
                            error: "unauthorized",
                            error_description: "Missing Bearer token. Authenticate via OAuth: GET /oauth/authorize or POST /oauth/token with grant_type=password",
                            authorization_url: `${issuer}/oauth/authorize`
                        }));
                    }
                } else {
                    // OAuth disabled → use env creds
                    if (!envApiKey || !envApiSecret) {
                        return sendJson(res, 500, { error: "server misconfigured: FREEDCAMP_API_KEY/SECRET not set and OAuth disabled" });
                    }
                    fcHandler = new FreedcampHandler(envApiKey, envApiSecret, undefined, { sessionFilePath: null });
                    await fcHandler.initialize();
                }

                // Create SSE transport
                // The endpoint for client POSTs is /messages?sessionId=...
                const transport = new SSEServerTransport("/messages", res);
                const mcpServer = createMcpServer(fcHandler);
                transports.set(transport.sessionId, { transport, server: mcpServer, fc: fcHandler, authInfo });

                // Clean up on close
                res.on("close", () => {
                    transports.delete(transport.sessionId);
                });

                await mcpServer.connect(transport);
                return; // SSE transport handles response
            }

            if (isMessagesPost || (path === "/messages" && req.method === "POST") || (path.startsWith("/messages") && req.method === "POST")) {
                const sessionId = url.searchParams.get("sessionId") || query.sessionId;
                if (!sessionId) {
                    return sendJson(res, 400, { error: "missing sessionId query param" });
                }
                const entry = transports.get(sessionId);
                if (!entry) {
                    return sendJson(res, 404, { error: "no transport for sessionId", sessionId });
                }
                // For messages, auth was already validated at SSE connection time.
                // Optionally re-validate Bearer if provided, but allow existing session
                await entry.transport.handlePostMessage(req, res);
                return;
            }

            // ── Stateless Streamable HTTP (POST /mcp) ───────────────────────
            // For clients that speak Streamable HTTP / JSON-RPC over POST (MCP 2025-03-26)
            // We support a lightweight stateless handler that does not require SSE.
            if ((path === "/mcp" || path === "/mcp/") && req.method === "POST") {
                const token = getBearer(req);
                let fcHandler = null;
                if (enableOAuth && token) {
                    const verified = store.verifyToken(token);
                    if (!verified) return sendJson(res, 401, { error: "invalid_token" }, { "WWW-Authenticate": 'Bearer error="invalid_token"' });
                    fcHandler = new FreedcampHandler(verified.apiKey, verified.apiSecret, undefined, { sessionFilePath: null });
                    try { await fcHandler.initialize(); } catch (e) { return sendJson(res, 401, { error: "Freedcamp auth failed", detail: e.message }); }
                } else if (enableOAuth && !token) {
                    if (allowEnvFallback && envApiKey && envApiSecret) {
                        fcHandler = new FreedcampHandler(envApiKey, envApiSecret, undefined, { sessionFilePath: null });
                        await fcHandler.initialize();
                    } else {
                        return sendJson(res, 401, { error: "unauthorized", hint: `POST ${issuer}/oauth/token with grant_type=password` }, { "WWW-Authenticate": `Bearer realm="mcp", resource_metadata="${issuer}/.well-known/oauth-protected-resource"` });
                    }
                } else {
                    if (!envApiKey || !envApiSecret) return sendJson(res, 500, { error: "server misconfigured: FREEDCAMP_API_KEY/SECRET not set" });
                    fcHandler = new FreedcampHandler(envApiKey, envApiSecret, undefined, { sessionFilePath: null });
                    await fcHandler.initialize();
                }

                // Parse JSON-RPC body
                let body;
                try { body = await parseBody(req); } catch (e) { return sendJson(res, 400, { error: "invalid json", detail: e.message }); }
                // Support both single and batch? For now single
                const handleOne = async (msg) => {
                    const { jsonrpc, id, method, params } = msg || {};
                    if (jsonrpc !== "2.0") return { jsonrpc: "2.0", id: id || null, error: { code: -32600, message: "Invalid Request" } };
                    if (method === "initialize") {
                        return { jsonrpc: "2.0", id, result: { protocolVersion: params?.protocolVersion || "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "freedcamp-mcp-server", version: "1.1.3" } } };
                    }
                    if (method === "ping") {
                        return { jsonrpc: "2.0", id, result: {} };
                    }
                    if (method === "notifications/initialized") {
                        return null; // no response for notification
                    }
                    if (method === "tools/list") {
                        const { getTools } = await import("./mcp.js");
                        // avoid circular – we already have tools via createMcpServer but simpler to import
                        const tools = getTools();
                        const { z } = await import("zod");
                        const { zodToJsonSchema } = await import("zod-to-json-schema");
                        const { ApiResponseSchema } = await import("../../common/types.js");
                        // we need to map tools to MCP spec
                        const list = tools.map(({ name, description, schema, outputSchema }) => ({
                            name, description,
                            inputSchema: zodToJsonSchema(schema),
                            outputSchema: zodToJsonSchema(outputSchema || ApiResponseSchema),
                            annotations: { readOnlyHint: /^fc_(fetch|validate)_/.test(name), destructiveHint: /^fc_delete_/.test(name) || name === "fc_leave_project", idempotentHint: /^fc_(fetch|validate|delete|edit|update)_/.test(name), openWorldHint: true }
                        }));
                        return { jsonrpc: "2.0", id, result: { tools: list } };
                    }
                    if (method === "tools/call") {
                        const { name, arguments: args } = params || {};
                        // Reuse per-request handler by creating ephemeral MCP server and calling its handler?
                        // Easier: directly import and switch like mcp.js does. We can reuse createMcpServer's logic via a helper.
                        // For stateless, we create a temp server and invoke its internal handler via fcHandler
                        const { createMcpServer } = await import("./mcp.js");
                        // Instead of going through Server, directly call fc handler via a mini dispatch
                        // We'll instantiate a server and use its _requestHandlers? Simpler to duplicate the switch here
                        // To avoid duplication, we call the handler method directly by importing operations
                        try {
                            // Lazy import operations to avoid circular
                            const tasks = await import("../../operations/tasks.js");
                            const lists = await import("../../operations/lists.js");
                            const comments = await import("../../operations/comments.js");
                            const events = await import("../../operations/events.js");
                            const discussions = await import("../../operations/discussions.js");
                            const issues = await import("../../operations/issues.js");
                            const milestones = await import("../../operations/milestones.js");
                            const times = await import("../../operations/times.js");
                            const wikis = await import("../../operations/wikis.js");
                            const projects = await import("../../operations/projects.js");
                            const crm = await import("../../operations/crm.js");
                            const users = await import("../../operations/users.js");
                            const notifications = await import("../../operations/notifications.js");
                            const misc = await import("../../operations/misc.js");
                            const files = await import("../../operations/files.js");
                            const { z } = await import("zod");
                            const ok = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data });
                            let result;
                            switch (name) {
                                case "fc_fetch_task": result = await fcHandler.fetchTask(tasks.FetchTaskSchema.parse(args)); break;
                                case "fc_fetch_tasks": result = await fcHandler.fetchTasks(tasks.FetchTasksSchema.parse(args)); break;
                                case "fc_add_task": result = await fcHandler.addTask(tasks.AddTaskSchema.parse(args)); break;
                                case "fc_update_task": result = await fcHandler.updateTask(tasks.UpdateTaskSchema.parse(args)); break;
                                case "fc_delete_task": result = await fcHandler.deleteTask(tasks.DeleteTaskSchema.parse(args)); break;
                                case "fc_fetch_lists": result = await fcHandler.fetchLists(lists.FetchListsSchema.parse(args)); break;
                                case "fc_add_list": result = await fcHandler.addList(lists.AddListSchema.parse(args)); break;
                                case "fc_edit_list": result = await fcHandler.editList(lists.EditListSchema.parse(args)); break;
                                case "fc_delete_list": result = await fcHandler.deleteList(lists.DeleteListSchema.parse(args)); break;
                                case "fc_add_comment": result = await fcHandler.addComment(comments.AddCommentSchema.parse(args)); break;
                                case "fc_edit_comment": result = await fcHandler.editComment(comments.EditCommentSchema.parse(args)); break;
                                case "fc_delete_comment": result = await fcHandler.deleteComment(comments.DeleteCommentSchema.parse(args)); break;
                                case "fc_fetch_events": result = await fcHandler.fetchEvents(events.FetchEventsSchema.parse(args)); break;
                                case "fc_fetch_event": result = await fcHandler.fetchEvent(events.FetchEventSchema.parse(args)); break;
                                case "fc_add_event": result = await fcHandler.addEvent(events.AddEventSchema.parse(args)); break;
                                case "fc_edit_event": result = await fcHandler.editEvent(events.EditEventSchema.parse(args)); break;
                                case "fc_delete_event": result = await fcHandler.deleteEvent(events.DeleteEventSchema.parse(args)); break;
                                case "fc_fetch_discussions": result = await fcHandler.fetchDiscussions(discussions.FetchDiscussionsSchema.parse(args)); break;
                                case "fc_fetch_discussion": result = await fcHandler.fetchDiscussion(discussions.FetchDiscussionSchema.parse(args)); break;
                                case "fc_add_discussion": result = await fcHandler.addDiscussion(discussions.AddDiscussionSchema.parse(args)); break;
                                case "fc_edit_discussion": result = await fcHandler.editDiscussion(discussions.EditDiscussionSchema.parse(args)); break;
                                case "fc_delete_discussion": result = await fcHandler.deleteDiscussion(discussions.DeleteDiscussionSchema.parse(args)); break;
                                case "fc_fetch_issues": result = await fcHandler.fetchIssues(issues.FetchIssuesSchema.parse(args)); break;
                                case "fc_fetch_issue": result = await fcHandler.fetchIssue(issues.FetchIssueSchema.parse(args)); break;
                                case "fc_add_issue": result = await fcHandler.addIssue(issues.AddIssueSchema.parse(args)); break;
                                case "fc_edit_issue": result = await fcHandler.editIssue(issues.EditIssueSchema.parse(args)); break;
                                case "fc_delete_issue": result = await fcHandler.deleteIssue(issues.DeleteIssueSchema.parse(args)); break;
                                case "fc_fetch_milestones": result = await fcHandler.fetchMilestones(milestones.FetchMilestonesSchema.parse(args)); break;
                                case "fc_fetch_milestone": result = await fcHandler.fetchMilestone(milestones.FetchMilestoneSchema.parse(args)); break;
                                case "fc_add_milestone": result = await fcHandler.addMilestone(milestones.AddMilestoneSchema.parse(args)); break;
                                case "fc_edit_milestone": result = await fcHandler.editMilestone(milestones.EditMilestoneSchema.parse(args)); break;
                                case "fc_delete_milestone": result = await fcHandler.deleteMilestone(milestones.DeleteMilestoneSchema.parse(args)); break;
                                case "fc_fetch_times": result = await fcHandler.fetchTimes(times.FetchTimesSchema.parse(args)); break;
                                case "fc_fetch_time": result = await fcHandler.fetchTime(times.FetchTimeSchema.parse(args)); break;
                                case "fc_add_time": result = await fcHandler.addTime(times.AddTimeSchema.parse(args)); break;
                                case "fc_edit_time": result = await fcHandler.editTime(times.EditTimeSchema.parse(args)); break;
                                case "fc_delete_time": result = await fcHandler.deleteTime(times.DeleteTimeSchema.parse(args)); break;
                                case "fc_time_action": result = await fcHandler.timeAction(times.TimeActionSchema.parse(args)); break;
                                case "fc_fetch_wikis": result = await fcHandler.fetchWikis(wikis.FetchWikisSchema.parse(args)); break;
                                case "fc_fetch_wiki": result = await fcHandler.fetchWiki(wikis.FetchWikiSchema.parse(args)); break;
                                case "fc_add_wiki": result = await fcHandler.addWiki(wikis.AddWikiSchema.parse(args)); break;
                                case "fc_edit_wiki": result = await fcHandler.editWiki(wikis.EditWikiSchema.parse(args)); break;
                                case "fc_delete_wiki": result = await fcHandler.deleteWiki(wikis.DeleteWikiSchema.parse(args)); break;
                                case "fc_add_wiki_version": result = await fcHandler.addWikiVersion(wikis.AddWikiVersionSchema.parse(args)); break;
                                case "fc_fetch_projects": result = await fcHandler.fetchProjects(); break;
                                case "fc_fetch_project": result = await fcHandler.fetchProject(projects.FetchProjectSchema.parse(args)); break;
                                case "fc_fetch_recent_project_ids": result = await fcHandler.fetchRecentProjectIds(); break;
                                case "fc_add_project": result = await fcHandler.addProject(projects.AddProjectSchema.parse(args)); break;
                                case "fc_edit_project": result = await fcHandler.editProject(projects.EditProjectSchema.parse(args)); break;
                                case "fc_leave_project": result = await fcHandler.leaveProject(projects.LeaveProjectSchema.parse(args)); break;
                                case "fc_delete_project": result = await fcHandler.deleteProject(projects.DeleteProjectSchema.parse(args)); break;
                                case "fc_fetch_crm_tasks": result = await fcHandler.fetchCrmTasks(crm.FetchCrmTasksSchema.parse(args)); break;
                                case "fc_fetch_crm_task": result = await fcHandler.fetchCrmTask(crm.FetchCrmTaskSchema.parse(args)); break;
                                case "fc_add_crm_task": result = await fcHandler.addCrmTask(crm.AddCrmTaskSchema.parse(args)); break;
                                case "fc_edit_crm_task": result = await fcHandler.editCrmTask(crm.EditCrmTaskSchema.parse(args)); break;
                                case "fc_delete_crm_task": result = await fcHandler.deleteCrmTask(crm.DeleteCrmTaskSchema.parse(args)); break;
                                case "fc_fetch_crm_calls": result = await fcHandler.fetchCrmCalls(crm.FetchCrmCallsSchema.parse(args)); break;
                                case "fc_fetch_crm_call": result = await fcHandler.fetchCrmCall(crm.FetchCrmCallSchema.parse(args)); break;
                                case "fc_add_crm_call": result = await fcHandler.addCrmCall(crm.AddCrmCallSchema.parse(args)); break;
                                case "fc_edit_crm_call": result = await fcHandler.editCrmCall(crm.EditCrmCallSchema.parse(args)); break;
                                case "fc_delete_crm_call": result = await fcHandler.deleteCrmCall(crm.DeleteCrmCallSchema.parse(args)); break;
                                case "fc_fetch_groups": result = await fcHandler.fetchGroups(); break;
                                case "fc_fetch_users": result = await fcHandler.fetchUsers(); break;
                                case "fc_fetch_current_user": result = await fcHandler.fetchCurrentUser(); break;
                                case "fc_fetch_user": result = await fcHandler.fetchUser(users.FetchUserSchema.parse(args)); break;
                                case "fc_update_current_user": result = await fcHandler.updateCurrentUser(users.UpdateCurrentUserSchema.parse(args)); break;
                                case "fc_register_user": result = await fcHandler.registerUser(users.RegisterUserSchema.parse(args)); break;
                                case "fc_delete_account": result = await fcHandler.deleteAccount(users.DeleteAccountSchema.parse(args)); break;
                                case "fc_request_password_reset": result = await fcHandler.requestPasswordReset(users.RequestPasswordResetSchema.parse(args)); break;
                                case "fc_apply_password_reset": result = await fcHandler.applyPasswordReset(users.ApplyPasswordResetSchema.parse(args)); break;
                                case "fc_validate_email": result = await fcHandler.validateEmail(users.ValidateEmailSchema.parse(args)); break;
                                case "fc_delete_avatar": result = await fcHandler.deleteAvatar(); break;
                                case "fc_fetch_notifications": result = await fcHandler.fetchNotifications(); break;
                                case "fc_fetch_notifications_by_project": result = await fcHandler.fetchNotificationsByProject(notifications.FetchNotificationsByProjectSchema.parse(args)); break;
                                case "fc_update_notification_read": { const { uid } = notifications.UpdateNotificationReadSchema.parse(args); result = await fcHandler.updateNotificationRead(uid); break; }
                                case "fc_edit_notifications": result = await fcHandler.editNotifications(notifications.EditNotificationsSchema.parse(args)); break;
                                case "fc_fetch_file": result = await fcHandler.fetchFile(files.FetchFileSchema.parse(args)); break;
                                case "fc_add_file_meta": result = await fcHandler.addFileMeta(files.AddFileMetaSchema.parse(args)); break;
                                case "fc_upload_file": result = await fcHandler.uploadFile(files.UploadFileSchema.parse(args)); break;
                                case "fc_delete_file": result = await fcHandler.deleteFile(files.DeleteFileSchema.parse(args)); break;
                                case "fc_upload_avatar": result = await fcHandler.uploadAvatar(files.UploadAvatarSchema.parse(args)); break;
                                case "fc_fetch_cf_templates": result = await fcHandler.fetchCfTemplates(misc.FetchCfTemplatesSchema.parse(args)); break;
                                case "fc_fetch_linked_items": result = await fcHandler.fetchLinkedItems(misc.FetchLinkedItemsSchema.parse(args)); break;
                                case "fc_add_linked_items": result = await fcHandler.addLinkedItems(misc.AddLinkedItemsSchema.parse(args)); break;
                                case "fc_fetch_overview": result = await fcHandler.fetchOverview(misc.FetchOverviewSchema.parse(args)); break;
                                case "fc_fetch_current_session": result = await fcHandler.fetchCurrentSession(); break;
                                case "fc_fetch_invitations": result = await fcHandler.fetchInvitations(); break;
                                case "fc_respond_invitation": result = await fcHandler.respondInvitation(misc.RespondInvitationSchema.parse(args)); break;
                                case "fc_fetch_calendar_items": result = await fcHandler.fetchCalendarItems(misc.FetchCalendarItemsSchema.parse(args)); break;
                                case "fc_add_favorite_project": result = await fcHandler.addFavoriteProject(misc.FavoriteProjectSchema.parse(args)); break;
                                case "fc_delete_favorite_project": result = await fcHandler.deleteFavoriteProject(misc.FavoriteProjectSchema.parse(args)); break;
                                case "fc_fetch_timezones": result = await fcHandler.fetchTimezones(); break;
                                case "fc_fetch_backups": result = await fcHandler.fetchBackups(); break;
                                case "fc_fetch_wipe_current": result = await fcHandler.fetchWipeCurrent(); break;
                                default: throw new Error(`Unknown tool: ${name}`);
                            }
                            const okPayload = { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result };
                            return { jsonrpc: "2.0", id, result: okPayload };
                        } catch (err) {
                            const message = err instanceof z.ZodError ? `Invalid input for ${name}: ${err.errors.map((e) => `${e.path.join(".") || "(root)"}: ${e.message}`).join("; ")}` : err.message || String(err);
                            return { jsonrpc: "2.0", id, error: { code: -32603, message } };
                        }
                    }
                    if (method === "tools/call") { /* handled above */ }
                    return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
                };

                if (Array.isArray(body)) {
                    const results = [];
                    for (const m of body) {
                        const r = await handleOne(m);
                        if (r) results.push(r);
                    }
                    return sendJson(res, 200, results);
                } else if (body && body.jsonrpc) {
                    const r = await handleOne(body);
                    if (!r) return sendJson(res, 202, {});
                    return sendJson(res, 200, r);
                } else {
                    return sendJson(res, 400, { error: "invalid JSON-RPC", body });
                }
            }

            if ((path === "/mcp" || path === "/sse") && req.method === "POST") {
                return sendJson(res, 401, { error: "Use POST /mcp for Streamable HTTP (JSON-RPC) or GET /sse for SSE. For POST /mcp, send JSON-RPC with Authorization: Bearer <token>" }, { "WWW-Authenticate": `Bearer realm="mcp"` });
            }

            // ── Not found ─────────────────────────────────────────────
            return sendJson(res, 404, { error: "not found", path, method: req.method, hint: "see GET / for docs" });
        } catch (e) {
            console.error("[http] error handling", req.method, url.pathname, e);
            if (!res.headersSent) {
                return sendJson(res, 500, { error: "internal error", message: e.message });
            }
            try { res.end(); } catch {}
        }
    });

    // Extra: handle upgrade? not needed

    return {
        server,
        transports,
        issuer,
        listen() {
            return new Promise((resolve, reject) => {
                server.listen(port, host, (err) => {
                    if (err) return reject(err);
                    console.error(`Freedcamp MCP HTTP server listening on ${host}:${port} (issuer ${issuer})`);
                    if (enableOAuth) {
                        console.error(`  OAuth discovery: ${issuer}/.well-known/oauth-authorization-server`);
                        console.error(`  Login:           ${issuer}/oauth/authorize`);
                        console.error(`  Token:           ${issuer}/oauth/token (grant_type=password)`);
                    }
                    console.error(`  MCP SSE:         ${issuer}/sse  (Bearer required${allowEnvFallback ? " or env fallback" : ""})`);
                    resolve(server);
                });
            });
        },
        close() {
            return new Promise((resolve) => server.close(resolve));
        }
    };
}
