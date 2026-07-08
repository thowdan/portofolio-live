// Shared front-end behaviour for every page: dark-mode toggle (persisted),
// nav elevation on scroll, and the dynamic copyright year. The initial theme is
// already applied pre-paint by an inline script in <head>; this only handles
// interaction afterwards.
(function () {
  'use strict';
  var root = document.documentElement;

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('pf-theme', theme);
    } catch (e) {}
  }

  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });

  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 16);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Mobile menu — full-screen frosted overlay (homepage only; other pages have
  // no [data-menu] so this block is inert there). Deliberately no full focus
  // trap: the overlay covers the viewport, and Escape + focus restore +
  // aria-expanded are the load-bearing accessibility pieces.
  var menu = document.querySelector('[data-menu]');
  if (menu) {
    var toggles = [].slice.call(document.querySelectorAll('[data-menu-toggle]'));
    var opener = document.querySelector('.subnav-menu');
    var closer = menu.querySelector('.mobile-menu-close');

    var setOpen = function (open) {
      if (open && menu.hidden) {
        // Strip `hidden` first and force a reflow so the opening transition plays.
        menu.hidden = false;
        void menu.offsetHeight;
      }
      menu.classList.toggle('is-open', open);
      root.classList.toggle('menu-open', open);
      toggles.forEach(function (btn) {
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      if (open && closer) closer.focus();
      if (!open && opener) opener.focus();
    };

    toggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setOpen(!menu.classList.contains('is-open'));
      });
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setOpen(false);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
    });

    // Close automatically if the viewport grows past the collapse point.
    var wide = window.matchMedia('(min-width: 835px)');
    var onWide = function (e) {
      if (e.matches && menu.classList.contains('is-open')) setOpen(false);
    };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  // Scroll-triggered reveals: elements with .reveal animate in as they enter the
  // viewport. The <head> adds `reveal-on` to <html> pre-paint, which hides them
  // via CSS until we add `.is-visible` here.
  if (root.classList.contains('reveal-on')) {
    var reveals = [].slice.call(document.querySelectorAll('.reveal'));
    var revealAll = function () {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    };
    if (!('IntersectionObserver' in window) || !reveals.length) {
      revealAll();
    } else {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
      // Safety net: never leave content hidden if the observer misbehaves.
      setTimeout(revealAll, 2000);
    }
  }
})();
