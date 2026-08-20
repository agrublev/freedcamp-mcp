import crypto from "crypto";
import FreedcampHandler from "../../operations/fc-handler.js";
import { pkceChallenge, verifyPkce } from "./tokens.js";

/**
 * Hosted "mimicked" OAuth server.
 * Implements a minimal OAuth 2.1 Authorization Code + PKCE flow where the
 * user's "username" is their FREEDCAMP_API_KEY and "password" is FREEDCAMP_API_SECRET.
 * After login we validate credentials against the real Freedcamp API
 * (GET /sessions/current) and then issue our own tokens.
 *
 * Endpoints handled:
 *  - GET  /.well-known/oauth-authorization-server
 *  - GET  /.well-known/oauth-protected-resource
 *  - POST /oauth/register
 *  - GET  /oauth/authorize
 *  - POST /oauth/authorize
 *  - POST /oauth/token
 *  - POST /oauth/revoke
 *  - GET  /oauth/userinfo (optional)
 *  - POST /oauth/token with grant_type=password (ROPC mimic)
 */

export class OAuthServer {
    constructor({ store, issuer, baseUrl }) {
        this.store = store;
        this.issuer = issuer || baseUrl || "http://localhost:3000";
        this.baseUrl = baseUrl || this.issuer;
    }

    // ── Discovery: RFC 8414 ───────────────────────────────────────────────

    getAuthorizationServerMetadata() {
        const issuer = this.issuer;
        return {
            issuer,
            authorization_endpoint: `${issuer}/oauth/authorize`,
            token_endpoint: `${issuer}/oauth/token`,
            registration_endpoint: `${issuer}/oauth/register`,
            revocation_endpoint: `${issuer}/oauth/revoke`,
            // discovery for MCP clients expects these
            response_types_supported: ["code"],
            grant_types_supported: ["authorization_code", "refresh_token", "password"],
            code_challenge_methods_supported: ["S256", "plain"],
            token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic", "none"],
            scopes_supported: ["mcp", "read", "write"],
            // extra for convenience
            userinfo_endpoint: `${issuer}/oauth/userinfo`
        };
    }

    getProtectedResourceMetadata(resource = null) {
        const res = resource || `${this.issuer}/mcp`;
        return {
            resource: res,
            authorization_servers: [this.issuer],
            bearer_methods_supported: ["header"],
            scopes_supported: ["mcp"]
        };
    }

    // ── Client Registration (RFC 7591) ────────────────────────────────────

    handleRegister(body) {
        const redirect_uris = body.redirect_uris || [];
        const client_name = body.client_name || body.clientName || "MCP Client";
        const grant_types = body.grant_types || [];
        const response_types = body.response_types || [];

        const client = this.store.createClient({ redirect_uris, client_name, grant_types, response_types });
        return {
            client_id: client.client_id,
            client_secret: client.client_secret,
            client_name: client.client_name,
            redirect_uris: client.redirect_uris,
            grant_types: client.grant_types,
            response_types: client.response_types,
            token_endpoint_auth_method: "client_secret_post",
            client_id_issued_at: Math.floor(client.created_at / 1000)
        };
    }

    // ── Authorization (GET /authorize shows login, POST handles creds) ────

    /**
     * Validate authorize request params. Returns { valid, error, params }.
     */
    validateAuthorizeParams(query) {
        const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method, code_challenge_method: ccm2 } = query;
        const challengeMethod = code_challenge_method || ccm2 || (code_challenge ? "S256" : null);

        if (!client_id) return { valid: false, error: "missing client_id" };
        if (response_type !== "code") return { valid: false, error: "unsupported response_type (only 'code' allowed)" };

        const client = this.store.getClient(client_id);
        if (!client) return { valid: false, error: "unknown client_id" };

        if (redirect_uri && client.redirect_uris.length > 0 && !client.redirect_uris.includes(redirect_uri)) {
            return { valid: false, error: "invalid redirect_uri" };
        }

        return {
            valid: true,
            params: {
                client_id,
                redirect_uri: redirect_uri || client.redirect_uris[0] || null,
                scope: scope || "mcp",
                state: state || null,
                code_challenge: code_challenge || null,
                code_challenge_method: challengeMethod || "S256"
            }
        };
    }

    /**
     * After user submits username/password at /oauth/authorize,
     * validate them against Freedcamp and create an authorization code.
     */
    async authorizeWithCredentials({ query, username, password, apiKey, apiSecret }) {
        // Support both naming conventions: username/password as apiKey/secret OR explicit api_key/api_secret
        const key = (apiKey || username || "").trim();
        const secret = (apiSecret || password || "").trim();

        if (!key || !secret) {
            return { ok: false, error: "Both API Key (username) and API Secret (password) are required" };
        }

        // Validate against real Freedcamp API
        try {
            const handler = new FreedcampHandler(key, secret, undefined, { sessionFilePath: null });
            await handler.initialize();
            // If we got here, credentials are valid. Try to get user info for display
            const session = handler.getSession();
            const userId = session?.user_id || session?.id || null;

            const validation = this.validateAuthorizeParams(query);
            if (!validation.valid) return { ok: false, error: validation.error };

            const { client_id, redirect_uri, scope, code_challenge, code_challenge_method } = validation.params;

            const code = this.store.createCode({
                client_id,
                redirect_uri,
                apiKey: key,
                apiSecret: secret,
                userId,
                scope,
                code_challenge,
                code_challenge_method
            });

            return {
                ok: true,
                code,
                redirect_uri,
                state: validation.params.state,
                userId,
                session
            };
        } catch (e) {
            const msg = e.message || String(e);
            // Provide actionable hint
            if (msg.includes("401") || msg.includes("auth")) {
                return { ok: false, error: "Invalid Freedcamp API Key / Secret (authentication failed). Check your credentials at Freedcamp → Settings → API." };
            }
            return { ok: false, error: `Credential validation failed: ${msg}` };
        }
    }

    // ── Token endpoint ────────────────────────────────────────────────────

    async handleToken(body, headers = {}) {
        // Support both application/x-www-form-urlencoded and JSON
        let { grant_type, code, redirect_uri, client_id, client_secret, code_verifier, username, password, refresh_token, scope } = body;

        // Also try to extract client_id/secret from Basic auth header
        if (!client_id && headers.authorization) {
            const match = headers.authorization.match(/^Basic\s+(.+)$/i);
            if (match) {
                try {
                    const decoded = Buffer.from(match[1], "base64").toString("utf8");
                    const [cid, csec] = decoded.split(":");
                    client_id = client_id || cid;
                    client_secret = client_secret || csec;
                } catch {}
            }
        }

        // ── Authorization Code ────────────────────────────────────────────
        if (grant_type === "authorization_code") {
            if (!code) return { ok: false, status: 400, error: "invalid_request", description: "missing code" };

            const entry = this.store.consumeCode(code);
            if (!entry) return { ok: false, status: 400, error: "invalid_grant", description: "invalid or expired code" };

            // Validate client
            if (client_id && entry.client_id !== client_id) {
                return { ok: false, status: 400, error: "invalid_grant", description: "client_id mismatch" };
            }
            // Validate redirect_uri if provided
            if (redirect_uri && entry.redirect_uri && redirect_uri !== entry.redirect_uri) {
                return { ok: false, status: 400, error: "invalid_grant", description: "redirect_uri mismatch" };
            }
            // Validate client_secret if client is confidential
            if (entry.client_id) {
                const client = this.store.getClient(entry.client_id);
                if (client && client.client_secret) {
                    // If challenger sent client_secret, verify it; otherwise allow PKCE-only public clients
                    if (client_secret && client.client_secret !== client_secret) {
                        return { ok: false, status: 401, error: "invalid_client", description: "client authentication failed" };
                    }
                }
            }
            // Validate PKCE
            if (entry.code_challenge) {
                if (!code_verifier) {
                    return { ok: false, status: 400, error: "invalid_request", description: "code_verifier required" };
                }
                const ok = verifyPkce(entry.code_challenge, entry.code_challenge_method, code_verifier);
                if (!ok) {
                    return { ok: false, status: 400, error: "invalid_grant", description: "PKCE verification failed" };
                }
            }

            const tokens = this.store.createTokens({
                apiKey: entry.apiKey,
                apiSecret: entry.apiSecret,
                client_id: entry.client_id,
                scope: entry.scope,
                userId: entry.userId
            });

            return { ok: true, tokens };
        }

        // ── Refresh Token ─────────────────────────────────────────────────
        if (grant_type === "refresh_token") {
            if (!refresh_token) return { ok: false, status: 400, error: "invalid_request", description: "missing refresh_token" };
            const newTokens = this.store.refreshAccessToken(refresh_token);
            if (!newTokens) return { ok: false, status: 400, error: "invalid_grant", description: "invalid or expired refresh_token" };
            return { ok: true, tokens: newTokens };
        }

        // ── Password Grant (mimicked ROPC) ────────────────────────────────
        // This is our "normal username pass to login" shortcut: POST /oauth/token
        // with grant_type=password&username=<apiKey>&password=<apiSecret>
        if (grant_type === "password") {
            const key = (username || body.api_key || body.apiKey || "").trim();
            const secret = (password || body.api_secret || body.apiSecret || "").trim();
            if (!key || !secret) {
                return { ok: false, status: 400, error: "invalid_request", description: "username (API Key) and password (API Secret) required" };
            }
            // Validate against Freedcamp
            try {
                const handler = new FreedcampHandler(key, secret, undefined, { sessionFilePath: null });
                await handler.initialize();
                const session = handler.getSession();
                const userId = session?.user_id || null;

                // Optionally verify client if provided
                if (client_id) {
                    const client = this.store.getClient(client_id);
                    if (!client) return { ok: false, status: 400, error: "invalid_client", description: "unknown client_id" };
                    if (client_secret && client.client_secret !== client_secret) {
                        return { ok: false, status: 401, error: "invalid_client", description: "client authentication failed" };
                    }
                }

                const tokens = this.store.createTokens({
                    apiKey: key,
                    apiSecret: secret,
                    client_id: client_id || "password-grant",
                    scope: scope || "mcp",
                    userId
                });
                return { ok: true, tokens, userId, session };
            } catch (e) {
                return { ok: false, status: 401, error: "invalid_grant", description: `Freedcamp authentication failed: ${e.message}` };
            }
        }

        // ── Client Credentials (optional, treat like password but with client creds as Freedcamp creds) ──
        if (grant_type === "client_credentials") {
            // Allow using client_id/client_secret as Freedcamp apiKey/apiSecret for M2M
            // But also support standard client credentials with scopes
            const key = client_id;
            const secret = client_secret;
            if (!key || !secret) {
                return { ok: false, status: 400, error: "invalid_request", description: "client_id and client_secret required" };
            }
            // Check if this client_id corresponds to a registered OAuth client -> we should not treat it as Freedcamp creds then
            const oauthClient = this.store.getClient(key);
            if (oauthClient) {
                // It's an OAuth client; without user context, we can't issue a Freedcamp token.
                // For mimic, we issue a token but it will need Freedcamp creds stored? Instead reject and suggest password grant.
                return {
                    ok: false,
                    status: 400,
                    error: "unsupported_grant_type",
                    description: "client_credentials requires Freedcamp API Key/Secret as client_id/client_secret, or use password grant. Register a client then use authorization_code flow."
                };
            }
            // Treat as Freedcamp direct
            try {
                const handler = new FreedcampHandler(key, secret, undefined, { sessionFilePath: null });
                await handler.initialize();
                const tokens = this.store.createTokens({
                    apiKey: key,
                    apiSecret: secret,
                    client_id: key,
                    scope: scope || "mcp"
                });
                return { ok: true, tokens };
            } catch (e) {
                return { ok: false, status: 401, error: "invalid_client", description: `Freedcamp authentication failed: ${e.message}` };
            }
        }

        return { ok: false, status: 400, error: "unsupported_grant_type", description: `grant_type '${grant_type}' not supported` };
    }

    async handleRevoke(body) {
        const token = body.token || body.refresh_token || body.access_token;
        if (!token) return { ok: false, status: 400, error: "invalid_request", description: "token required" };
        this.store.revokeToken(token);
        return { ok: true };
    }

    handleUserInfo(accessToken) {
        const entry = this.store.verifyToken(accessToken);
        if (!entry) return null;
        return {
            sub: entry.apiKey,
            api_key: entry.apiKey,
            user_id: entry.userId,
            scope: entry.scope,
            client_id: entry.client_id
        };
    }
}
