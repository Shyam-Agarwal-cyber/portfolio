/* ============================================================
   Shyam Agarwal — Portfolio interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---- Footer year ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Nav: scrolled state + progress bar ---- */
  var nav = document.getElementById('nav');
  var progress = document.getElementById('scrollProgress');

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('scrolled', y > 20);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  function closeMenu() {
    if (links) links.classList.remove('open');
    if (toggle) toggle.classList.remove('open');
  }
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
      toggle.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
  }

  /* ---- Reveal on scroll ---- */
  var revealEls = document.querySelectorAll(
    '.reveal, .section__kicker, .section__title, .section__sub, .about__card, ' +
    '.tl-item, .card, .skill-group, .achievements, .contact__intro, .contact__form'
  );

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          var el = entry.target;
          // small stagger for grouped elements
          var delay = el.classList.contains('card') || el.classList.contains('skill-group')
            || el.classList.contains('tl-item') ? (i % 4) * 70 : 0;
          setTimeout(function () { el.classList.add('is-visible'); }, delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Animated stat counters ---- */
  var stats = document.querySelectorAll('.stat__num');
  function animateStat(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = (String(target).split('.')[1] || '').length;
    var duration = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      var val = (target * eased).toFixed(decimals);
      el.textContent = prefix + val + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && stats.length) {
    var statObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateStat(entry.target); statObs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    stats.forEach(function (s) { statObs.observe(s); });
  } else {
    stats.forEach(function (s) {
      s.textContent = (s.getAttribute('data-prefix') || '') +
        s.getAttribute('data-count') + (s.getAttribute('data-suffix') || '');
    });
  }

  /* ---- Contact form ---- */
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');

  function setNote(msg, type) {
    if (!note) return;
    note.textContent = msg;
    note.className = 'contact__form-note' + (type ? ' ' + type : '');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      var action = form.getAttribute('action') || '';
      var usingFormspree = action.indexOf('YOUR_FORM_ID') === -1 && action.indexOf('formspree') !== -1;

      // If Formspree isn't configured yet, fall back to a mailto: draft.
      if (!usingFormspree) {
        e.preventDefault();
        var name = encodeURIComponent(form.name.value || '');
        var email = encodeURIComponent(form.email.value || '');
        var message = encodeURIComponent(form.message.value || '');
        var subject = 'Portfolio contact from ' + decodeURIComponent(name);
        var body = 'Name: ' + decodeURIComponent(name) + '%0D%0A' +
                   'Email: ' + decodeURIComponent(email) + '%0D%0A%0D%0A' +
                   decodeURIComponent(message);
        window.location.href = 'mailto:shyam5320235@gmail.com?subject=' +
          encodeURIComponent(subject) + '&body=' + body;
        setNote('Opening your email app…', 'ok');
        return;
      }

      // Formspree AJAX submit for a smooth, no-redirect experience.
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var original = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      setNote('', '');

      fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          form.reset();
          setNote('Thanks! Your message has been sent. ✓', 'ok');
        } else {
          setNote('Something went wrong. Please email me directly.', 'err');
        }
      }).catch(function () {
        setNote('Network error. Please email me directly.', 'err');
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = original; }
      });
    });
  }
})();
