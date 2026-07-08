# Thowdan Al-Eryani — Portfolio

A fast, SEO-ready personal portfolio with a **server-rendered homepage** and a
password-protected **admin editor** that lets you change the site's content and
publish it live — no redeploy needed. Built to deploy on **Vercel**.

---

## 🎨 Redesign — Apple Design System (complete ✅)

The entire site has been redesigned to a museum-grade, Apple.com-style design
language. Every surface was rebuilt: the homepage, the 403/404/500 error pages,
the admin editor, the favicon and the theme metas.

### The design language

- **One accent color** — Action Blue `#0066cc` carries every interactive element
  (links, pill CTAs, focus rings). `#2997ff` is its on-dark sibling. No second
  brand color exists anywhere.
- **Alternating full-bleed tiles** — sections are edge-to-edge canvases that
  alternate white / parchment `#f5f5f7` / near-black `#272729–#252527`. The color
  change *is* the divider: no borders, no shadows between sections.
- **Exactly one shadow** in the whole system — `3px 5px 30px rgba(0,0,0,.22)`,
  applied only to the hero photo ("product on a surface"). Cards and buttons are
  flat with 1px hairlines.
- **No gradients.** Anywhere.
- **SF Pro typography** (system stack, with a self-hosted **Inter** variable
  font so non-Apple devices get a near-identical face) — hero 56/600 with negative tracking,
  display 40/600, body **17px**/400/1.47, footer link columns at 17/2.41,
  fine print 12. Weight ladder 300/400/600/700 — weight 500 is deliberately absent.
- **Pill grammar** — primary CTAs, chips and search-style inputs are full-radius
  capsules; utility buttons are 8px rects; utility cards are 18px with hairlines.
- **Two-row navigation** — a 44px pure-black global nav + a 52px frosted
  (backdrop-blur) sub-nav with a persistent blue pill CTA.
- **Motion** — staggered scroll reveals with Apple's ease curve, a scroll-linked
  hero, count-up stats, pointer tilt, `scale(0.95)` press states — all disabled
  under `prefers-reduced-motion`.
- **3D** — a lazy-loaded, CSP-safe (vendored) Three.js particle depth-field
  behind the hero. It never blocks paint, pauses offscreen, and is skipped on
  mobile / save-data / reduced-motion.

### Progress

- [x] **Step 1 — Preview tooling + this plan.** `scripts/preview.js` local
      server (`npm run preview`, no Vercel login needed), README plan.
- [x] **Step 2 — Design system + homepage.** Full rewrite of `css/styles.css`
      (token system per the spec, light + dark themes) and restructure of
      `templates/home.js` into Apple product tiles: black global nav, frosted
      sub-nav, full-viewport hero with the photo as the "product", stats strip,
      each project as its own full-bleed alternating dark/parchment tile, skills
      as utility-card grid, about/education/languages, awards, dark contact
      finale, dense parchment footer. Flat `#0066cc` favicon, theme-color metas.
- [x] **Step 3 — Motion system.** `js/motion.js`: scroll-linked hero, count-up
      stats, sub-nav raised state, pointer tilt; staggered reveal delays.
- [x] **Step 4 — 3D hero.** Vendored Three.js (`js/vendor/`), `js/hero3d.js`
      lazy scene, immutable cache rule in `vercel.json`.
- [x] **Step 5 — Error pages.** Apple-blank 403/404/500 + the inline 500
      fallback in `api/home.js` (done together with Step 2 so every page always
      has matching styles).
- [x] **Step 6 — Admin restyle.** Frosted topbar, pearl cards, pill buttons —
      `js/admin.js` untouched (its DOM contract is preserved).
- [x] **Step 7 — Final audits.** All passed: exactly one `box-shadow` use (the
      hero photo), zero gradients, zero `font-weight: 500`, every admin.js class
      styled, all 18 asset references on the same cache-buster version, sitemap
      lastmod bumped.
- [x] **Step 8 — Self-hosted Inter.** `fonts/InterVariable.woff2` (official
      Inter v4 variable font, upright only — the site uses no italics),
      `@font-face` + font-stack reorder in `css/styles.css` so Apple devices
      still resolve true SF Pro first and only non-Apple devices download
      Inter, immutable `/fonts/(.*)` cache rule in `vercel.json`.
- [x] **Step 9 — Mobile optimization pass.** The hero portrait becomes a small
      product card on phones (240px ≤734 / 220px ≤480 — it no longer dominates
      the screen); Apple padding ramp 80 → 64 (≤834) → 48px (≤640); stats
      collapse to a dense spec-table instead of a three-screen stack; new 419px
      small-phone type step; 833 → 834 breakpoint alignment; `svh` fallbacks
      for the iOS 100vh overshoot; 44px touch targets everywhere (theme
      toggle, sub-nav/project/caption links); `overflow-x: clip` safety net;
      and a full-screen frosted **mobile menu** (Apple LocalNav pattern —
      staggered link reveal, scroll lock, Escape/resize close) replacing the
      links that previously just vanished on phones.
- [x] **Step 10 — Recruiter Configurator.** Apple buy-page grammar between the
      projects and skills: pill option chips ("A frontend engineer" / "A
      backend engineer" / "A full-stack owner" / "Someone who ships fast") —
      selecting one crossfades an evidence panel with a personal statement,
      proof chips, deep links to the matching project tiles and a count-up
      stat. Server-rendered panels (SEO-safe, no-JS shows the first), WAI-ARIA
      tabs with arrow-key navigation, new `configurator` content section
      (editable in the admin), `js/configurator.js`, all asset references on
      `?v=5`.

### Verified

- Homepage light + dark themes at 1440 / 1280 / 834 / 640 / 390 / 375 / 320 px —
  correct tile alternation, grid collapses and hero type steps at every width;
  no horizontal scroll at any width.
- `prefers-reduced-motion`: all content visible and static, stats show final
  values, 3D never loads.
- 3D hero verified rendering in both themes (WebGL-less browsers get the
  designed hero with an empty canvas — graceful fallback confirmed).
- Error pages and admin login rendered and reviewed; `js/admin.js` untouched.
- No console errors or page exceptions on any surface.

### What remains (nothing blocking — deploy when ready)

Everything planned is done, including the optional self-hosted Inter font, the
mobile optimization pass and the Recruiter Configurator. To ship:
`npm run deploy` (or push to the connected Git branch). After deploying,
hard-refresh once — the `?v=5` cache busters take care of stale CSS/JS for
visitors.

---

## How it works

- **Homepage (`/`)** is rendered on the server by `api/home.js` from a content
  model. Crawlers get fully-formed HTML (great SEO); visitors get an edge-cached,
  instant page. When you edit content in the admin, the homepage reflects it within
  ~30 seconds (edge cache TTL).
- **Content** lives in `lib/content.js` as `DEFAULT_CONTENT`. The admin saves
  overrides into a **Neon Postgres** store; the defaults are always the fallback,
  so the public site renders even with **zero** backend configuration.
- **Résumé / CV** can be uploaded from the admin. The PDF is stored in Neon and
  served at `/api/resume`; the Résumé buttons appear automatically once one is set.
- **Admin (`/admin`)** is a form editor with collapsible sections. Login is by
  **email + password stored in Neon** (set it in the admin's *Account & login*
  section); `ADMIN_PASSWORD` is a **backup** used if the database is unreachable.
  A successful login gets an HMAC-signed httpOnly session cookie, and the editor
  `PUT`s validated content to the API.
- **Error pages** (`404.html`, `403.html`, `500.html`) are plain static files.

## Project structure

```
api/
  home.js        # GET / → server-rendered homepage (edge-cached)
  content.js     # GET (public) + PUT (admin) content
  resume.js      # GET (public) PDF + PUT/DELETE (admin) CV upload
  account.js     # GET/PUT (admin) email + password credentials (Neon)
  session.js     # login / logout / status
lib/
  content.js     # DEFAULT_CONTENT, get/save, validation (edit your data here)
  store.js       # Neon Postgres (kv + files tables) with graceful fallback
  auth.js        # signed-cookie sessions, timing-safe password check
  ratelimit.js   # API rate limiting (Neon-backed) with no-op fallback
templates/
  layout.js      # <head> + SEO meta/OG/Twitter/JSON-LD + HTML escaping
  home.js        # homepage HTML
css/styles.css   # all styles (light/dark themed)
fonts/           # self-hosted Inter variable font (non-Apple devices)
js/theme.js      # theme toggle + nav + mobile menu + year + reveals (every page)
js/motion.js     # homepage motion: hero scroll-link, count-up, tilt
js/configurator.js # recruiter configurator: chip tabs + panel crossfade
js/hero3d.js     # lazy 3D hero scene (loads vendored Three.js on idle)
js/vendor/       # vendored libraries (Three.js — CSP allows self only)
js/admin.js      # admin editor logic
scripts/
  preview.js     # local preview server (npm run preview) — dev only
admin.html       # admin shell (noindex)
404.html 403.html 500.html
robots.txt sitemap.xml site.webmanifest favicon.svg
vercel.json      # routing, caching, security headers
```

## Local development

```bash
npm install
npm run preview      # zero-config preview at http://localhost:4173
npm run dev          # = vercel dev, serves the real functions + static files
```

`npm run preview` renders the homepage from `DEFAULT_CONTENT` and serves every
static page — perfect for design work with no env vars and no Vercel login. Use
`npm run dev` when you need the real APIs (admin login, saving, résumé upload).

## Environment variables

Copy `.env.example`. None are required for the public site; these enable the admin:

| Variable | Required for | Notes |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Admin login (backup) | Fallback password if Neon is down. Primary login (email+password) is set in the admin and stored in Neon. |
| `SESSION_SECRET` | Session signing | Recommended. `openssl rand -base64 32`. |
| `DATABASE_URL` | Saving content & CV | Neon Postgres pooled connection string. |

Set them in **Vercel → Project → Settings → Environment Variables**, then redeploy.

## Deploy to Vercel

1. Push this repo to GitHub and **Import** it in Vercel (framework preset: *Other*).
2. Add the environment variables above.
3. Create a free database at <https://console.neon.tech> (Postgres) and paste its
   pooled connection string into `DATABASE_URL`. Tables (`kv`, `files`,
   `rate_limits`, `admin_users`) are created automatically on first use — no
   migration step.
4. Deploy. Visit `/admin`, log in with `ADMIN_PASSWORD`, edit, and **Save & publish**.

## Going-live checklist

- [x] Domain is set to `https://thowdanaleryani.vercel.app` in `lib/content.js`,
      `robots.txt`, and `sitemap.xml`. Change those 3 spots if you ever move domains.
- [ ] Add `ADMIN_PASSWORD`, `SESSION_SECRET`, and `DATABASE_URL` in Vercel
      (see the table above), then redeploy — required for the `/admin` editor.
- [ ] (Optional) Upload your CV in `/admin` (Résumé / CV section). Until then the
      Résumé buttons are hidden automatically, so there's no broken link.
- [ ] (Optional) Replace `myjpg.jpg` with your preferred photo / social-share image.

## SEO

Every page ships proper `<title>`, meta description, canonical URL, Open Graph and
Twitter cards, `theme-color`, a web manifest, and JSON-LD `Person` structured data.
`robots.txt` allows crawling (excludes `/admin` and `/api`) and points to
`sitemap.xml`. Error/admin pages are `noindex`. Set your real domain (above) so
canonical/OG/sitemap URLs are absolute and correct.

## Caching

`vercel.json` sets `Cache-Control` for static assets (CSS/JS revalidate hourly +
stale-while-revalidate; images cached a day; vendored libraries and fonts
immutable). The
homepage function returns `s-maxage=30, stale-while-revalidate=300`, so it's
served instantly from the edge while reflecting content edits within ~30s. API
writes are `no-store`.

## Rate limiting & security

- The API is rate-limited per IP via Neon (`lib/ratelimit.js`): admin login is
  capped at 5/min to deter brute force, content writes at 20/min, public reads at
  120/min. Without `DATABASE_URL` these become no-ops (so local dev still works) —
  configure Neon in production to make them effective.
- Admin sessions use HMAC-signed, httpOnly, Secure, SameSite cookies; the password
  check is constant-time.
- Security headers (CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`) are applied in `vercel.json`. The CSP
  allows scripts from `'self'` only — which is why Three.js is vendored into
  `js/vendor/` instead of loaded from a CDN.
- All editable content is HTML-escaped on render (`templates/layout.js`) to prevent
  injection.

## Editing content without the admin

You can also edit `DEFAULT_CONTENT` in `lib/content.js` directly and redeploy — handy
for the initial copy or if you prefer git over the UI. Admin-saved values (in the
store) take precedence over these defaults.

## Typography on non-Apple devices

The **Inter** variable font is self-hosted at `fonts/InterVariable.woff2` and
declared via `@font-face` in `css/styles.css`. In the font stack it sits after
the Apple-only entries (`-apple-system`, `BlinkMacSystemFont`, SF Pro) and
before the generic fallbacks, so macOS/iOS render true SF Pro and never
download the file, while Windows/Android/Linux get Inter — the closest open
match to SF Pro. Only the upright face ships (the site uses no italics), it
loads with `font-display: swap`, and it's cached immutably via the
`/fonts/(.*)` rule in `vercel.json`. The CSP's `font-src 'self'` already
permits it.
