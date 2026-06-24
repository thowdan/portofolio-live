// Renders the full homepage HTML from the content model. Pure (no Node-only deps
// beyond ./layout), and every dynamic value is escaped via esc().

import { esc, head } from './layout.js';

const themeToggle = `
      <button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle dark mode">
        <i class="fa-solid fa-moon icon-moon" aria-hidden="true"></i>
        <i class="fa-solid fa-sun icon-sun" aria-hidden="true"></i>
      </button>`;

function statsHtml(stats) {
  return stats
    .map(
      (s) => `
        <div class="stat">
          <div class="stat-value">${esc(s.value)}</div>
          <div class="stat-label">${esc(s.label)}</div>
        </div>`
    )
    .join('');
}

function chips(items) {
  return items.map((t) => `<span class="chip">${esc(t)}</span>`).join('');
}

function projectsHtml(projects) {
  return projects
    .map((p) => {
      const accent = p.accentNote
        ? `<div class="project-note"><i class="fa-solid fa-star" aria-hidden="true"></i>${esc(p.accentNote)}</div>`
        : '';
      const link = p.link
        ? `<a class="project-link" href="${esc(p.link)}" target="_blank" rel="noopener">${esc(
            p.linkLabel || 'Visit'
          )} <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`
        : '';
      const meta = p.meta ? `<span class="project-meta">${esc(p.meta)}</span>` : '';
      return `
        <article class="project reveal">
          <div class="project-grid">
            <div class="project-num">${esc(p.num)}</div>
            <div>
              <h3 class="project-name">${esc(p.name)}</h3>
              <div class="project-tag">${esc(p.tag)}</div>
              <p class="project-desc">${esc(p.desc)}</p>
              ${accent}
              <div class="project-foot">
                <div class="chips">${chips(p.stack || [])}</div>
                ${link}
                ${meta}
              </div>
            </div>
          </div>
        </article>`;
    })
    .join('');
}

function skillsHtml(skills) {
  return skills
    .map(
      (g) => `
        <div class="skill-card reveal">
          <div class="eyebrow">${esc(g.label)}</div>
          <div class="chips">${chips(g.items || [])}</div>
        </div>`
    )
    .join('');
}

function awardsHtml(awards) {
  return awards
    .map(
      (a) => `
          <div class="award">
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

export function renderHome(content) {
  const { identity, about, education } = content;
  const eduDetail = esc(education.detail).replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
${head(content, { path: '/' })}
<body>
  <div class="bg-base" aria-hidden="true"></div>
  <div class="glow-field" aria-hidden="true">
    <div class="glow glow-a"></div>
    <div class="glow glow-b"></div>
    <div class="glow glow-c"></div>
  </div>

  <a class="skip-link" href="#top">Skip to content</a>

  <nav class="nav" id="nav">
    <div class="nav-inner">
      <a class="brand" href="#top">
        <span class="logo">${esc(identity.initials)}</span>
        <span class="brand-name">${esc(identity.name)}</span>
      </a>
      <div class="nav-links">
        <a class="nav-link" href="#work">Work</a>
        <a class="nav-link" href="#skills">Skills</a>
        <a class="nav-link" href="#about">About</a>
        <a class="nav-link" href="#contact">Contact</a>
        ${themeToggle}
        <a class="btn btn-accent btn-sm" href="${esc(identity.resumeUrl)}" target="_blank" rel="noopener">Résumé</a>
      </div>
    </div>
  </nav>

  <main id="top">
    <section class="hero" data-screen-label="Hero">
      <div class="hero-copy">
        <div class="reveal eyebrow-accent">${esc(identity.availability)}</div>
        <h1 class="reveal hero-title">${esc(identity.heroTitleA)}<br>${esc(identity.heroTitleB)}</h1>
        <p class="reveal hero-intro">${esc(identity.heroIntro)}</p>
        <div class="reveal hero-actions">
          <a class="btn btn-accent" href="#work">View selected work</a>
          <a class="btn btn-ghost" href="#contact">Get in touch</a>
        </div>
      </div>
      <div class="reveal hero-photo-wrap">
        <div class="hero-photo-glow" aria-hidden="true"></div>
        <div class="hero-photo">
          <img src="${esc(identity.photo)}" alt="${esc(identity.name)}" width="640" height="800" loading="eager">
          <div class="hero-photo-card">
            <div>
              <div class="hero-photo-name">${esc(identity.cardName)}</div>
              <div class="hero-photo-sub">${esc(identity.cardSub)}</div>
            </div>
            <a class="chip-link" href="${esc(identity.github)}" target="_blank" rel="noopener"><i class="fa-brands fa-github" aria-hidden="true"></i>GitHub</a>
          </div>
        </div>
      </div>
    </section>

    <section class="stats-strip reveal">
      <div class="stats-grid">${statsHtml(content.stats)}</div>
    </section>

    <section class="section" id="work" data-screen-label="Selected Work">
      <div class="section-head reveal">
        <h2 class="section-title">Selected work</h2>
        <span class="section-aside">Three projects, built end to end</span>
      </div>
      <div class="projects">${projectsHtml(content.projects)}</div>
    </section>

    <section class="section" id="skills" data-screen-label="Skills">
      <div class="reveal section-intro">
        <h2 class="section-title">Toolkit</h2>
        <p class="section-lead">The languages, frameworks and platforms I reach for across the stack.</p>
      </div>
      <div class="skills-grid">${skillsHtml(content.skills)}</div>
    </section>

    <section class="section" id="about" data-screen-label="About">
      <div class="about-grid">
        <div class="about-card reveal">
          <h2 class="about-heading">${esc(about.heading)}</h2>
          ${about.paragraphs.map((p) => `<p class="about-text">${esc(p)}</p>`).join('')}
        </div>
        <div class="about-side reveal">
          <div class="side-card">
            <div class="eyebrow">Education</div>
            <div class="side-title">${esc(education.degree)}</div>
            <div class="side-detail">${eduDetail}</div>
          </div>
          <div class="side-card">
            <div class="eyebrow">Languages</div>
            <div class="lang-list">${languagesHtml(content.languages)}</div>
          </div>
        </div>
      </div>

      <div class="reveal recognition">
        <div class="eyebrow">Recognition</div>
        <div class="awards-grid">${awardsHtml(content.awards)}</div>
      </div>
    </section>

    <section class="section" id="contact" data-screen-label="Contact">
      <div class="contact-card reveal">
        <div class="contact-glow" aria-hidden="true"></div>
        <div class="contact-inner">
          <h2 class="contact-title">${esc(content.contact.heading)}</h2>
          <p class="contact-sub">${esc(content.contact.sub)}</p>
          <div class="contact-actions">
            <a class="btn btn-accent" href="mailto:${esc(identity.email)}"><i class="fa-solid fa-envelope" aria-hidden="true"></i>${esc(
    identity.email
  )}</a>
            <a class="btn btn-ghost" href="${esc(identity.resumeUrl)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-down-to-line" aria-hidden="true"></i>Download résumé</a>
          </div>
          <div class="contact-links">
            <a href="${esc(identity.github)}" target="_blank" rel="noopener"><i class="fa-brands fa-github" aria-hidden="true"></i>${esc(
    identity.githubLabel
  )}</a>
            <a href="tel:${esc(identity.phone.replace(/\s+/g, ''))}"><i class="fa-solid fa-phone" aria-hidden="true"></i>${esc(
    identity.phone
  )}</a>
            <span><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${esc(identity.location)}</span>
          </div>
        </div>
      </div>
      <div class="footer">© <span data-year>${new Date().getFullYear()}</span> ${esc(identity.name)}</div>
    </section>
  </main>

  <script src="/js/theme.js" defer></script>
</body>
</html>`;
}
