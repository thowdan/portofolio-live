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
