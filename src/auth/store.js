import fs from "fs";
import path from "path";
import crypto from "crypto";
import { randomId, randomToken } from "./tokens.js";

/**
 * In-memory OAuth store with optional JSON file persistence.
 * Holds: clients, authorization codes, tokens.
 *
 * This is a "mimicked" OAuth store - not a full RFC-compliant persistence
 * layer, but sufficient for single-instance MCP hosting.
 */
export class OAuthStore {
    constructor({ filePath = null, jwtSecret } = {}) {
        this.filePath = filePath;
        this.jwtSecret = jwtSecret || crypto.randomBytes(32).toString("hex");

        // Maps
        this.clients = new Map(); // client_id -> client
        this.codes = new Map(); // code -> { client_id, redirect_uri, apiKey, apiSecret, code_challenge, code_challenge_method, scope, expiresAt, userId }
        this.accessTokens = new Map(); // token -> { apiKey, apiSecret, client_id, scope, expiresAt, refreshToken, userId, tokenType }
        this.refreshTokens = new Map(); // refreshToken -> { apiKey, apiSecret, client_id, scope, accessToken }
        this.users = new Map(); // optional: apiKey -> { apiKey, apiSecret }

        if (filePath && fs.existsSync(filePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
                if (data.clients) for (const [k, v] of Object.entries(data.clients)) this.clients.set(k, v);
                if (data.accessTokens) for (const [k, v] of Object.entries(data.accessTokens)) this.accessTokens.set(k, v);
                if (data.refreshTokens) for (const [k, v] of Object.entries(data.refreshTokens)) this.refreshTokens.set(k, v);
            } catch (e) {
                console.error("[oauth-store] failed to load file:", e.message);
            }
        }

        // Periodic cleanup of expired entries (every 5 min)
        this._cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
        if (this._cleanupTimer.unref) this._cleanupTimer.unref();
    }

    persist() {
        if (!this.filePath) return;
        try {
            const data = {
                clients: Object.fromEntries(this.clients),
                accessTokens: Object.fromEntries(this.accessTokens),
                refreshTokens: Object.fromEntries(this.refreshTokens)
            };
            fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf8");
        } catch (e) {
            console.error("[oauth-store] persist failed:", e.message);
        }
    }

    cleanup() {
        const now = Date.now();
        for (const [code, entry] of this.codes) {
            if (entry.expiresAt < now) this.codes.delete(code);
        }
        for (const [token, entry] of this.accessTokens) {
            if (entry.expiresAt < now) this.accessTokens.delete(token);
        }
        // refresh tokens have longer expiry, keep until explicitly revoked unless expired
        for (const [rt, entry] of this.refreshTokens) {
            if (entry.expiresAt && entry.expiresAt < now) {
                this.refreshTokens.delete(rt);
                // also delete associated access token if exists
                if (entry.accessToken) this.accessTokens.delete(entry.accessToken);
            }
        }
    }

    // ── Clients ───────────────────────────────────────────────────────────

    createClient({ redirect_uris = [], client_name = "MCP Client", grant_types = [], response_types = [] } = {}) {
        const client_id = `fc_${randomId(16)}`;
        const client_secret = randomToken(32);
        const client = {
            client_id,
            client_secret,
            redirect_uris,
            client_name,
            grant_types: grant_types.length ? grant_types : ["authorization_code", "refresh_token"],
            response_types: response_types.length ? response_types : ["code"],
            created_at: Date.now()
        };
        this.clients.set(client_id, client);
        this.persist();
        return client;
    }

    getClient(client_id) {
        return this.clients.get(client_id) || null;
    }

    validateClient(client_id, client_secret = null, redirect_uri = null) {
        const client = this.getClient(client_id);
        if (!client) return null;
        if (client_secret && client.client_secret !== client_secret) return null;
        if (redirect_uri && client.redirect_uris.length > 0) {
            // Allow exact match or, if client registered no URIs, allow any (for leniency)
            if (!client.redirect_uris.includes(redirect_uri)) {
                // also allow localhost with different port? be lenient for dev
                // For security in production, this should be strict.
                // We'll check if any registered URI is a prefix, or allow all if wildcard
                // Simpler: reject unless exact match
                return null;
            }
        }
        return client;
    }

    // ── Authorization Codes ───────────────────────────────────────────────

    createCode({ client_id, redirect_uri, apiKey, apiSecret, userId = null, scope = "mcp", code_challenge = null, code_challenge_method = "S256" }) {
        const code = randomToken(32);
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min
        this.codes.set(code, {
            client_id,
            redirect_uri,
            apiKey,
            apiSecret,
            userId,
            scope,
            code_challenge,
            code_challenge_method,
            expiresAt
        });
        return code;
    }

    consumeCode(code) {
        const entry = this.codes.get(code);
        if (!entry) return null;
        this.codes.delete(code);
        if (entry.expiresAt < Date.now()) return null;
        return entry;
    }

    peekCode(code) {
        return this.codes.get(code) || null;
    }

    // ── Tokens ────────────────────────────────────────────────────────────

    createTokens({ apiKey, apiSecret, client_id, scope = "mcp", userId = null }) {
        const accessToken = randomToken(48);
        const refreshToken = randomToken(48);
        const now = Date.now();
        const accessExpiresAt = now + 3600 * 1000; // 1 hour
        const refreshExpiresAt = now + 30 * 24 * 3600 * 1000; // 30 days

        this.accessTokens.set(accessToken, {
            apiKey,
            apiSecret,
            client_id,
            scope,
            userId,
            expiresAt: accessExpiresAt,
            refreshToken,
            tokenType: "Bearer"
        });

        this.refreshTokens.set(refreshToken, {
            apiKey,
            apiSecret,
            client_id,
            scope,
            userId,
            accessToken,
            expiresAt: refreshExpiresAt
        });

        this.persist();
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: "Bearer",
            expires_in: 3600,
            scope
        };
    }

    getAccessToken(token) {
        const entry = this.accessTokens.get(token);
        if (!entry) return null;
        if (entry.expiresAt < Date.now()) {
            this.accessTokens.delete(token);
            return null;
        }
        return entry;
    }

    refreshAccessToken(refreshToken) {
        const entry = this.refreshTokens.get(refreshToken);
        if (!entry) return null;
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.refreshTokens.delete(refreshToken);
            return null;
        }
        // Invalidate old access token
        if (entry.accessToken) this.accessTokens.delete(entry.accessToken);

        const newAccessToken = randomToken(48);
        const newRefreshToken = randomToken(48);
        const now = Date.now();
        const accessExpiresAt = now + 3600 * 1000;
        const refreshExpiresAt = now + 30 * 24 * 3600 * 1000;

        // Remove old refresh entry and create new
        this.refreshTokens.delete(refreshToken);

        this.accessTokens.set(newAccessToken, {
            apiKey: entry.apiKey,
            apiSecret: entry.apiSecret,
            client_id: entry.client_id,
            scope: entry.scope,
            userId: entry.userId,
            expiresAt: accessExpiresAt,
            refreshToken: newRefreshToken,
            tokenType: "Bearer"
        });

        this.refreshTokens.set(newRefreshToken, {
            apiKey: entry.apiKey,
            apiSecret: entry.apiSecret,
            client_id: entry.client_id,
            scope: entry.scope,
            userId: entry.userId,
            accessToken: newAccessToken,
            expiresAt: refreshExpiresAt
        });

        this.persist();
        return {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            token_type: "Bearer",
            expires_in: 3600,
            scope: entry.scope
        };
    }

    revokeToken(token) {
        let revoked = false;
        if (this.accessTokens.has(token)) {
            const entry = this.accessTokens.get(token);
            this.accessTokens.delete(token);
            if (entry.refreshToken) this.refreshTokens.delete(entry.refreshToken);
            revoked = true;
        }
        if (this.refreshTokens.has(token)) {
            const entry = this.refreshTokens.get(token);
            this.refreshTokens.delete(token);
            if (entry.accessToken) this.accessTokens.delete(entry.accessToken);
            revoked = true;
        }
        if (revoked) this.persist();
        return revoked;
    }

    verifyToken(token) {
        return this.getAccessToken(token);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    countTokens() {
        return { access: this.accessTokens.size, refresh: this.refreshTokens.size, codes: this.codes.size, clients: this.clients.size };
    }

    close() {
        if (this._cleanupTimer) clearInterval(this._cleanupTimer);
    }
}
