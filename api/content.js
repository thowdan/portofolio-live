// Content API.
//   GET  /api/content  → public, returns the merged content model (cached).
//   PUT  /api/content  → admin only, validates + saves overrides (rate limited).

import { getContent, saveContent } from '../lib/content.js';
import { isAuthenticated } from '../lib/auth.js';
import { writeLimiter, readLimiter, allow, clientIp } from '../lib/ratelimit.js';
import { StoreNotConfiguredError } from '../lib/store.js';

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
  if (req.method === 'GET') {
    if (!(await allow(readLimiter, clientIp(req), res))) {
      return res.status(429).json({ error: 'Too many requests. Try again shortly.' });
    }
    const content = await getContent();
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=120');
    return res.status(200).json(content);
  }

  if (req.method === 'PUT') {
    res.setHeader('Cache-Control', 'no-store');
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }
    if (!(await allow(writeLimiter, clientIp(req), res))) {
      return res.status(429).json({ error: 'Too many writes. Try again shortly.' });
    }
    try {
      const saved = await saveContent(parseBody(req));
      return res.status(200).json({ ok: true, content: saved });
    } catch (err) {
      if (err instanceof StoreNotConfiguredError) {
        return res.status(503).json({ error: err.message });
      }
      const code = err.statusCode || 500;
      if (code >= 500) console.error('[content] save failed:', err);
      return res.status(code).json({ error: err.message || 'Failed to save content.' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed.' });
}
