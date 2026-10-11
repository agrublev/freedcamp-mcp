// ── OAuth 2.1 authorization server for the Freedcamp MCP HTTP transport ────
//
// Freedcamp's API has no native OAuth2 support, so this module implements a
// small MCP OAuth authorization server (via the SDK's mcpAuthRouter) whose
// authorization page asks the user for their Freedcamp API key/secret (from
// https://freedcamp.com → Settings → API). The credentials are verified
// against the Freedcamp API, then exchanged for an opaque bearer token that
// MCP clients use in the Authorization header.
//
// The bearer token embeds the Freedcamp credentials, encrypted with
// AES-256-GCM using a key derived (scrypt) from the OAUTH_TOKEN_SECRET env
// var, so the server can serve many users without any server-side session
// storage. Set OAUTH_TOKEN_SECRET to a stable random value in production;
// otherwise a random secret is generated at startup (issuing new tokens on
// every restart).

import crypto from "crypto";
import { InvalidClientMetadataError, InvalidRequestError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import FreedcampHandler from "./operations/fc-handler.js";

const ACCESS_TOKEN_BYTES = 32;
const AUTH_CODE_BYTES = 32;
const SCRYPT_KEYLEN = 32;
const AUTH_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Redirect hosts of well-known MCP clients. Authorizing for any other web host
// shows a prominent warning on the consent page, since dynamic client
// registration is open and anyone can register a client with any redirect URI.
const DEFAULT_TRUSTED_REDIRECT_HOSTS = ["claude.ai", "claude.com", "chatgpt.com", "chat.openai.com"];
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * OAuthServerProvider implementation backed by Freedcamp API credentials.
 */
export class FreedcampOAuthProvider {
    constructor({ tokenSecret, allowedRedirectHosts } = {}) {
        // Key used to encrypt tokens. A random per-boot secret is secure (and
        // means nothing decryptable is ever persisted), but invalidates all
        // tokens on restart — production deployments should set
        // OAUTH_TOKEN_SECRET to a stable value.
        this._tokenSecret = tokenSecret || crypto.randomBytes(32).toString("hex");
        this._encryptionKey = null;
        // Pending authorization codes: code → { clientId, codeChallenge,
        // redirectUri, resource, scopes, credentials, expiresAt }
        this._authCodes = new Map();
        // Registered OAuth clients (dynamic client registration, in-memory)
        this._clients = new Map();
        // Optional strict mode (OAUTH_ALLOWED_REDIRECT_HOSTS): when set, web
        // redirect URIs must point at one of these hosts. Loopback and custom
        // URI schemes (desktop/CLI clients) are always allowed, since an
        // attacker cannot receive a code delivered to the victim's own machine.
        this._allowedRedirectHosts = allowedRedirectHosts?.length ? new Set(allowedRedirectHosts) : null;
        this._trustedRedirectHosts = new Set([...DEFAULT_TRUSTED_REDIRECT_HOSTS, ...(allowedRedirectHosts || [])]);
        this.clientsStore = {
            getClient: (clientId) => this._clients.get(clientId),
            registerClient: (client) => {
                for (const uri of client.redirect_uris || []) {
                    if (!this._redirectAllowed(uri)) {
                        throw new InvalidClientMetadataError(`redirect_uri not allowed: ${uri}`);
                    }
                }
                const full = {
                    ...client,
                    client_id: crypto.randomUUID(),
                    client_id_issued_at: Math.floor(Date.now() / 1000)
                };
                this._clients.set(full.client_id, full);
                return full;
            }
        };
    }

    /** Classifies a redirect URI: "local" (loopback/custom scheme), "trusted", or "unknown". */
    _redirectKind(uri) {
        let u;
        try {
            u = new URL(uri);
        } catch {
            return "unknown";
        }
        if (u.protocol !== "http:" && u.protocol !== "https:") return "local";
        if (LOOPBACK_HOSTS.has(u.hostname)) return "local";
        if (u.protocol === "https:" && this._trustedRedirectHosts.has(u.hostname)) return "trusted";
        return "unknown";
    }

    _redirectAllowed(uri) {
        if (!this._allowedRedirectHosts) return true;
        let u;
        try {
            u = new URL(uri);
        } catch {
            return false;
        }
        if (u.protocol !== "http:" && u.protocol !== "https:") return true;
        if (LOOPBACK_HOSTS.has(u.hostname)) return true;
        return u.protocol === "https:" && this._allowedRedirectHosts.has(u.hostname);
    }

    _key() {
        if (!this._encryptionKey) {
            this._encryptionKey = crypto.scryptSync(this._tokenSecret, "freedcamp-mcp-oauth", SCRYPT_KEYLEN);
        }
        return this._encryptionKey;
    }

    _encrypt(payload) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv("aes-256-gcm", this._key(), iv);
        const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
        const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
        const tag = cipher.getAuthTag();
        return Buffer.concat([iv, tag, encrypted]).toString("base64url");
    }

    _decrypt(token) {
        const raw = Buffer.from(String(token), "base64url");
        if (raw.length < 12 + 16 + 1) throw new Error("malformed token");
        const iv = raw.subarray(0, 12);
        const tag = raw.subarray(12, 28);
        const ciphertext = raw.subarray(28);
        const decipher = crypto.createDecipheriv("aes-256-gcm", this._key(), iv);
        decipher.setAuthTag(tag);
        const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        return JSON.parse(plaintext.toString("utf8"));
    }

    // ── Authorization page ─────────────────────────────────────────────────

    /**
     * GET: render a form asking for Freedcamp API credentials.
     * POST: verify the credentials against the Freedcamp API, then redirect
     * back to the MCP client with an authorization code.
     */
    async authorize(client, params, res) {
        const { state, redirectUri, codeChallenge, scopes = [], resource } = params;
        // Clients registered before an allowlist was configured are still in memory.
        if (!this._redirectAllowed(redirectUri)) {
            throw new InvalidRequestError("redirect_uri not allowed");
        }
        const consent = {
            clientName: typeof client.client_name === "string" && client.client_name.trim()
                ? client.client_name.trim().slice(0, 100)
                : "An unnamed application",
            redirectUri,
            kind: this._redirectKind(redirectUri)
        };
        const fields = {
            response_type: "code",
            client_id: client.client_id,
            redirect_uri: redirectUri,
            code_challenge: codeChallenge,
            code_challenge_method: "S256"
        };
        if (state !== undefined) fields.state = state;
        if (scopes.length) fields.scope = scopes.join(" ");
        if (resource) fields.resource = resource.href;

        const hiddenInputs = Object.entries(fields)
            .map(([k, v]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(v)}">`)
            .join("\n          ");

        if (res.req.method === "POST") {
            const body = res.req.body || {};
            const apiKey = typeof body.api_key === "string" ? body.api_key.trim() : "";
            const apiSecret = typeof body.api_secret === "string" ? body.api_secret.trim() : "";
            if (!apiKey || !apiSecret) {
                return this._renderForm(res, hiddenInputs, consent, "API key and secret are both required.");
            }
            try {
                await verifyFreedcampCredentials(apiKey, apiSecret);
            } catch {
                return this._renderForm(
                    res,
                    hiddenInputs,
                    consent,
                    "Those credentials were rejected by Freedcamp. Check the key and secret and try again."
                );
            }

            const code = crypto.randomBytes(AUTH_CODE_BYTES).toString("base64url");
            this._authCodes.set(code, {
                clientId: client.client_id,
                codeChallenge,
                redirectUri,
                resource: resource ? resource.href : undefined,
                scopes,
                credentials: { apiKey, apiSecret },
                expiresAt: Date.now() + AUTH_CODE_TTL_MS
            });

            const target = new URL(redirectUri);
            target.searchParams.set("code", code);
            if (state !== undefined) target.searchParams.set("state", state);
            res.redirect(target.href);
            return;
        }

        this._renderForm(res, hiddenInputs, consent);
    }

    _renderForm(res, hiddenInputs, consent, errorMessage) {
        // 400 (not 401) for form validation errors — this is a browser-based
        // OAuth page, and 401 would trigger WWW-Authenticate handling.
        res.status(errorMessage ? 400 : 200);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        // Credential-entry page: never framed (clickjacking), cached, or leaked via Referer.
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Referrer-Policy", "no-referrer");
        const destination = describeRedirect(consent.redirectUri);
        const warning = consent.kind === "unknown"
            ? `<div class="warn"><strong>Warning: unverified application.</strong> Your access will be handed to
         <strong>${escapeHtml(destination)}</strong>, which is not a known MCP client. Only continue if you started
         this connection yourself from an app you trust. Freedcamp will never email you a link asking for your API
         secret.</div>`
            : "";
        res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Connect Freedcamp</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #f6f7f9; margin: 0; display: flex; justify-content: center; padding: 3rem 1rem; }
      form { background: #fff; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,.08); max-width: 26rem; width: 100%; }
      h1 { font-size: 1.25rem; margin: 0 0 .5rem; }
      p { color: #555; font-size: .9rem; }
      label { display: block; font-size: .85rem; font-weight: 600; margin: 1rem 0 .25rem; }
      input[type=text], input[type=password] { width: 100%; box-sizing: border-box; padding: .55rem .7rem; border: 1px solid #ccd0d5; border-radius: 8px; font-size: .95rem; }
      button { margin-top: 1.5rem; width: 100%; padding: .65rem; border: 0; border-radius: 8px; background: #2563eb; color: #fff; font-size: 1rem; font-weight: 600; cursor: pointer; }
      .client { background: #f1f5f9; border-radius: 8px; padding: .7rem .8rem; font-size: .85rem; color: #334155; margin-top: 1rem; overflow-wrap: anywhere; }
      .warn { background: #fffbeb; border: 1px solid #f59e0b; color: #78350f; border-radius: 8px; padding: .7rem .8rem; font-size: .85rem; margin-top: 1rem; }
      .error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 8px; padding: .6rem .8rem; font-size: .85rem; margin-top: 1rem; }
    </style>
  </head>
  <body>
    <form method="post" autocomplete="off">
      <h1>Connect your Freedcamp account</h1>
      <p>Enter your Freedcamp API credentials. You can find them in Freedcamp under
         <strong>Settings &rarr; API</strong>. They are used only to access the Freedcamp API on your behalf.</p>
      <div class="client">
        <div><strong>${escapeHtml(consent.clientName)}</strong> <em>(name provided by the application)</em> is requesting full access to your Freedcamp account.</div>
        <div style="margin-top:.4rem">After you authorize, you will be sent to: <strong>${escapeHtml(destination)}</strong></div>
      </div>
      ${warning}
      ${hiddenInputs}
      <label for="api_key">API Key</label>
      <input id="api_key" name="api_key" type="text" required>
      <label for="api_secret">API Secret</label>
      <input id="api_secret" name="api_secret" type="password" required>
      ${errorMessage ? `<div class="error">${escapeHtml(errorMessage)}</div>` : ""}
      <button type="submit">Authorize</button>
    </form>
  </body>
</html>`);
    }

    // ── Code exchange ──────────────────────────────────────────────────────

    _takeCode(authorizationCode) {
        const entry = this._authCodes.get(authorizationCode);
        if (!entry) return undefined;
        this._authCodes.delete(authorizationCode); // single use
        if (entry.expiresAt < Date.now()) return undefined;
        return entry;
    }

    async challengeForAuthorizationCode(client, authorizationCode) {
        // Called by the SDK token handler for PKCE validation before the code
        // exchange, so this must peek (not consume) — the code is consumed in
        // exchangeAuthorizationCode below.
        const entry = this._authCodes.get(authorizationCode);
        if (!entry || entry.expiresAt < Date.now()) {
            throw new Error("Invalid authorization code");
        }
        return entry.codeChallenge;
    }

    async exchangeAuthorizationCode(client, authorizationCode, _codeVerifier, redirectUri, resource) {
        const entry = this._takeCode(authorizationCode);
        if (!entry || entry.clientId !== client.client_id) {
            throw new Error("Invalid authorization code");
        }
        if (redirectUri && entry.redirectUri && redirectUri !== entry.redirectUri) {
            throw new Error("redirect_uri does not match the authorization request");
        }
        const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 3600; // 30 days
        const tokenPayload = {
            apiKey: entry.credentials.apiKey,
            apiSecret: entry.credentials.apiSecret,
            clientId: client.client_id,
            scopes: entry.scopes,
            exp: expiresAt
        };
        if (entry.resource || resource) tokenPayload.resource = (resource?.href || entry.resource);
        return {
            token_type: "bearer",
            access_token: this._encrypt(tokenPayload),
            expires_in: 30 * 24 * 3600,
            ...(entry.scopes.length ? { scope: entry.scopes.join(" ") } : {})
        };
    }

    // ── Token verification (used by the bearer-auth middleware) ────────────

    async verifyAccessToken(token) {
        let payload;
        try {
            payload = this._decrypt(token);
        } catch {
            throw new Error("Invalid access token");
        }
        if (!payload || !payload.apiKey || !payload.apiSecret) {
            throw new Error("Invalid access token");
        }
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            throw new Error("Access token expired");
        }
        return {
            token,
            clientId: payload.clientId || "unknown",
            scopes: Array.isArray(payload.scopes) ? payload.scopes : [],
            expiresAt: payload.exp,
            ...(payload.resource ? { resource: new URL(payload.resource) } : {}),
            extra: { apiKey: payload.apiKey, apiSecret: payload.apiSecret }
        };
    }
}

/** Human-readable redirect destination: the host for web URLs, otherwise the scheme. */
function describeRedirect(uri) {
    try {
        const u = new URL(uri);
        if (u.protocol === "http:" || u.protocol === "https:") {
            return LOOPBACK_HOSTS.has(u.hostname) ? "an app on this computer (localhost)" : u.host;
        }
        return `an app on this device (${u.protocol}//)`;
    } catch {
        return String(uri);
    }
}

function escapeHtml(s) {
    return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

/**
 * Verifies Freedcamp API credentials by making one real API call. Uses a
 * throwaway handler so no session state is kept.
 */
async function verifyFreedcampCredentials(apiKey, apiSecret) {
    const handler = new FreedcampHandler(apiKey, apiSecret, undefined, { sessionFilePath: null });
    await handler.fetchSession();
    return handler.getSession();
}
