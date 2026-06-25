// Résumé file API. The PDF is stored in Neon (see lib/store.js `files` table).
//   GET    /api/resume        → public, streams the PDF (404 if none uploaded).
//   GET    /api/resume?meta=1 → public, returns { exists, filename, updatedAt }.
//   PUT    /api/resume        → admin only, uploads a PDF (JSON base64 body).
//   DELETE /api/resume        → admin only, removes the stored PDF.

import { getFile, getFileMeta, putFile, deleteFile, StoreNotConfiguredError } from '../lib/store.js';
import { isAuthenticated } from '../lib/auth.js';
import { writeLimiter, readLimiter, allow, clientIp } from '../lib/ratelimit.js';

const KEY = 'resume';
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB — keeps the upload under Vercel's body limit.

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

// Strips anything that could break a Content-Disposition header or look like a path.
function safeName(name) {
  const base = String(name || 'resume.pdf').split(/[\\/]/).pop();
  const clean = base.replace(/[^A-Za-z0-9._ -]/g, '').trim();
  const withName = clean || 'resume.pdf';
  return /\.pdf$/i.test(withName) ? withName : `${withName}.pdf`;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (!(await allow(readLimiter, clientIp(req), res))) {
      return res.status(429).json({ error: 'Too many requests. Try again shortly.' });
    }

    // Metadata-only probe (used by the admin UI to show the current file).
    if (req.query && (req.query.meta === '1' || req.query.meta === 'true')) {
      const meta = await getFileMeta(KEY);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({
        exists: !!meta,
        filename: meta?.filename || null,
        updatedAt: meta?.updated_at || null,
      });
    }

    const file = await getFile(KEY);
    if (!file) return res.status(404).json({ error: 'No résumé has been uploaded yet.' });
    const buf = Buffer.from(file.base64, 'base64');
    res.setHeader('Content-Type', file.content_type || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeName(file.filename)}"`);
    res.setHeader('Content-Length', String(buf.length));
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(buf);
  }

  if (req.method === 'PUT') {
    res.setHeader('Cache-Control', 'no-store');
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }
    if (!(await allow(writeLimiter, clientIp(req), res))) {
      return res.status(429).json({ error: 'Too many uploads. Try again shortly.' });
    }
    try {
      const body = parseBody(req);
      let data = body.data;
      if (typeof data !== 'string' || !data) {
        return res.status(400).json({ error: 'No file data received.' });
      }
      // Accept a bare base64 string or a data: URL (strip the prefix).
      if (data.startsWith('data:')) data = data.slice(data.indexOf(',') + 1);

      const buf = Buffer.from(data, 'base64');
      if (!buf.length) return res.status(400).json({ error: 'File data is empty or invalid.' });
      if (buf.length > MAX_BYTES) {
        return res.status(413).json({ error: 'File too large. Maximum résumé size is 3 MB.' });
      }
      // Verify it's actually a PDF (magic bytes), not just a renamed file.
      if (buf.subarray(0, 4).toString('latin1') !== '%PDF') {
        return res.status(400).json({ error: 'Only PDF files are accepted.' });
      }

      const filename = safeName(body.filename);
      await putFile(KEY, { filename, contentType: 'application/pdf', base64: buf.toString('base64') });
      return res.status(200).json({ ok: true, filename, url: '/api/resume', updatedAt: new Date().toISOString() });
    } catch (err) {
      if (err instanceof StoreNotConfiguredError) {
        return res.status(503).json({ error: err.message });
      }
      const code = err.statusCode || 500;
      if (code >= 500) console.error('[resume] upload failed:', err);
      return res.status(code).json({ error: err.message || 'Failed to upload résumé.' });
    }
  }

  if (req.method === 'DELETE') {
    res.setHeader('Cache-Control', 'no-store');
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }
    try {
      await deleteFile(KEY);
      return res.status(200).json({ ok: true });
    } catch (err) {
      if (err instanceof StoreNotConfiguredError) {
        return res.status(503).json({ error: err.message });
      }
      console.error('[resume] delete failed:', err);
      return res.status(500).json({ error: 'Failed to remove résumé.' });
    }
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed.' });
}
