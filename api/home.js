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
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#0A0B0F;color:#EDEFF5}
.c{text-align:center;padding:40px}h1{font-size:28px;margin:0 0 10px}p{opacity:.6}a{color:#0A84FF}</style></head>
<body><div class="c"><h1>Something went wrong</h1><p>An unexpected error occurred. Please try again in a moment.</p><p><a href="/">Reload</a></p></div></body></html>`
    );
  }
}
