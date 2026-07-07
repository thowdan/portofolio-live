// Homepage motion: sub-nav hairline state, scroll-linked hero (parallax + fade),
// count-up stats, pointer tilt on the hero photo, and a gentle parallax drift on
// the project tiles. Everything except the sub-nav hairline is disabled under
// prefers-reduced-motion; server-rendered content is always the correct
// no-JS/no-motion fallback (stats are rendered with their final values).
(function () {
  'use strict';

  // Sub-nav hairline once the page scrolls — presentational, not motion,
  // so it runs even with reduced motion.
  var subnav = document.getElementById('subnav');
  if (subnav) {
    var onNavScroll = function () {
      subnav.classList.toggle('subnav--raised', window.scrollY > 8);
    };
    window.addEventListener('scroll', onNavScroll, { passive: true });
    onNavScroll();
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ---- count-up stats -------------------------------------------------------
  // "94%" → counts 0–94 then keeps the suffix; values with no leading number
  // ("Silver") are left untouched. The final value is already in the HTML, so
  // this only animates the presentation.
  var statRe = /^(\D*?)(\d+(?:\.\d+)?)(.*)$/;
  var stats = [].slice.call(document.querySelectorAll('.stat-value'));
  if ('IntersectionObserver' in window && stats.length) {
    var statIo = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          obs.unobserve(entry.target);
          var el = entry.target;
          var m = statRe.exec(el.textContent.trim());
          if (!m) return;
          var prefix = m[1];
          var target = parseFloat(m[2]);
          var suffix = m[3];
          var decimals = (m[2].split('.')[1] || '').length;
          var t0 = null;
          var tick = function (now) {
            if (t0 === null) t0 = now;
            var p = Math.min((now - t0) / 900, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.6 }
    );
    stats.forEach(function (el) {
      statIo.observe(el);
    });
  }

  // ---- scroll-linked hero, pointer tilt, project parallax -------------------
  var hero = document.getElementById('hero');
  var copy = document.querySelector('[data-hero-copy]');
  var figure = document.querySelector('[data-hero-figure]');
  var photo = document.querySelector('.hero-photo');
  var parallaxEls = [].slice.call(document.querySelectorAll('[data-parallax]'));

  var tiltX = 0;
  var tiltY = 0;
  var tiltTargetX = 0;
  var tiltTargetY = 0;

  if (window.matchMedia('(pointer: fine)').matches && figure && photo) {
    figure.addEventListener('pointermove', function (e) {
      var r = figure.getBoundingClientRect();
      tiltTargetX = ((e.clientY - r.top) / r.height - 0.5) * -6;
      tiltTargetY = ((e.clientX - r.left) / r.width - 0.5) * 6;
    });
    figure.addEventListener('pointerleave', function () {
      tiltTargetX = 0;
      tiltTargetY = 0;
    });
  }

  function frame() {
    if (document.hidden) return; // resumed by visibilitychange below
    var y = window.scrollY;
    var vh = window.innerHeight;

    if (hero && copy) {
      if (y < hero.offsetHeight) {
        var p = Math.min(y / (hero.offsetHeight * 0.8), 1);
        copy.style.transform = 'translate3d(0,' + (y * 0.12).toFixed(1) + 'px,0)';
        copy.style.opacity = String(Math.max(1 - p * 1.1, 0));
      } else {
        copy.style.opacity = '0';
      }
    }

    if (photo) {
      tiltX += (tiltTargetX - tiltX) * 0.12;
      tiltY += (tiltTargetY - tiltY) * 0.12;
      var ty = hero && y < hero.offsetHeight ? y * 0.06 : 0;
      var sc = Math.max(1 - y / 8000, 0.96);
      photo.style.transform =
        'translate3d(0,' + ty.toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ')' +
        ' rotateX(' + tiltX.toFixed(2) + 'deg) rotateY(' + tiltY.toFixed(2) + 'deg)';
    }

    // Parallax drift: the untransformed parent tile is the position signal, so
    // the applied transform never feeds back into the math.
    for (var i = 0; i < parallaxEls.length; i++) {
      var el = parallaxEls[i];
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      var c = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = 'translate3d(0,' + (c * 28).toFixed(1) + 'px,0)';
    }

    requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) requestAnimationFrame(frame);
  });
  requestAnimationFrame(frame);
})();
