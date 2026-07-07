// Server-rendered homepage. Reads content from the store (or defaults) and returns
// fully-formed HTML — great for SEO and instant after an admin edit. Edge-cached so
// it stays fast; the short s-maxage lets edits propagate within ~30s.

import { getContent } from '../lib/content.js';
import { renderHome } from '../templates/home.js';

export default async function handler(req, res) {
  try {
    const content = await getContent();
    const html = renderHome(content);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=300');
    return res.status(200).send(html);
  } catch (err) {
    console.error('[home] render failed:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).send(
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Something went wrong</title>
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue","Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#000;color:#f5f5f7;letter-spacing:-0.374px}
.c{text-align:center;padding:48px 24px}.e{font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#a1a1a6;margin:0 0 16px}
h1{font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.2px;margin:0 0 14px}p{font-size:17px;color:#a1a1a6;margin:0 0 32px}
.b{display:inline-block;padding:11px 22px;border-radius:9999px;background:#0071e3;color:#fff;font-size:17px;text-decoration:none}</style></head>
<body><div class="c"><p class="e">Error 500</p><h1>Something went wrong.</h1><p>An unexpected error occurred. Please try again in a moment.</p><a class="b" href="/">Reload</a></div></body></html>`
    );
  }
}
