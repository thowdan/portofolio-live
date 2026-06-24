// Admin session API.
//   GET    /api/session → status: { authenticated, storeConfigured, adminConfigured }
//   POST   /api/session → log in with { password }; sets an httpOnly session cookie.
//   DELETE /api/session → log out; clears the cookie.

import {
  passwordMatches,
  createSessionToken,
  sessionCookie,
  clearCookie,
  isAuthenticated,
  isAuthConfigured,
} from '../lib/auth.js';
import { isStoreConfigured } from '../lib/store.js';
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
    return res.status(200).json({
      authenticated: isAuthenticated(req),
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
    const { password } = parseBody(req);
    if (passwordMatches(password)) {
      res.setHeader('Set-Cookie', sessionCookie(createSessionToken()));
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearCookie());
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed.' });
}
