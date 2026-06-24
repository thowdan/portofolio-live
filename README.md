# Thowdan Al-Eryani — Portfolio

A fast, SEO-ready personal portfolio with a **server-rendered homepage** and a
password-protected **admin editor** that lets you change the site's content and
publish it live — no redeploy needed. Built to deploy on **Vercel**.

> Replaces the old AI-exported `index.html`/`error.html`, which depended on a
> missing `support.js` runtime and Cloudflare-only endpoints and could not run on
> their own. Everything here is standard HTML/CSS/JS + small Vercel functions.

---

## How it works

- **Homepage (`/`)** is rendered on the server by `api/home.js` from a content
  model. Crawlers get fully-formed HTML (great SEO); visitors get an edge-cached,
  instant page. When you edit content in the admin, the homepage reflects it within
  ~30 seconds (edge cache TTL).
- **Content** lives in `lib/content.js` as `DEFAULT_CONTENT`. The admin saves
  overrides into an **Upstash Redis** store; the defaults are always the fallback,
  so the public site renders even with **zero** backend configuration.
- **Admin (`/admin`)** is a form editor. It authenticates against `ADMIN_PASSWORD`,
  gets an HMAC-signed httpOnly session cookie, and `PUT`s validated content to the
  API.
- **Error pages** (`404.html`, `403.html`, `500.html`) are plain static files.

## Project structure

```
api/
  home.js        # GET / → server-rendered homepage (edge-cached)
  content.js     # GET (public) + PUT (admin) content
  session.js     # login / logout / status
lib/
  content.js     # DEFAULT_CONTENT, get/save, validation (edit your data here)
  store.js       # Upstash Redis with graceful fallback
  auth.js        # signed-cookie sessions, timing-safe password check
  ratelimit.js   # API rate limiting (Upstash) with no-op fallback
templates/
  layout.js      # <head> + SEO meta/OG/Twitter/JSON-LD + HTML escaping
  home.js        # homepage HTML
css/styles.css   # all styles (light/dark themed)
js/theme.js      # theme toggle + nav + year (every page)
js/admin.js      # admin editor logic
admin.html       # admin shell (noindex)
404.html 403.html 500.html
robots.txt sitemap.xml site.webmanifest favicon.svg
vercel.json      # routing, caching, security headers
```

## Local development

```bash
npm install
npm run dev          # = vercel dev, serves the functions + static files
```

Open http://localhost:3000. Without env vars the site renders default content; the
admin will tell you what to configure.

## Environment variables

Copy `.env.example`. None are required for the public site; these enable the admin:

| Variable | Required for | Notes |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Admin login | Your login password. |
| `SESSION_SECRET` | Session signing | Recommended. `openssl rand -base64 32`. |
| `UPSTASH_REDIS_REST_URL` | Saving content | From the Upstash console → REST API. |
| `UPSTASH_REDIS_REST_TOKEN` | Saving content | From the Upstash console → REST API. |

Set them in **Vercel → Project → Settings → Environment Variables**, then redeploy.

## Deploy to Vercel

1. Push this repo to GitHub and **Import** it in Vercel (framework preset: *Other*).
2. Add the environment variables above.
3. Create a free database at <https://console.upstash.com> (Redis) and paste its
   REST URL + token into the env vars.
4. Deploy. Visit `/admin`, log in with `ADMIN_PASSWORD`, edit, and **Save & publish**.

## Going-live checklist

- [ ] Set your real domain in three spots once you have one:
      `lib/content.js` (`site.url`), `robots.txt`, and `sitemap.xml`.
      (Until then the default `your-site.vercel.app` placeholder is used for
      absolute SEO URLs only — everything else works regardless.)
- [ ] Drop your `resume.pdf` into the project root (the Résumé buttons link to it).
- [ ] Replace `myjpg.jpg` with your preferred photo / social-share image if desired.
- [ ] Add `ADMIN_PASSWORD`, `SESSION_SECRET`, and the Upstash vars in Vercel.

## SEO

Every page ships proper `<title>`, meta description, canonical URL, Open Graph and
Twitter cards, `theme-color`, a web manifest, and JSON-LD `Person` structured data.
`robots.txt` allows crawling (excludes `/admin` and `/api`) and points to
`sitemap.xml`. Error/admin pages are `noindex`. Set your real domain (above) so
canonical/OG/sitemap URLs are absolute and correct.

## Caching

`vercel.json` sets `Cache-Control` for static assets (CSS/JS revalidate hourly +
stale-while-revalidate; images cached a day). The homepage function returns
`s-maxage=30, stale-while-revalidate=300`, so it's served instantly from the edge
while reflecting content edits within ~30s. API writes are `no-store`.

## Rate limiting & security

- The API is rate-limited per IP via Upstash (`lib/ratelimit.js`): admin login is
  capped at 5/min to deter brute force, content writes at 20/min, public reads at
  120/min. Without Upstash these become no-ops (so local dev still works) — configure
  Upstash in production to make them effective.
- Admin sessions use HMAC-signed, httpOnly, Secure, SameSite cookies; the password
  check is constant-time.
- Security headers (CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`) are applied in `vercel.json`.
- All editable content is HTML-escaped on render (`templates/layout.js`) to prevent
  injection.

## Editing content without the admin

You can also edit `DEFAULT_CONTENT` in `lib/content.js` directly and redeploy — handy
for the initial copy or if you prefer git over the UI. Admin-saved values (in the
store) take precedence over these defaults.
