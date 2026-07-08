// Renders the full homepage HTML from the content model. Pure (no Node-only deps
// beyond ./layout), and every dynamic value is escaped via esc().
//
// Structure follows the Apple tile system: black global nav → frosted sub-nav →
// hero product tile → parchment stats strip → one full-bleed tile per project
// (alternating near-black / parchment) → recruiter configurator → skills
// utility cards → about → dark contact finale → dense parchment footer.

import { esc, head } from './layout.js';

const themeToggle = `
        <button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle dark mode">
          <i class="fa-solid fa-moon icon-moon" aria-hidden="true"></i>
          <i class="fa-solid fa-sun icon-sun" aria-hidden="true"></i>
        </button>`;

function chips(items, extraClass) {
  if (!items || !items.length) return '';
  return `<div class="chips${extraClass ? ` ${extraClass}` : ''}">${items
    .map((t) => `<span class="chip">${esc(t)}</span>`)
    .join('')}</div>`;
}

function statsHtml(stats) {
  return stats
    .map(
      (s, i) => `
        <div class="stat reveal" style="--reveal-delay:${i * 80}ms">
          <div class="stat-value">${esc(s.value)}</div>
          <div class="stat-label">${esc(s.label)}</div>
        </div>`
    )
    .join('');
}

// Each project is its own full-bleed product tile. Even indexes take the
// near-black surfaces (cycling the three micro-stepped darks), odd indexes
// rest on parchment — the color change is the section divider.
function projectsHtml(projects) {
  const darks = ['tile--dark-1', 'tile--dark-2', 'tile--dark-3'];
  return projects
    .map((p, i) => {
      const surface = i % 2 === 0 ? darks[(i / 2) % 3] : 'tile--parchment';
      const eyebrow = [p.num, p.tag].filter(Boolean).map(esc).join(' · ');
      const note = p.accentNote
        ? `<div class="project-note"><i class="fa-solid fa-star" aria-hidden="true"></i>${esc(p.accentNote)}</div>`
        : '';
      const link = p.link
        ? `<a class="project-link" href="${esc(p.link)}" target="_blank" rel="noopener">${esc(
            p.linkLabel || 'Visit'
          )} <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`
        : '';
      const meta = p.meta ? `<span class="project-meta">${esc(p.meta)}</span>` : '';
      return `
    <section class="tile ${surface} project-tile" id="project-${i}" data-screen-label="${esc(p.name)}">
      <div class="tile-inner" data-parallax>
        <article class="project-stack reveal">
          <div class="project-eyebrow">${eyebrow}</div>
          <h3 class="project-name">${esc(p.name)}</h3>
          <p class="project-desc">${esc(p.desc)}</p>
          ${note}
          ${chips(p.stack, 'project-chips')}
          ${link || meta ? `<div class="project-links">${link}${meta}</div>` : ''}
        </article>
      </div>
    </section>`;
    })
    .join('');
}

// Recruiter configurator — Apple buy-page grammar. Every option's evidence
// panel is server-rendered (SEO-safe; no-JS shows the first panel via pure
// CSS); js/configurator.js only toggles classes, never injects HTML.
// projectRefs match projects by name (case-insensitive) so admin reordering
// can't break the links; unmatched refs are silently skipped.
function configuratorHtml(content) {
  const cfg = content.configurator;
  if (!cfg || !cfg.options || !cfg.options.length) return '';
  const chipRow = cfg.options
    .map(
      (o, i) => `
          <button class="cfg-chip${i === 0 ? ' is-selected' : ''}" id="cfg-tab-${i}" type="button" role="tab" aria-selected="${i === 0}" aria-controls="cfg-panel-${i}" tabindex="${i === 0 ? '0' : '-1'}">${esc(o.chipLabel)}</button>`
    )
    .join('');
  const panels = cfg.options
    .map((o, i) => {
      const links = (o.projectRefs || [])
        .map((ref) => {
          const idx = content.projects.findIndex(
            (p) => p.name.trim().toLowerCase() === String(ref).trim().toLowerCase()
          );
          return idx === -1
            ? ''
            : `<a class="project-link" href="#project-${idx}">${esc(content.projects[idx].name)} <i class="fa-solid fa-arrow-down" aria-hidden="true"></i></a>`;
        })
        .join('');
      const stat = o.stat && o.stat.value
        ? `<div class="cfg-stat"><span class="cfg-stat-value" data-count-up>${esc(o.stat.value)}</span><span class="cfg-stat-label">${esc(o.stat.label)}</span></div>`
        : '';
      return `
          <div class="cfg-panel${i === 0 ? ' is-active' : ''}" id="cfg-panel-${i}" role="tabpanel" aria-labelledby="cfg-tab-${i}">
            <p class="cfg-statement">${esc(o.statement)}</p>
            ${chips(o.proof, 'cfg-proof')}
            ${links ? `<div class="cfg-links">${links}</div>` : ''}
            ${stat}
          </div>`;
    })
    .join('');
  return `
    <section class="tile tile--parchment cfg" id="configurator" data-screen-label="Configurator" data-configurator>
      <div class="tile-inner">
        <div class="section-head--center reveal">
          <p class="section-eyebrow">${esc(cfg.eyebrow)}</p>
          <h2 class="section-title">${esc(cfg.title)}</h2>
          <p class="section-lead">${esc(cfg.lead)}</p>
        </div>
        <div class="cfg-chips reveal" style="--reveal-delay:80ms" role="tablist" aria-label="Configure the role">${chipRow}
        </div>
        <div class="cfg-panels reveal" style="--reveal-delay:160ms">${panels}
        </div>
      </div>
    </section>`;
}

function skillsHtml(skills) {
  return skills
    .map(
      (g, i) => `
          <div class="ucard reveal" style="--reveal-delay:${(i % 3) * 80}ms">
            <div class="eyebrow">${esc(g.label)}</div>
            ${chips(g.items)}
          </div>`
    )
    .join('');
}

function awardsHtml(awards) {
  return awards
    .map(
      (a, i) => `
          <div class="award reveal" style="--reveal-delay:${(i % 2) * 80}ms">
            <div class="award-icon"><i class="${esc(a.iconClass)}" aria-hidden="true"></i></div>
            <div>
              <div class="award-title">${esc(a.title)}</div>
              <div class="award-sub">${esc(a.sub)}</div>
            </div>
          </div>`
    )
    .join('');
}

function languagesHtml(langs) {
  return langs
    .map(
      (l) => `
              <div class="lang-row"><span>${esc(l.name)}</span><span class="muted">${esc(
        l.level
      )}</span></div>`
    )
    .join('');
}

// Footer project column: external links open the live project, the rest jump
// to the work section.
function footerProjectsHtml(projects) {
  return projects
    .map((p) =>
      p.link
        ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.name)}</a>`
        : `<a href="#work">${esc(p.name)}</a>`
    )
    .join('');
}

export function renderHome(content) {
  const { identity, about, education } = content;
  const eduDetail = esc(education.detail).replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
${head(content, { path: '/' })}
<body>
  <a class="skip-link" href="#top">Skip to content</a>

  <nav class="gnav" aria-label="Global">
    <div class="gnav-inner">
      <a class="gnav-brand" href="#top">${esc(identity.initials)}</a>
      <div class="gnav-links">
        <a class="gnav-link" href="${esc(identity.github)}" target="_blank" rel="noopener">GitHub</a>
        ${identity.resumeUrl ? `<a class="gnav-link" href="${esc(identity.resumeUrl)}" target="_blank" rel="noopener">Résumé</a>` : ''}
        <a class="gnav-link" href="mailto:${esc(identity.email)}">Contact</a>
        ${themeToggle}
      </div>
    </div>
  </nav>

  <div class="subnav" id="subnav">
    <div class="subnav-inner">
      <span class="subnav-name">${esc(identity.name)}</span>
      <div class="subnav-links">
        <a class="subnav-link" href="#work">Work</a>
        <a class="subnav-link" href="#skills">Skills</a>
        <a class="subnav-link" href="#about">About</a>
        <a class="btn btn-accent btn-sm" href="#contact">Get in touch</a>
        <button class="subnav-menu" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">
          <i class="fa-solid fa-bars" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </div>

  <div class="mobile-menu" id="mobile-menu" data-menu hidden>
    <button class="mobile-menu-close" type="button" data-menu-toggle aria-label="Close menu">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
    <nav class="mobile-menu-links" aria-label="Menu">
      <a href="#work" style="--i:0">Work</a>
      <a href="#skills" style="--i:1">Skills</a>
      <a href="#about" style="--i:2">About</a>
      <a href="${esc(identity.github)}" target="_blank" rel="noopener" style="--i:3">GitHub</a>
      ${identity.resumeUrl ? `<a href="${esc(identity.resumeUrl)}" target="_blank" rel="noopener" style="--i:4">Résumé</a>` : ''}
      <a href="mailto:${esc(identity.email)}" style="--i:5">Contact</a>
    </nav>
  </div>

  <main id="top">
    <section class="tile tile--canvas hero" id="hero" data-screen-label="Hero">
      <canvas class="hero-canvas" id="hero-canvas" aria-hidden="true"></canvas>
      <div class="hero-inner">
        <div class="hero-copy" data-hero-copy>
          <p class="reveal hero-eyebrow">${esc(identity.availability)}</p>
          <h1 class="reveal hero-title" style="--reveal-delay:80ms">${esc(identity.heroTitleA)}<br>${esc(identity.heroTitleB)}</h1>
          <p class="reveal hero-intro" style="--reveal-delay:160ms">${esc(identity.heroIntro)}</p>
          <div class="reveal hero-actions" style="--reveal-delay:240ms">
            <a class="btn btn-accent" href="#work">View selected work</a>
            <a class="btn btn-ghost" href="#contact">Get in touch</a>
          </div>
        </div>
        <div class="reveal hero-figure" style="--reveal-delay:200ms" data-hero-figure>
          <div class="hero-photo" data-tilt>
            <img class="product-img" src="${esc(identity.photo)}" alt="${esc(identity.name)}" width="640" height="640" loading="eager" fetchpriority="high" decoding="async">
          </div>
          <div class="hero-caption">
            <div>
              <span class="hero-caption-name">${esc(identity.cardName)}</span>
              <span class="hero-caption-sub">${esc(identity.cardSub)}</span>
            </div>
            <a href="${esc(identity.github)}" target="_blank" rel="noopener"><i class="fa-brands fa-github" aria-hidden="true"></i> GitHub</a>
          </div>
        </div>
      </div>
    </section>

    <section class="tile tile--parchment" data-screen-label="Stats">
      <div class="tile-inner">
        <div class="stats-grid">${statsHtml(content.stats)}</div>
      </div>
    </section>

    <section class="tile tile--canvas work-intro" id="work" data-screen-label="Selected Work">
      <div class="tile-inner section-head--center reveal">
        <p class="section-eyebrow">Selected work</p>
        <h2 class="section-title">Built end to end.</h2>
        <p class="section-lead">From idea to production — every project below was designed, engineered and shipped as a complete system.</p>
      </div>
    </section>

    ${projectsHtml(content.projects)}

    ${/* Surface parity note: with an odd project count the last project tile is
        dark, so the parchment configurator reads as its own beat. If the project
        count ever becomes even (last tile parchment), revisit this surface. */ ''}
    ${configuratorHtml(content)}

    <section class="tile tile--canvas" id="skills" data-screen-label="Skills">
      <div class="tile-inner tile-inner--wide">
        <div class="section-head--center reveal">
          <p class="section-eyebrow">Toolkit</p>
          <h2 class="section-title">The stack behind the work.</h2>
          <p class="section-lead">The languages, frameworks and platforms I reach for across the stack.</p>
        </div>
        <div class="skills-grid">${skillsHtml(content.skills)}</div>
      </div>
    </section>

    <section class="tile tile--parchment" id="about" data-screen-label="About">
      <div class="tile-inner">
        <div class="about-cols">
          <div class="reveal">
            <p class="section-eyebrow">${esc(about.heading)}</p>
            ${about.paragraphs.map((p) => `<p class="about-text">${esc(p)}</p>`).join('')}
          </div>
          <div class="about-side reveal" style="--reveal-delay:120ms">
            <div class="side-capsule">
              <div class="eyebrow">Education</div>
              <div class="side-title">${esc(education.degree)}</div>
              <div class="side-detail">${eduDetail}</div>
            </div>
            <div class="side-capsule">
              <div class="eyebrow">Languages</div>
              <div class="lang-list">${languagesHtml(content.languages)}</div>
            </div>
          </div>
        </div>

        <div class="recognition">
          <p class="section-eyebrow reveal">Recognition</p>
          <div class="awards-grid">${awardsHtml(content.awards)}</div>
        </div>
      </div>
    </section>

    <section class="tile tile--dark-1 contact-tile" id="contact" data-screen-label="Contact">
      <div class="tile-inner reveal">
        <h2 class="contact-title">${esc(content.contact.heading)}</h2>
        <p class="contact-sub">${esc(content.contact.sub)}</p>
        <div class="contact-actions">
          <a class="btn btn-accent" href="mailto:${esc(identity.email)}"><i class="fa-solid fa-envelope" aria-hidden="true"></i>${esc(identity.email)}</a>
          ${
            identity.resumeUrl
              ? `<a class="btn btn-ghost" href="${esc(identity.resumeUrl)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-down-to-line" aria-hidden="true"></i>Download résumé</a>`
              : ''
          }
        </div>
        <div class="contact-links">
          <a href="${esc(identity.github)}" target="_blank" rel="noopener"><i class="fa-brands fa-github" aria-hidden="true"></i>${esc(identity.githubLabel)}</a>
          <a href="tel:${esc(identity.phone.replace(/\s+/g, ''))}"><i class="fa-solid fa-phone" aria-hidden="true"></i>${esc(identity.phone)}</a>
          <span><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${esc(identity.location)}</span>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="tile-inner">
      <div class="footer-cols">
        <div class="footer-col">
          <p class="footer-head">Explore</p>
          <a href="#work">Work</a>
          <a href="#skills">Skills</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
        <div class="footer-col">
          <p class="footer-head">Projects</p>
          ${footerProjectsHtml(content.projects)}
        </div>
        <div class="footer-col">
          <p class="footer-head">Elsewhere</p>
          <a href="${esc(identity.github)}" target="_blank" rel="noopener">${esc(identity.githubLabel)}</a>
          <a href="mailto:${esc(identity.email)}">${esc(identity.email)}</a>
          <a href="tel:${esc(identity.phone.replace(/\s+/g, ''))}">${esc(identity.phone)}</a>
        </div>
      </div>
      <div class="footer-legal">
        <span>© <span data-year>${new Date().getFullYear()}</span> ${esc(identity.name)}. All rights reserved.</span>
        <span>${esc(identity.location)}</span>
      </div>
    </div>
  </footer>

  <script src="/js/theme.js?v=6" defer></script>
  <script src="/js/motion.js?v=6" defer></script>
  <script src="/js/configurator.js?v=6" defer></script>
  <script type="module" src="/js/hero3d.js?v=6"></script>
</body>
</html>`;
}
