// Shared rendering helpers: HTML escaping (critical — content is user-editable and
// server-rendered, so everything interpolated must be escaped to prevent XSS) and
// the SEO <head> builder used by the homepage.

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Escape for HTML text and double-quoted attribute values.
export function esc(value) {
  if (value == null) return '';
  return String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

// Build an absolute URL from the configured site URL + a path.
export function absUrl(siteUrl, path) {
  const base = (siteUrl || '').replace(/\/+$/, '');
  if (!path) return base || '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

// JSON-LD is embedded inside a <script> tag; escape the closing-tag sequence only.
function jsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

export function head(content, opts = {}) {
  const { site, identity } = content;
  const title = opts.title || site.title;
  const description = opts.description || site.description;
  const path = opts.path || '/';
  const robots = opts.robots || 'index, follow';
  const canonical = absUrl(site.url, path);
  const ogImage = absUrl(site.url, site.ogImage);

  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: identity.name,
    url: absUrl(site.url, '/'),
    image: ogImage,
    email: identity.email ? `mailto:${identity.email}` : undefined,
    jobTitle: 'Full-Stack & Mobile Developer',
    address: identity.location
      ? { '@type': 'PostalAddress', addressLocality: identity.location }
      : undefined,
    sameAs: [identity.github].filter(Boolean),
  };

  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="keywords" content="${esc(site.keywords)}">
  <meta name="author" content="${esc(identity.name)}">
  <meta name="robots" content="${esc(robots)}">
  <link rel="canonical" href="${esc(canonical)}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(identity.name)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:locale" content="${esc(site.locale || 'en_US')}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(ogImage)}">

  <meta name="theme-color" content="#F5F5F7" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0A0B0F" media="(prefers-color-scheme: dark)">

  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/favicon.svg">
  <link rel="manifest" href="/site.webmanifest">

  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
  <link rel="preload" href="/css/styles.css" as="style">
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="preload" as="style" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"></noscript>

  <script>
    // Set the theme before first paint to avoid a flash of the wrong colors.
    (function () {
      try {
        var saved = localStorage.getItem('pf-theme');
        var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'light');
      }
      // Enable scroll-triggered reveals (hides .reveal until JS reveals them).
      document.documentElement.classList.add('reveal-on');
    })();
  </script>

  <script type="application/ld+json">${jsonLd(person)}</script>
</head>`;
}
