// The single source of truth for all editable site content.
// DEFAULT_CONTENT is rendered when the store is empty/unconfigured, so the site
// always works. The admin editor saves overrides into the store on top of these.

import { getJSON, setJSON, isStoreConfigured } from './store.js';

const CONTENT_KEY = 'portfolio:content';

export const DEFAULT_CONTENT = {
  site: {
    // Live domain — used for canonical, Open Graph, Twitter, JSON-LD and sitemap URLs.
    url: 'https://thowdanaleryani.vercel.app',
    title: 'Thowdan Al-Eryani — Full-Stack & Mobile Developer',
    description:
      'Full-stack and mobile developer building production systems end to end — React & Next.js on the web, Flutter on mobile, with real-time IoT and AI. Silver medalist at the Huawei ICT Competition.',
    keywords:
      'Thowdan Al-Eryani, full-stack developer, mobile developer, React, Next.js, Flutter, Node.js, IoT, portfolio',
    ogImage: '/myjpg.jpg',
    locale: 'en_US',
  },
  identity: {
    name: 'Thowdan Al-Eryani',
    initials: 'TA',
    availability: 'Open to opportunities worldwide',
    heroTitleA: 'Full-Stack &',
    heroTitleB: 'Mobile Developer',
    heroIntro:
      'I build production systems end to end — React & Next.js on the web, Flutter on mobile, with real-time IoT and AI woven in. Silver medalist at the Huawei ICT Competition.',
    cardName: 'Thowdan Al-Eryani',
    cardSub: 'B.Sc. Information Systems · 2026',
    email: 'thowdan64@gmail.com',
    phone: '+20 155 105 0906',
    github: 'https://github.com/thowdan',
    githubLabel: 'github.com/thowdan',
    location: 'Giza, Egypt',
    // Leave empty until you add a resume.pdf — the Résumé buttons hide while empty
    // so there's never a broken link. Set this (e.g. "/resume.pdf") via the admin.
    resumeUrl: '',
    photo: '/myjpg.jpg',
  },
  stats: [
    { value: '94%', label: 'Fire-detection accuracy' },
    { value: 'Silver', label: 'Huawei ICT · National' },
    { value: '4th', label: 'Best project, university-wide' },
  ],
  projects: [
    {
      num: '01',
      name: 'RoboFireFighter',
      tag: 'Smart Firefighting Robot · Graduation Project',
      desc: "An autonomous firefighting system uniting robotics, IoT and deep-learning fire detection. I built the Flutter mobile app and the robot-to-app integration layer — delivering real-time fire alerts, a three-tier severity system, and a live monitoring dashboard with instant two-way status updates.",
      stack: ['Flutter', 'Dart', 'IoT', 'Raspberry Pi'],
      meta: 'Best Graduation Project · IT Department',
      accentNote: 'Authored research paper — YOLOv11 + ResNet + SVM, 94% detection accuracy',
      link: '',
      linkLabel: '',
    },
    {
      num: '02',
      name: 'RealtimeHub',
      tag: 'Real-time collaboration platform',
      desc: 'A full-stack collaboration platform unifying messaging and productivity workflows in one app. Engineered live multi-user synchronization with Socket.IO and Redis, propagating updates across concurrent sessions in real time without page reloads.',
      stack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Socket.IO'],
      meta: '',
      accentNote: '',
      link: 'https://realtimehubspace.vercel.app',
      linkLabel: 'realtimehubspace.vercel.app',
    },
    {
      num: '03',
      name: 'SnipCheck',
      tag: 'AI-powered code-review API',
      desc: 'A solo-built, production-deployed REST API that analyzes code snippets and returns structured feedback: plain-English explanations, bug detection, complexity ratings and refactoring suggestions. Hardened with JSON response validation, API-key auth and per-client rate limiting.',
      stack: ['Node.js', 'Express', 'Gemini API', 'REST'],
      meta: '',
      accentNote: '',
      link: 'https://snipcheck.vercel.app',
      linkLabel: 'snipcheck.vercel.app',
    },
  ],
  skills: [
    { label: 'Languages', items: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'PHP', 'SQL', 'Dart'] },
    { label: 'Frontend', items: ['React', 'Next.js', 'Flutter', 'HTML', 'CSS'] },
    { label: 'Backend', items: ['Node.js', 'Express', 'REST APIs', 'Socket.IO', 'Redis'] },
    { label: 'Databases & Cloud', items: ['PostgreSQL', 'Supabase', 'Firebase', 'Vercel'] },
    { label: 'Mobile & IoT', items: ['Flutter', 'Dart', 'IoT Protocols', 'Raspberry Pi'] },
    { label: 'AI Integration', items: ['Gemini API', 'Prompt Engineering', 'REST AI Services', 'JSON Validation'] },
  ],
  // Recruiter configurator — Apple buy-page grammar: pick what your team
  // needs, the evidence panel reconfigures. projectRefs match projects by
  // name (case-insensitive); stat values with a leading number get the
  // count-up animation, others stay static.
  configurator: {
    eyebrow: 'Configure your hire',
    title: 'What does your team need?',
    lead: 'Pick a need — the evidence reconfigures.',
    options: [
      {
        id: 'frontend',
        chipLabel: 'A frontend engineer',
        statement:
          'Interfaces engineered like products — React and Next.js on the web, Flutter on mobile, with the motion and detail to match.',
        proof: ['React', 'Next.js', 'TypeScript', 'Flutter', 'CSS'],
        projectRefs: ['RealtimeHub', 'RoboFireFighter'],
        stat: { value: '2', label: 'production frontends live right now' },
      },
      {
        id: 'backend',
        chipLabel: 'A backend engineer',
        statement:
          'APIs that ship hardened — auth, rate limiting, response validation, and real-time sync over Socket.IO and Redis, all running in production.',
        proof: ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Socket.IO', 'REST'],
        projectRefs: ['SnipCheck', 'RealtimeHub'],
        stat: { value: '94%', label: 'deep-learning detection accuracy, served through my integration layer' },
      },
      {
        id: 'fullstack',
        chipLabel: 'A full-stack owner',
        statement:
          'One owner from schema to pixels: I design the data model, build the API, ship the UI and run the deploy — no hand-offs, no seams.',
        proof: ['System design', 'REST APIs', 'Vercel', 'Supabase', 'Flutter + IoT'],
        projectRefs: ['RoboFireFighter', 'RealtimeHub', 'SnipCheck'],
        stat: { value: '3', label: 'systems shipped end to end' },
      },
      {
        id: 'shipper',
        chipLabel: 'Someone who ships fast',
        statement:
          'Solo-built and production-deployed: idea to live URL in weeks, with the hardening usually reserved for teams.',
        proof: ['Solo delivery', 'Production deploys', 'Rate limiting', 'API auth'],
        projectRefs: ['SnipCheck', 'RealtimeHub'],
        stat: { value: '2', label: 'live products built solo, idea to URL' },
      },
    ],
  },
  about: {
    heading: 'About',
    paragraphs: [
      "I'm a full-stack and mobile developer with a B.Sc. in Information Systems. I like owning a system end to end — from a Flutter app talking to a Raspberry Pi over IoT, to a React & Node platform syncing live across users with Socket.IO and Redis.",
      "Recently I've focused on real-time collaboration and AI-powered services, authoring a deep-learning research paper and earning a silver medal at the Huawei ICT Competition's national phase.",
    ],
  },
  education: {
    degree: 'B.Sc. Information Systems',
    detail: 'Misr University for Science & Technology (MUST)\nCollege of IT, Giza · Graduated 2026',
  },
  languages: [
    { name: 'Arabic', level: 'Native' },
    { name: 'English', level: 'Professional' },
  ],
  awards: [
    { iconClass: 'fa-solid fa-medal', title: 'Silver Medal — Huawei ICT Competition', sub: 'National Phase · 2024–2025' },
    { iconClass: 'fa-solid fa-trophy', title: 'Best Graduation Project', sub: 'IT Department · 4th best across the university' },
    { iconClass: 'fa-solid fa-certificate', title: 'Huawei Certifications', sub: 'Mobile App & Web Development · 60 hrs each, ICT Hub Egypt' },
    { iconClass: 'fa-solid fa-flask', title: 'Research Paper (submitted)', sub: 'Smart Firefighting Robot Using Deep Learning & IoT' },
  ],
  contact: {
    heading: "Let's build something.",
    sub: 'Open to full-stack and mobile roles worldwide. The fastest way to reach me is email.',
  },
};

// Shallow-merge stored overrides over defaults, section by section, so a partial
// save never wipes sections that weren't included.
function mergeContent(base, override) {
  if (!override || typeof override !== 'object') return base;
  const out = { ...base };
  for (const key of Object.keys(base)) {
    const o = override[key];
    if (o == null) continue;
    if (Array.isArray(base[key])) {
      out[key] = Array.isArray(o) ? o : base[key];
    } else if (typeof base[key] === 'object') {
      out[key] = { ...base[key], ...o };
    } else {
      out[key] = o;
    }
  }
  return out;
}

export async function getContent() {
  const stored = await getJSON(CONTENT_KEY);
  const merged = mergeContent(DEFAULT_CONTENT, stored);
  merged._meta = {
    storeConfigured: isStoreConfigured(),
    customized: !!stored,
    updatedAt: stored?._updatedAt || null,
  };
  return merged;
}

export async function saveContent(incoming) {
  const clean = validateContent(incoming);
  clean._updatedAt = new Date().toISOString();
  await setJSON(CONTENT_KEY, clean);
  return clean;
}

// Defensive validation: enforces shape, strips unknown keys, and caps sizes so a
// compromised/abused admin session can't store an enormous or malformed blob.
export function validateContent(input) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Body must be a JSON object.');
  }

  const str = (v, max = 2000) => {
    if (v == null) return '';
    if (typeof v !== 'string') throw badRequest('Expected a string value.');
    if (v.length > max) throw badRequest(`A field exceeds the ${max}-character limit.`);
    return v;
  };
  const arr = (v, max = 50) => {
    if (v == null) return [];
    if (!Array.isArray(v)) throw badRequest('Expected an array value.');
    if (v.length > max) throw badRequest(`A list exceeds the ${max}-item limit.`);
    return v;
  };

  const d = DEFAULT_CONTENT;
  const site = input.site || {};
  const identity = input.identity || {};
  const configurator = input.configurator || {};
  const about = input.about || {};
  const education = input.education || {};
  const contact = input.contact || {};

  return {
    site: {
      url: str(site.url ?? d.site.url, 200),
      title: str(site.title ?? d.site.title, 200),
      description: str(site.description ?? d.site.description, 400),
      keywords: str(site.keywords ?? d.site.keywords, 400),
      ogImage: str(site.ogImage ?? d.site.ogImage, 400),
      locale: str(site.locale ?? d.site.locale, 20),
    },
    identity: {
      name: str(identity.name ?? d.identity.name, 120),
      initials: str(identity.initials ?? d.identity.initials, 6),
      availability: str(identity.availability ?? d.identity.availability, 160),
      heroTitleA: str(identity.heroTitleA ?? d.identity.heroTitleA, 120),
      heroTitleB: str(identity.heroTitleB ?? d.identity.heroTitleB, 120),
      heroIntro: str(identity.heroIntro ?? d.identity.heroIntro, 800),
      cardName: str(identity.cardName ?? d.identity.cardName, 120),
      cardSub: str(identity.cardSub ?? d.identity.cardSub, 160),
      email: str(identity.email ?? d.identity.email, 160),
      phone: str(identity.phone ?? d.identity.phone, 60),
      github: str(identity.github ?? d.identity.github, 200),
      githubLabel: str(identity.githubLabel ?? d.identity.githubLabel, 120),
      location: str(identity.location ?? d.identity.location, 120),
      resumeUrl: str(identity.resumeUrl ?? d.identity.resumeUrl, 300),
      photo: str(identity.photo ?? d.identity.photo, 400),
    },
    stats: arr(input.stats, 12).map((s) => ({
      value: str(s?.value, 40),
      label: str(s?.label, 120),
    })),
    projects: arr(input.projects, 30).map((p) => ({
      num: str(p?.num, 8),
      name: str(p?.name, 120),
      tag: str(p?.tag, 200),
      desc: str(p?.desc, 1500),
      stack: arr(p?.stack, 30).map((t) => str(t, 60)),
      meta: str(p?.meta, 200),
      accentNote: str(p?.accentNote, 300),
      link: str(p?.link, 300),
      linkLabel: str(p?.linkLabel, 120),
    })),
    skills: arr(input.skills, 20).map((g) => ({
      label: str(g?.label, 80),
      items: arr(g?.items, 40).map((t) => str(t, 60)),
    })),
    configurator: {
      eyebrow: str(configurator.eyebrow ?? d.configurator.eyebrow, 80),
      title: str(configurator.title ?? d.configurator.title, 160),
      lead: str(configurator.lead ?? d.configurator.lead, 300),
      options: arr(configurator.options ?? d.configurator.options, 8).map((o) => ({
        id: str(o?.id, 40),
        chipLabel: str(o?.chipLabel, 80),
        statement: str(o?.statement, 400),
        proof: arr(o?.proof, 12).map((t) => str(t, 60)),
        projectRefs: arr(o?.projectRefs, 6).map((t) => str(t, 120)),
        stat: { value: str(o?.stat?.value, 40), label: str(o?.stat?.label, 160) },
      })),
    },
    about: {
      heading: str(about.heading ?? d.about.heading, 80),
      paragraphs: arr(about.paragraphs, 10).map((p) => str(p, 2000)),
    },
    education: {
      degree: str(education.degree ?? d.education.degree, 160),
      detail: str(education.detail ?? d.education.detail, 400),
    },
    languages: arr(input.languages, 20).map((l) => ({
      name: str(l?.name, 60),
      level: str(l?.level, 60),
    })),
    awards: arr(input.awards, 20).map((a) => ({
      iconClass: str(a?.iconClass, 80),
      title: str(a?.title, 200),
      sub: str(a?.sub, 300),
    })),
    contact: {
      heading: str(contact.heading ?? d.contact.heading, 160),
      sub: str(contact.sub ?? d.contact.sub, 400),
    },
  };
}

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

export { CONTENT_KEY };
