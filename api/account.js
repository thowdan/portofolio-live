// Admin account API — manage the email + password used for Neon-backed login.
//   GET /api/account → { email }   (the stored admin email, or null)
//   PUT /api/account → set { email, password }; stores a hashed credential in Neon.
// Both require an authenticated admin session.

import { isAuthenticated, hashPassword, refreshSession } from '../lib/auth.js';
import { getPrimaryAdminEmail, upsertAdminUser, StoreNotConfiguredError } from '../lib/store.js';
import { writeLimiter, allow, clientIp } from '../lib/ratelimit.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function parseBody(req) {
  if (req.body == null) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      const err = new Error('Request body is not valid JSON.');
      err.statusCode = 400;
      throw err;
    }
  }
  return req.body;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }
  refreshSession(req, res); // sliding session

  if (req.method === 'GET') {
    const email = await getPrimaryAdminEmail();
    return res.status(200).json({ email: email || null });
  }

  if (req.method === 'PUT') {
    if (!(await allow(writeLimiter, clientIp(req), res))) {
      return res.status(429).json({ error: 'Too many requests. Try again shortly.' });
    }
    try {
      const { email, password } = parseBody(req);
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!EMAIL_RE.test(cleanEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
        return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters.` });
      }
      await upsertAdminUser(cleanEmail, hashPassword(password));
      return res.status(200).json({ ok: true, email: cleanEmail });
    } catch (err) {
      if (err instanceof StoreNotConfiguredError) {
        return res.status(503).json({ error: err.message });
      }
      const code = err.statusCode || 500;
      if (code >= 500) console.error('[account] save failed:', err);
      return res.status(code).json({ error: err.message || 'Failed to save account.' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed.' });
}
