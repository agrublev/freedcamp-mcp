import crypto from "crypto";

// ── Random helpers ────────────────────────────────────────────────────────

export function randomId(bytes = 32) {
    return crypto.randomBytes(bytes).toString("hex");
}

export function randomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString("base64url");
}

// ── Base64URL ─────────────────────────────────────────────────────────────

function base64urlEncode(str) {
    return Buffer.from(str).toString("base64url");
}

function base64urlDecode(str) {
    return Buffer.from(str, "base64url").toString("utf8");
}

// ── JWT (HMAC-SHA256) ─────────────────────────────────────────────────────
// Minimal JWT without external deps. Header is always {"alg":"HS256","typ":"JWT"}.

export function signJwt(payload, secret, expiresInSec = 3600) {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = { ...payload, iat: now, exp: now + expiresInSec };
    const headerB64 = base64urlEncode(JSON.stringify(header));
    const payloadB64 = base64urlEncode(JSON.stringify(fullPayload));
    const data = `${headerB64}.${payloadB64}`;
    const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
    return `${data}.${sig}`;
}

export function verifyJwt(token, secret) {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sig] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const expected = crypto.createHmac("sha256", secret).update(data).digest("base64url");
    // timingSafeEqual requires same length buffers
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const payload = JSON.parse(base64urlDecode(payloadB64));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) return null;
        return payload;
    } catch {
        return null;
    }
}

// ── PKCE (RFC 7636) ───────────────────────────────────────────────────────

export function pkceChallenge(verifier) {
    return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function verifyPkce(challenge, method, verifier) {
    if (!challenge) return true; // no challenge → no verification (plain not required)
    if (method === "plain") return challenge === verifier;
    // default S256
    return challenge === pkceChallenge(verifier);
}

// ── Credential encryption (AES-256-GCM) ──────────────────────────────────
// Used to embed Freedcamp API credentials inside JWT without storing server-side.

export function encryptCreds(apiKey, apiSecret, secret) {
    // Derive 32-byte key from secret via SHA256
    const key = crypto.createHash("sha256").update(secret).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const plaintext = JSON.stringify({ apiKey, apiSecret });
    const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    // iv:tag:ciphertext all base64url
    return `${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function decryptCreds(token, secret) {
    try {
        const [ivB64, tagB64, encB64] = token.split(".");
        if (!ivB64 || !tagB64 || !encB64) return null;
        const key = crypto.createHash("sha256").update(secret).digest();
        const iv = Buffer.from(ivB64, "base64url");
        const tag = Buffer.from(tagB64, "base64url");
        const enc = Buffer.from(encB64, "base64url");
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(tag);
        const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
        return JSON.parse(dec.toString("utf8"));
    } catch {
        return null;
    }
}
