/* ============================================================
   RENDEZ-VOUS LOCAL — motion landing
   Signature scrollcraft : le tracé de la demande de RDV se dessine
   au fil du défilement (stroke-dashoffset) et reste DANS le quartier.
   Reveal doux au scroll (IntersectionObserver) — zéro librairie.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Reveal au scroll ---------- */
  function initReveals() {
    var items = document.querySelectorAll('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('vu'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('vu'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Signature : tracé local dessiné au scroll ---------- */
  function initTrace() {
    var chemin = document.getElementById('chemin-client');
    var hud = document.getElementById('hud-pct');
    if (!chemin) return;
    var LONGUEUR = chemin.getTotalLength();
    chemin.style.strokeDasharray = LONGUEUR + ' ' + LONGUEUR;
    chemin.style.strokeDashoffset = String(LONGUEUR);

    if (reduceMotion) {
      chemin.style.strokeDashoffset = '0';
      if (hud) hud.textContent = '100 %';
      return;
    }

    var scene = document.getElementById('scene-map') || chemin.parentElement;
    var ticking = false;

    function maj() {
      ticking = false;
      var r = scene.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      // Le tracé vit entre l'entrée basse et le milieu de l'écran
      var debut = vh * 0.85;
      var fin = vh * 0.30;
      var p = (debut - r.top) / (debut - fin);
      p = Math.max(0, Math.min(1, p));
      chemin.style.strokeDashoffset = String(LONGUEUR * (1 - p));
      if (hud) hud.textContent = Math.round(p * 100) + ' %';
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(maj); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    maj();
  }

  /* ---------- Nav : état actif + fond ---------- */
  function initNav() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var onScroll = function () {
      nav.style.boxShadow = window.scrollY > 8 ? '0 4px 18px rgba(38,49,30,.08)' : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  initReveals();
  initTrace();
  initNav();
})();
