// Admin session API.
//   GET    /api/session → status: { authenticated, storeConfigured, adminConfigured }
//   POST   /api/session → log in with { email, password } (Neon) or { password }
//                         (env backup); sets an httpOnly session cookie.
//   DELETE /api/session → log out; clears the cookie.

import {
  passwordMatches,
  verifyPasswordHash,
  createSessionToken,
  sessionCookie,
  clearCookie,
  isAuthenticated,
  isAuthConfigured,
  refreshSession,
} from '../lib/auth.js';
import { isStoreConfigured, getAdminUser } from '../lib/store.js';
import { loginLimiter, allow, clientIp } from '../lib/ratelimit.js';

// Verifies an email + password against the Neon `admin_users` table.
// Returns true on a match. Throws if the DB is unreachable so the caller can
// fall back to the env-password backup.
async function dbLoginSucceeds(email, password) {
  if (!email || !isStoreConfigured()) return false;
  const user = await getAdminUser(email);
  if (!user) return false;
  return verifyPasswordHash(password, user.password_hash);
}

function parseBody(req) {
  if (req.body == null) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    // Sliding session: keep the cookie alive while the editor polls this.
    const authed = refreshSession(req, res);
    return res.status(200).json({
      authenticated: authed,
      adminConfigured: isAuthConfigured(),
      storeConfigured: isStoreConfigured(),
    });
  }

  if (req.method === 'POST') {
    if (!isAuthConfigured()) {
      return res.status(503).json({
        error: 'Admin login is not configured yet. Set the ADMIN_PASSWORD environment variable.',
      });
    }
    if (!(await allow(loginLimiter, clientIp(req), res))) {
      return res.status(429).json({ error: 'Too many attempts. Please wait a minute and try again.' });
    }
    const { email, password } = parseBody(req);

    // Primary: email + password verified against Neon. A DB error (server down)
    // is swallowed so we fall through to the env-password backup below.
    if (email) {
      try {
        if (await dbLoginSucceeds(email, password)) {
          res.setHeader('Set-Cookie', sessionCookie(createSessionToken()));
          return res.status(200).json({ ok: true });
        }
      } catch (err) {
        console.error('[session] DB login check failed, using backup:', err?.message || err);
      }
    }

    // Backup: password-only against the ADMIN_PASSWORD env var.
    if (passwordMatches(password)) {
      res.setHeader('Set-Cookie', sessionCookie(createSessionToken()));
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearCookie());
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed.' });
}
