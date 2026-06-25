// Admin session API.
//   GET    /api/session → status: { authenticated, storeConfigured, adminConfigured }
//   POST   /api/session → log in with { email, password } (Neon) or { password }
//                         (env backup); sets an httpOnly session cookie.
//   DELETE /api/session → log out; clears the cookie.

import {
  passwordMatches,
  verifyPasswordHash,
  needsRehash,
  hashPassword,
  createSessionToken,
  sessionCookie,
  clearCookie,
  isAuthenticated,
  isAuthConfigured,
  refreshSession,
} from '../lib/auth.js';
import { isStoreConfigured, getAdminUser, hasAdminUsers, upsertAdminUser } from '../lib/store.js';
import { loginLimiter, allow, clientIp } from '../lib/ratelimit.js';

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
    const issue = () => {
      res.setHeader('Set-Cookie', sessionCookie(createSessionToken()));
      return res.status(200).json({ ok: true });
    };

    // Determine DB state: is it reachable, and are any admin users configured?
    const storeOn = isStoreConfigured();
    let usersExist = false;
    let dbDown = false;
    if (storeOn) {
      try {
        usersExist = await hasAdminUsers();
      } catch (err) {
        dbDown = true; // database unreachable
        console.error('[session] DB unreachable, allowing backup:', err?.message || err);
      }
    }

    // Primary path — DB up AND a user is configured: ONLY email+password works.
    if (storeOn && !dbDown && usersExist) {
      try {
        const user = email ? await getAdminUser(email) : null;
        if (user && verifyPasswordHash(password, user.password_hash)) {
          // Heal legacy/plaintext credentials by re-storing a secure hash.
          if (needsRehash(user.password_hash)) {
            try {
              await upsertAdminUser(email, hashPassword(password));
            } catch (e) {
              console.error('[session] password rehash failed (non-fatal):', e?.message || e);
            }
          }
          return issue();
        }
      } catch (err) {
        dbDown = true; // lost the DB mid-request — fall through to backup
        console.error('[session] DB login check failed, allowing backup:', err?.message || err);
      }
    }

    // Backup path — ONLY when the store is unconfigured, the DB is down, or no
    // admin user exists yet (first-time bootstrap). The env password never works
    // while the database is healthy and a user is configured.
    if (!storeOn || dbDown || !usersExist) {
      if (passwordMatches(password)) return issue();
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
