// Minimal stateless session auth for the admin editor.
// A login issues an HMAC-signed token stored in an httpOnly cookie. No DB session
// table needed — the signature + expiry are self-validating.

import crypto from 'node:crypto';

const COOKIE_NAME = 'pf_admin';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days (sliding — see refreshSession)

function getSecret() {
  // Falls back to the admin password so it still works if SESSION_SECRET is unset,
  // but a dedicated SESSION_SECRET is strongly recommended (see .env.example).
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

export function isAuthConfigured() {
  return !!process.env.ADMIN_PASSWORD;
}

// --- Password hashing for DB-stored admin users ----------------------------
// Format: "scrypt$<saltHex>$<hashHex>". Uses Node's built-in scrypt (no deps).

const SCRYPT_KEYLEN = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

// Returns true if `stored` is NOT a scrypt hash — i.e. a legacy plaintext value
// that should be re-hashed on the next successful login.
export function needsRehash(stored) {
  return typeof stored !== 'string' || stored.split('$')[0] !== 'scrypt';
}

// Timing-safe comparison of two strings.
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) {
    crypto.timingSafeEqual(bb, bb); // keep timing uniform
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

// Verifies a password against a stored credential. Supports the secure
// "scrypt$salt$hash" format and a legacy plaintext value (older/manually-seeded
// rows); the caller upgrades legacy values via needsRehash().
export function verifyPasswordHash(password, stored) {
  if (typeof stored !== 'string' || !stored) return false;
  const parts = stored.split('$');
  if (parts.length === 3 && parts[0] === 'scrypt') {
    try {
      const salt = Buffer.from(parts[1], 'hex');
      const expected = Buffer.from(parts[2], 'hex');
      const actual = crypto.scryptSync(String(password), salt, expected.length);
      return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
    } catch {
      return false;
    }
  }
  // Legacy plaintext credential.
  return safeEqual(password, stored);
}

// Constant-time comparison to avoid leaking the password via timing.
export function passwordMatches(candidate) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) return false;
  const a = Buffer.from(String(candidate || ''));
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Still do a comparison to keep timing uniform.
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function createSessionToken() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `v1.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [version, expStr, sig] = parts;
  const payload = `${version}.${expStr}`;
  const expected = sign(payload);
  // timing-safe signature check
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  return true;
}

function parseCookies(req) {
  const header = req.headers?.cookie || '';
  const out = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

export function isAuthenticated(req) {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

export function sessionCookie(token) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  return parts.join('; ');
}

// Sliding session: if the request is authenticated, re-issue a fresh cookie so the
// expiry clock resets while the user is active. Returns true if still authed.
export function refreshSession(req, res) {
  if (!isAuthenticated(req)) return false;
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Set-Cookie', sessionCookie(createSessionToken()));
  }
  return true;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export { COOKIE_NAME };
