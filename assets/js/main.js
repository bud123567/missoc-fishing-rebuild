/* Miss Ocean City — interaction layer
   Everything degrades gracefully: without JS the page is still readable,
   every link works, and the FAQ panels are the only thing that stay closed. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- nav */
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  var onScroll = function () {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 40);
    if (dock) dock.classList.toggle('is-visible', window.scrollY > 520);
  };

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      links.classList.toggle('is-open', !open);
      document.body.classList.toggle('is-locked', !open);
    });

    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        links.classList.remove('is-open');
        document.body.classList.remove('is-locked');
      }
    });
  }

  /* --------------------------------------------------------------- dock */
  var dock = document.getElementById('dock');

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------- hero entrance */
  var hero = document.getElementById('hero');
  if (hero) {
    var heroImg = hero.querySelector('.hero__media img');
    var start = function () { hero.classList.add('is-ready'); };
    if (heroImg && !heroImg.complete) {
      heroImg.addEventListener('load', start);
      heroImg.addEventListener('error', start);
      setTimeout(start, 1200); // never let a slow image hold the copy hostage
    } else {
      requestAnimationFrame(start);
    }
  }

  /* ------------------------------------------------------ scroll reveals */
  var revealables = document.querySelectorAll('[data-reveal], [data-mask]');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------- counting numbers */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduced && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count'), 10);
        var prefix = el.getAttribute('data-prefix') || '';
        var t0 = null;

        var tick = function (ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 900, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });

    Array.prototype.forEach.call(counters, function (el) { cio.observe(el); });
  }

  /* ------------------------------------------------------------ parallax */
  var parallax = document.querySelectorAll('[data-parallax] img');
  if (parallax.length && !reduced) {
    var ticking = false;

    var moveParallax = function () {
      Array.prototype.forEach.call(parallax, function (img) {
        var box = img.parentElement.getBoundingClientRect();
        if (box.bottom < 0 || box.top > window.innerHeight) return;
        // -8%..+8% of the overflow as the panel crosses the viewport
        var progress = (box.top + box.height / 2 - window.innerHeight / 2) / window.innerHeight;
        img.style.transform = 'translateY(' + (progress * -7).toFixed(2) + '%)';
      });
      ticking = false;
    };

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(moveParallax); ticking = true; }
    }, { passive: true });
    moveParallax();
  }

  /* ----------------------------------------------------------- accordion */
  var triggers = document.querySelectorAll('.acc__trigger');
  Array.prototype.forEach.call(triggers, function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';

      // close siblings so only one answer is open at a time
      Array.prototype.forEach.call(triggers, function (other) {
        if (other === btn) return;
        var op = document.getElementById(other.getAttribute('aria-controls'));
        other.setAttribute('aria-expanded', 'false');
        if (op) op.style.height = '0px';
      });

      btn.setAttribute('aria-expanded', String(!open));
      panel.style.height = open ? '0px' : panel.firstElementChild.offsetHeight + 'px';
    });
  });

  // keep an open panel correctly sized when the text reflows
  window.addEventListener('resize', function () {
    Array.prototype.forEach.call(triggers, function (btn) {
      if (btn.getAttribute('aria-expanded') !== 'true') return;
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (panel) panel.style.height = panel.firstElementChild.offsetHeight + 'px';
    });
  });

  /* ------------------------------------------------------------ lightbox */
  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCount = document.getElementById('lbCount');
  var index = 0;
  var lastFocus = null;

  var show = function (i) {
    index = (i + shots.length) % shots.length;
    var shot = shots[index];
    lbImg.src = shot.getAttribute('data-full');
    lbImg.alt = shot.getAttribute('data-caption') || '';
    if (lbCount) lbCount.textContent = (index + 1) + ' / ' + shots.length;
  };

  var open = function (i) {
    lastFocus = document.activeElement;
    show(i);
    lb.classList.add('is-open');
    document.body.classList.add('is-locked');
    document.getElementById('lbClose').focus();
  };

  var close = function () {
    lb.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    if (lastFocus) lastFocus.focus();
  };

  if (lb && shots.length) {
    shots.forEach(function (shot, i) {
      shot.addEventListener('click', function () { open(i); });
    });

    document.getElementById('lbClose').addEventListener('click', close);
    document.getElementById('lbPrev').addEventListener('click', function () { show(index - 1); });
    document.getElementById('lbNext').addEventListener('click', function () { show(index + 1); });

    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  }

  /* ---------------------------------------------------------------- misc */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
