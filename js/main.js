/* ============================================================
   RENDEZ-VOUS LOCAL — landing (refonte ScrollCraft 2026-09-03)
   -----------------------------------------------------------------
   Ce fichier ne contient AUCUN scroll fait maison : le défilement
   est conduit par js/scrollcraft.js (engine officiel), qui publie
   --sc-p sur chaque acte. Ici, uniquement :
   1. La SIGNATURE du site : lecture de --sc-p sur l'acte pincé
      (le plan) et écriture du dasharray réel des deux tracés SVG.
      L'engine n'est pas touché : il pilote, le plan dessine.
   2. Le folio éditorial (chrome de la grammaire chaptered) : la
      « rue » courante, mise à jour au scroll.
   3. La pré-sélection d'offre : les boutons de prix remplissent le
      select du bulletin de commande puis amènent au formulaire.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };

  /* ---------- 1. SIGNATURE : le plan qui se dessine sous la main ---------- */
  var actePlan = document.querySelector('[data-sc-act="pin"]');
  var traceDanger = document.getElementById('rv-trace-danger');
  var traceLocal = document.getElementById('rv-trace-local');

  if (actePlan && traceDanger && traceLocal && typeof traceDanger.getTotalLength === 'function') {
    // Longueurs réelles des chemins (user units). Le dasharray « f + reste »
    // fait pousser le trait depuis son départ, sans offset fragile.
    var LONG_DANGER = traceDanger.getTotalLength();
    var LONG_LOCAL = traceLocal.getTotalLength();
    var DANGER_FIN = 0.34;    // le rouge a fini de sortir du quartier
    var DANGER_FANTOME = 0.5; // à p = 0,5 il a disparu (le local démarre)
    var LOCAL_DEBUT = 0.5;    // le tour du pâté de maisons

    function peindre(p) {
      var ph = clamp01(p / DANGER_FIN);
      var fd = LONG_DANGER * ph;
      traceDanger.style.strokeDasharray = fd.toFixed(2) + ' ' + LONG_DANGER.toFixed(2);
      var opacite = p <= DANGER_FIN ? 1 : Math.max(0, 1 - (p - DANGER_FIN) / (DANGER_FANTOME - DANGER_FIN));
      traceDanger.style.opacity = opacite.toFixed(3);

      var pl = clamp01((p - LOCAL_DEBUT) / (1 - LOCAL_DEBUT));
      var fl = LONG_LOCAL * pl;
      traceLocal.style.strokeDasharray = fl.toFixed(2) + ' ' + LONG_LOCAL.toFixed(2);
    }

    function etatFinal() {
      traceDanger.style.strokeDasharray = LONG_DANGER.toFixed(2) + ' 0';
      traceDanger.style.opacity = '1';
      traceLocal.style.strokeDasharray = LONG_LOCAL.toFixed(2) + ' 0';
    }

    if (reduceMotion) {
      etatFinal();
    } else {
      // Boucle légère : elle lit la variable publiée par l'engine et ne fait
      // rien d'autre. Pas d'écouteur scroll, pas d'IntersectionObserver.
      // Perf 04/09 : la boucle ne tourne QUE quand le plan est visible
      // (avant, elle peignait du style SVG 60×/s sur tout le parcours,
      // même quand la section pin était hors écran → CPU + repaints inutiles).
      var animationId = null;
      var planVisible = false;
      function cadre() {
        if (!planVisible) return;
        animationId = requestAnimationFrame(cadre);
        var brut = parseFloat(actePlan.style.getPropertyValue('--sc-p'));
        if (!isNaN(brut)) peindre(brut);
      }
      function demarrer() { if (!planVisible) { planVisible = true; animationId = requestAnimationFrame(cadre); } }
      function arreter() { planVisible = false; if (animationId) { cancelAnimationFrame(animationId); animationId = null; } }
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entrees) {
          entrees.forEach(function (e) {
            if (e.isIntersecting) demarrer(); else arreter();
          });
        }, { rootMargin: '200px 0px' });
        io.observe(actePlan);
      } else {
        demarrer();
      }
      // Test : permet à la vérification de forcer un rendu hors rAF.
      window.__rvlTrace = function (p) { peindre(p); return true; };
      window.__rvlTraceReset = function () { arreter(); demarrer(); return true; };
    }
  }

  /* ---------- 2. Folio éditorial ---------- */
  var folio = document.getElementById('rv-folio');
  var folioNum = document.getElementById('rv-folio-num');
  var folioNom = document.getElementById('rv-folio-nom');
  var chapitres = Array.prototype.slice.call(document.querySelectorAll('[data-folio]'))
    .map(function (el) {
      return { el: el, num: el.getAttribute('data-folio'), nom: el.getAttribute('data-rue') };
    });

  if (folio && folioNum && folioNom && chapitres.length) {
    var enCours = null;
    var demande = false;

    var pied = document.querySelector('.rv-pied, footer');

    function maj() {
      demande = false;
      // P1 audit : le folio ne doit pas chevaucher le contenu légal
      if (pied) {
        var rPied = pied.getBoundingClientRect();
        if (rPied.top < window.innerHeight * 0.88) {
          folio.style.opacity = '0';
          enCours = null;
          return;
        }
      }
      var y = window.scrollY + window.innerHeight * 0.45;
      var courant = null;
      for (var i = 0; i < chapitres.length; i++) {
        if (chapitres[i].el.offsetTop <= y) courant = chapitres[i];
        else break;
      }
      if (courant && courant !== enCours) {
        enCours = courant;
        folioNum.textContent = 'Rue ' + courant.num;
        folioNom.textContent = courant.nom;
        folio.style.opacity = '1';
      } else if (!courant && enCours) {
        enCours = null;
        folio.style.opacity = '0';
      }
    }

    function surScroll() {
      if (!demande) { demande = true; requestAnimationFrame(maj); }
    }
    window.addEventListener('scroll', surScroll, { passive: true });
    window.addEventListener('resize', surScroll, { passive: true });
    maj();
  }

  /* ---------- 3. Boutons de prix → bulletin ---------- */
  var select = document.getElementById('f-offre');
  var boutonsOffre = document.querySelectorAll('.rv-btn-offre');
  if (select && boutonsOffre.length) {
    Array.prototype.forEach.call(boutonsOffre, function (btn) {
      btn.addEventListener('click', function (e) {
        var valeur = btn.getAttribute('data-offre');
        if (!valeur) return;
        select.value = valeur;
        var cible = document.getElementById('commander');
        if (!cible) return;
        e.preventDefault();
        if (reduceMotion) { cible.scrollIntoView({ block: 'start' }); }
        else { cible.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
      });
    });
  }
})();
