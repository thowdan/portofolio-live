// Recruiter configurator — chip selection for the server-rendered evidence
// panels. Every panel is already in the HTML (first one active for no-JS and
// SEO); this script only toggles classes, so nothing is injected client-side.
//
// A11y: WAI-ARIA tabs with automatic activation — roving tabindex, arrow-key
// navigation (wrapping), Home/End. Unlike motion.js this file must NOT bail
// under prefers-reduced-motion: selection has to keep working; only the
// count-up animation is skipped (CSS already collapses the crossfade).
(function () {
  'use strict';

  var rootEl = document.querySelector('[data-configurator]');
  if (!rootEl) return;

  var chips = [].slice.call(rootEl.querySelectorAll('.cfg-chip'));
  var panels = [].slice.call(rootEl.querySelectorAll('.cfg-panel'));
  if (!chips.length || chips.length !== panels.length) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Same numeric contract as the stats count-up in motion.js: animate the
  // digits, keep any prefix/suffix ("94%", "2"), leave non-numeric text alone.
  function countUp(el) {
    var text = el.textContent;
    var m = text.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/);
    if (!m || reducedMotion.matches) return;
    var prefix = m[1];
    var target = parseFloat(m[2]);
    var suffix = m[3];
    var decimals = (m[2].split('.')[1] || '').length;
    var start = performance.now();
    var duration = 700;
    function tick(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = text;
    }
    requestAnimationFrame(tick);
  }

  function select(index, focus) {
    chips.forEach(function (chip, i) {
      var on = i === index;
      chip.classList.toggle('is-selected', on);
      chip.setAttribute('aria-selected', on ? 'true' : 'false');
      chip.setAttribute('tabindex', on ? '0' : '-1');
      panels[i].classList.toggle('is-active', on);
    });
    if (focus) chips[index].focus();
    var value = panels[index].querySelector('[data-count-up]');
    if (value) countUp(value);
  }

  chips.forEach(function (chip, i) {
    chip.addEventListener('click', function () {
      if (!chip.classList.contains('is-selected')) select(i);
    });
    chip.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % chips.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + chips.length) % chips.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = chips.length - 1;
      if (next === null) return;
      e.preventDefault();
      select(next, true);
    });
  });
})();
