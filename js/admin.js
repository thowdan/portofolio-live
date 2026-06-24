// Admin editor. Talks to /api/session (auth) and /api/content (load/save).
// Content edits are held in a working `state` object and PUT to the server on save;
// the server validates, stores, and the live (server-rendered) site reflects it.
(function () {
  'use strict';

  var state = null; // working copy of the content
  var meta = {};

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    boot: $('boot'), login: $('login'), editor: $('editor'),
    loginForm: $('login-form'), password: $('password'),
    loginStatus: $('login-status'), loginNotice: $('login-notice'),
    editorNotice: $('editor-notice'), form: $('form'),
    saveStatus: $('save-status'), save: $('save'), discard: $('discard'), logout: $('logout'),
  };

  // ---- tiny DOM helpers ----------------------------------------------------
  function h(tag, attrs) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else e.setAttribute(k, attrs[k]);
      }
    }
    for (var i = 2; i < arguments.length; i++) {
      var kid = arguments[i];
      if (kid == null) continue;
      e.appendChild(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return e;
  }

  function field(label, value, on, opts) {
    opts = opts || {};
    var input = document.createElement(opts.textarea ? 'textarea' : 'input');
    if (!opts.textarea) input.type = opts.type || 'text';
    if (opts.placeholder) input.placeholder = opts.placeholder;
    input.value = value == null ? '' : value;
    input.addEventListener('input', function () { on(input.value); });
    var wrap = h('div', { class: 'field' });
    wrap.appendChild(h('label', null, label));
    if (opts.hint) wrap.appendChild(h('small', { class: 'muted' }, opts.hint));
    wrap.appendChild(input);
    return wrap;
  }

  function row() {
    var r = h('div', { class: 'field-row' });
    for (var i = 0; i < arguments.length; i++) r.appendChild(arguments[i]);
    return r;
  }

  function csvField(label, obj, key, hint) {
    return field(label, (obj[key] || []).join(', '), function (v) {
      obj[key] = v.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    }, { hint: hint });
  }

  function card(title) {
    var c = h('div', { class: 'admin-card' }, h('h2', null, title));
    for (var i = 1; i < arguments.length; i++) if (arguments[i]) c.appendChild(arguments[i]);
    return c;
  }

  function removeBtn(onClick) {
    var b = h('button', { class: 'btn-soft btn-danger', type: 'button' }, 'Remove');
    b.addEventListener('click', onClick);
    return b;
  }

  // Repeatable list of objects with add/remove + per-item fields.
  function listCard(title, arr, itemFields, makeNew, addLabel) {
    var body = h('div');
    function render() {
      body.innerHTML = '';
      arr.forEach(function (item, i) {
        var wrap = h('div', { class: 'repeat-item' });
        var head = h('div', { class: 'repeat-item-head' },
          h('strong', null, (addLabel || 'Item') + ' ' + (i + 1)));
        head.appendChild(removeBtn(function () { arr.splice(i, 1); render(); }));
        wrap.appendChild(head);
        itemFields(item).forEach(function (f) { wrap.appendChild(f); });
        body.appendChild(wrap);
      });
      var add = h('button', { class: 'btn-soft', type: 'button' }, '+ Add ' + (addLabel || 'item'));
      add.addEventListener('click', function () { arr.push(makeNew()); render(); });
      body.appendChild(add);
    }
    render();
    return card(title, body);
  }

  // Repeatable list of plain strings (e.g. about paragraphs).
  function stringListCard(title, arr, addLabel, textarea) {
    var body = h('div');
    function render() {
      body.innerHTML = '';
      arr.forEach(function (val, i) {
        var input = document.createElement(textarea ? 'textarea' : 'input');
        if (!textarea) input.type = 'text';
        input.value = val || '';
        input.addEventListener('input', function () { arr[i] = input.value; });
        var wrap = h('div', { class: 'repeat-item' });
        var fwrap = h('div', { class: 'field' });
        fwrap.appendChild(input);
        wrap.appendChild(fwrap);
        wrap.appendChild(removeBtn(function () { arr.splice(i, 1); render(); }));
        body.appendChild(wrap);
      });
      var add = h('button', { class: 'btn-soft', type: 'button' }, '+ Add ' + (addLabel || 'item'));
      add.addEventListener('click', function () { arr.push(''); render(); });
      body.appendChild(add);
    }
    render();
    return card(title, body);
  }

  // ---- build the full form -------------------------------------------------
  function buildForm() {
    var f = els.form;
    f.innerHTML = '';
    var s = state.site, id = state.identity, ab = state.about, ed = state.education, ct = state.contact;

    f.appendChild(card('SEO & site',
      field('Browser tab / SEO title', s.title, function (v) { s.title = v; }),
      field('Meta description', s.description, function (v) { s.description = v; }, { textarea: true }),
      field('Keywords (comma separated)', s.keywords, function (v) { s.keywords = v; }),
      row(
        field('Canonical site URL', s.url, function (v) { s.url = v; }, { hint: 'e.g. https://your-site.vercel.app' }),
        field('Social share image path', s.ogImage, function (v) { s.ogImage = v; })
      )
    ));

    f.appendChild(card('Identity',
      row(
        field('Name', id.name, function (v) { id.name = v; }),
        field('Logo initials', id.initials, function (v) { id.initials = v; })
      ),
      field('Availability line', id.availability, function (v) { id.availability = v; }),
      row(
        field('Hero title — line 1', id.heroTitleA, function (v) { id.heroTitleA = v; }),
        field('Hero title — line 2', id.heroTitleB, function (v) { id.heroTitleB = v; })
      ),
      field('Hero intro paragraph', id.heroIntro, function (v) { id.heroIntro = v; }, { textarea: true }),
      row(
        field('Photo card name', id.cardName, function (v) { id.cardName = v; }),
        field('Photo card subtitle', id.cardSub, function (v) { id.cardSub = v; })
      ),
      row(
        field('Email', id.email, function (v) { id.email = v; }),
        field('Phone', id.phone, function (v) { id.phone = v; })
      ),
      row(
        field('GitHub URL', id.github, function (v) { id.github = v; }),
        field('GitHub label', id.githubLabel, function (v) { id.githubLabel = v; })
      ),
      row(
        field('Location', id.location, function (v) { id.location = v; }),
        field('Résumé URL', id.resumeUrl, function (v) { id.resumeUrl = v; })
      ),
      field('Photo path', id.photo, function (v) { id.photo = v; })
    ));

    f.appendChild(listCard('Stats', state.stats, function (item) {
      return [row(
        field('Value', item.value, function (v) { item.value = v; }),
        field('Label', item.label, function (v) { item.label = v; })
      )];
    }, function () { return { value: '', label: '' }; }, 'stat'));

    f.appendChild(listCard('Projects', state.projects, function (p) {
      return [
        row(
          field('Number', p.num, function (v) { p.num = v; }),
          field('Name', p.name, function (v) { p.name = v; })
        ),
        field('Tagline', p.tag, function (v) { p.tag = v; }),
        field('Description', p.desc, function (v) { p.desc = v; }, { textarea: true }),
        csvField('Tech stack (comma separated)', p, 'stack'),
        row(
          field('Link URL (optional)', p.link, function (v) { p.link = v; }),
          field('Link label (optional)', p.linkLabel, function (v) { p.linkLabel = v; })
        ),
        field('Meta line (optional)', p.meta, function (v) { p.meta = v; }),
        field('Highlight note (optional)', p.accentNote, function (v) { p.accentNote = v; })
      ];
    }, function () {
      return { num: '', name: '', tag: '', desc: '', stack: [], meta: '', accentNote: '', link: '', linkLabel: '' };
    }, 'project'));

    f.appendChild(listCard('Skill groups', state.skills, function (g) {
      return [
        field('Group label', g.label, function (v) { g.label = v; }),
        csvField('Items (comma separated)', g, 'items')
      ];
    }, function () { return { label: '', items: [] }; }, 'group'));

    f.appendChild(card('About',
      field('Heading', ab.heading, function (v) { ab.heading = v; }),
      stringListCard('Paragraphs', ab.paragraphs, 'paragraph', true)
    ));

    f.appendChild(card('Education',
      field('Degree', ed.degree, function (v) { ed.degree = v; }),
      field('Detail (use new lines for breaks)', ed.detail, function (v) { ed.detail = v; }, { textarea: true })
    ));

    f.appendChild(listCard('Languages', state.languages, function (l) {
      return [row(
        field('Language', l.name, function (v) { l.name = v; }),
        field('Level', l.level, function (v) { l.level = v; })
      )];
    }, function () { return { name: '', level: '' }; }, 'language'));

    f.appendChild(listCard('Recognition / awards', state.awards, function (a) {
      return [
        field('Font Awesome icon class', a.iconClass, function (v) { a.iconClass = v; }, { hint: 'e.g. fa-solid fa-medal' }),
        field('Title', a.title, function (v) { a.title = v; }),
        field('Subtitle', a.sub, function (v) { a.sub = v; })
      ];
    }, function () { return { iconClass: 'fa-solid fa-star', title: '', sub: '' }; }, 'award'));

    f.appendChild(card('Contact',
      field('Heading', ct.heading, function (v) { ct.heading = v; }),
      field('Subtitle', ct.sub, function (v) { ct.sub = v; }, { textarea: true })
    ));
  }

  // ---- networking ----------------------------------------------------------
  function api(path, opts) {
    opts = opts || {};
    opts.credentials = 'same-origin';
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    return fetch(path, opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        return { ok: res.ok, status: res.status, body: body };
      });
    });
  }

  function notice(target, text, kind) {
    target.innerHTML = '';
    if (text) target.appendChild(h('div', { class: 'notice' + (kind ? ' ' + kind : '') }, text));
  }

  function show(view) {
    els.boot.classList.add('hidden');
    els.login.classList.toggle('hidden', view !== 'login');
    els.editor.classList.toggle('hidden', view !== 'editor');
  }

  function setStatus(el, text, kind) {
    el.textContent = text || '';
    el.className = 'admin-status' + (kind ? ' ' + kind : '');
  }

  // ---- flows ---------------------------------------------------------------
  function boot() {
    api('/api/session').then(function (r) {
      var st = r.body || {};
      if (!st.adminConfigured) {
        show('login');
        els.password.disabled = true;
        els.loginForm.querySelector('button').disabled = true;
        notice(els.loginNotice,
          'Admin login is not set up yet. Add an ADMIN_PASSWORD environment variable in your Vercel project (and the Upstash storage variables) to enable editing. See README.md.',
          'warn');
        return;
      }
      if (st.authenticated) { loadContent(); return; }
      show('login');
      if (!st.storeConfigured) {
        notice(els.loginNotice,
          'Heads up: the storage backend is not configured, so saving will not persist yet. Add the Upstash variables (see README) to enable publishing.',
          'warn');
      }
    }).catch(function () {
      show('login');
      notice(els.loginNotice, 'Could not reach the server. Is the backend deployed?', 'warn');
    });
  }

  function loadContent() {
    api('/api/content').then(function (r) {
      if (!r.ok) { show('login'); return; }
      meta = r.body._meta || {};
      delete r.body._meta;
      state = r.body;
      buildForm();
      show('editor');
      if (!meta.storeConfigured) {
        notice(els.editorNotice,
          'Storage backend not configured — you can edit here, but Save will not persist until you add the Upstash variables (see README).',
          'warn');
      } else {
        notice(els.editorNotice, '');
      }
      setStatus(els.saveStatus, meta.updatedAt ? 'Last saved ' + new Date(meta.updatedAt).toLocaleString() : 'Loaded.');
    });
  }

  els.loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus(els.loginStatus, 'Signing in…');
    api('/api/session', { method: 'POST', body: JSON.stringify({ password: els.password.value }) })
      .then(function (r) {
        if (r.ok) { setStatus(els.loginStatus, ''); loadContent(); }
        else setStatus(els.loginStatus, r.body.error || 'Login failed.', 'err');
      });
  });

  els.save.addEventListener('click', function () {
    setStatus(els.saveStatus, 'Saving…');
    api('/api/content', { method: 'PUT', body: JSON.stringify(state) }).then(function (r) {
      if (r.ok) {
        setStatus(els.saveStatus, 'Saved & published ✓ — changes are live within ~30s.', 'ok');
      } else if (r.status === 401) {
        setStatus(els.saveStatus, 'Session expired — please log in again.', 'err');
        show('login');
      } else {
        setStatus(els.saveStatus, r.body.error || 'Save failed.', 'err');
      }
    });
  });

  els.discard.addEventListener('click', function () {
    setStatus(els.saveStatus, 'Reloading…');
    loadContent();
  });

  els.logout.addEventListener('click', function () {
    api('/api/session', { method: 'DELETE' }).then(function () {
      state = null;
      notice(els.loginNotice, '');
      show('login');
    });
  });

  boot();
})();
