// Local preview server — renders the homepage exactly like api/home.js does,
// without needing `vercel dev` (no login, no env vars). Static files are served
// from the repo root; /api/session is stubbed so the admin login view renders.
//
//   npm run preview   →  http://localhost:4173
//
// This is a dev tool only; it is never deployed (Vercel ignores scripts/).

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHome } from '../templates/home.js';
import { DEFAULT_CONTENT } from '../lib/content.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
};

function send(res, status, type, body) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

async function sendFile(res, relPath, status = 200) {
  const safe = normalize(relPath).replace(/^(\.\.[/\\])+/, '');
  const file = join(ROOT, safe);
  const body = await readFile(file);
  send(res, status, MIME[extname(file).toLowerCase()] || 'application/octet-stream', body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = decodeURIComponent(url.pathname);

  try {
    if (path === '/') {
      let html = renderHome(DEFAULT_CONTENT);
      // Dev nicety: /?theme=light|dark pins the theme (useful for screenshots).
      const theme = url.searchParams.get('theme');
      if (theme === 'light' || theme === 'dark') {
        html = html.replace("localStorage.getItem('pf-theme')", `'${theme}'`);
      }
      return send(res, 200, MIME['.html'], html);
    }
    if (path === '/api/session') {
      // Stub: unconfigured admin so admin.html shows its login view for styling.
      return send(res, 200, MIME['.json'], JSON.stringify({
        adminConfigured: false, authenticated: false, storeConfigured: false,
      }));
    }
    if (path === '/api/content') {
      return send(res, 200, MIME['.json'], JSON.stringify(DEFAULT_CONTENT));
    }
    if (path.startsWith('/api/')) {
      return send(res, 404, MIME['.json'], '{"error":"Not available in preview."}');
    }
    // cleanUrls behaviour: /admin → admin.html, /404 → 404.html, …
    const rel = path.endsWith('/') ? path.slice(0, -1) : path;
    const candidate = extname(rel) ? rel : `${rel}.html`;
    return await sendFile(res, candidate);
  } catch {
    try {
      return await sendFile(res, '404.html', 404);
    } catch {
      return send(res, 404, MIME['.txt'], 'Not found');
    }
  }
});

server.listen(PORT, () => {
  console.log(`Preview running →  http://localhost:${PORT}`);
  console.log('  /            server-rendered homepage (DEFAULT_CONTENT)');
  console.log('  /admin       admin editor shell (stubbed session)');
  console.log('  /404 /403 /500   error pages');
});
