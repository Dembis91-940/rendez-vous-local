/* Rendez-Vous Local — voice-widget.js v1.1 (adapté du kit Poseidon v1.0)
 * Bouton 🎙️ : conversation vocale avec l'assistant de réservation Vapi.
 * Config attendue : window.VOICE_CONFIG = {
 *   publicKey, assistantId, accent, bundleUrl (chemin vers vapi-bundle.js)
 * }
 * Particularité Rendez-Vous Local : chaque tour de parole est journalisé
 * LOCALEMENT (rvl_vocal_log) et affiché à l'écran. La voix passe par Vapi
 * (tiers vocal), les données de RDV restent locales. Synchro automatique
 * voix-agenda = évolution documentée.
 */
(function () {
  'use strict';
  if (window.__rvlVoiceLoaded) return;
  window.__rvlVoiceLoaded = true;

  var cfg = window.VOICE_CONFIG || {};
  if (!cfg.assistantId || !cfg.publicKey) return;

  var ACCENT = cfg.accent || '#BF4A1F';
  var BUNDLE = cfg.bundleUrl || 'assets/vapi-bundle.js';

  function store() {
    try { var t = '__rvl_t'; localStorage.setItem(t, '1'); localStorage.removeItem(t); return localStorage; }
    catch (e) { return null; }
  }
  function journaliser(texte) {
    var s = store();
    if (!s) return;
    var liste = [];
    try { liste = JSON.parse(s.getItem('rvl_vocal_log') || '[]'); } catch (e) { liste = []; }
    liste.unshift({ ts: new Date().toISOString(), texte: String(texte).slice(0, 600) });
    try { s.setItem('rvl_vocal_log', JSON.stringify(liste.slice(0, 100))); } catch (e) {}
  }

  var btn = document.getElementById('btn-vocal');
  var stat = document.getElementById('vocal-stat');
  var transcriptBox = document.getElementById('vocal-transcript');
  var ico = document.getElementById('vocal-ico');
  if (!btn || !stat) return;

  var style = document.createElement('style');
  style.textContent = '@keyframes rvl-pulse{0%{box-shadow:0 0 0 0 rgba(191,74,31,.55)}70%{box-shadow:0 0 0 14px rgba(191,74,31,0)}100%{box-shadow:0 0 0 0 rgba(191,74,31,0)}}';
  document.head.appendChild(style);

  var vapi = null, busy = false;

  function afficherLigne(role, texte) {
    if (!texte) return;
    transcriptBox.style.display = 'block';
    var d = document.createElement('div');
    d.style.cssText = 'margin-top:6px;padding:7px 10px;border-radius:8px;font-size:12.5px;background:' + (role === 'client' ? 'rgba(240,179,94,.16)' : 'rgba(255,255,255,.07)');
    d.innerHTML = '<b style="opacity:.75">' + (role === 'client' ? 'Vous : ' : 'Assistant : ') + '</b>' + String(texte).slice(0, 400);
    transcriptBox.appendChild(d);
    journaliser((role === 'client' ? 'Client : ' : 'Assistant : ') + texte);
  }

  function setStatut(texte) {
    stat.textContent = texte || '';
  }

  function loadSDK(cb) {
    if (window.VapiSDK && window.VapiSDK.default) { cb(); return; }
    var el = document.createElement('script');
    el.src = BUNDLE;
    el.onload = function () {
      var tries = 0;
      var check = function () {
        if (window.VapiSDK && window.VapiSDK.default) cb();
        else if (tries < 12) { tries++; setTimeout(check, 250); }
        else setStatut('Erreur de chargement vocal (SDK).');
      };
      check();
    };
    el.onerror = function () { setStatut('Erreur de chargement vocal.'); };
    document.head.appendChild(el);
  }

  function stopCall() {
    try { if (vapi) vapi.stop(); } catch (e) {}
    setActive(false);
    busy = false;
    setStatut('Conversation terminée. Le récapitulatif de l\u2019assistant est affiché ci-dessus.');
  }

  function setActive(active) {
    btn.style.background = active ? '#B3372E' : ACCENT;
    btn.style.animation = active ? 'rvl-pulse 1.3s infinite' : 'none';
    ico.textContent = active ? '⏹' : '🎙️';
  }

  btn.addEventListener('click', function () {
    if (busy) { stopCall(); return; }
    busy = true;
    transcriptBox.style.display = 'block';
    transcriptBox.innerHTML = '<div style="font-size:12px;opacity:.7;margin-bottom:4px">Conversation en direct (journalisée localement)…</div>';
    setStatut('Connexion à l\u2019assistant…');
    loadSDK(function () {
      try {
        vapi = new window.VapiSDK.default(cfg.publicKey);
        vapi.on('call-start', function () { setActive(true); setStatut('🎙️ Je vous écoute… Parlez pour réserver.'); });
        vapi.on('call-end', function () { setActive(false); busy = false; setStatut('Conversation terminée.'); });
        vapi.on('speech-update', function (m) {
          if (m && m.status === 'speaking') setStatut('🔊 L\u2019assistant parle…');
          else if (m && m.status === 'listening') setStatut('🎙️ Je vous écoute…');
        });
        vapi.on('message', function (msg) {
          try {
            if (msg && msg.message) {
              var m = msg.message;
              var role = (m.role === 'user') ? 'client' : 'assistant';
              if (m.transcript) afficherLigne(role, m.transcript);
              else if (m.content && m.content[0] && m.content[0].text) afficherLigne(role, m.content[0].text);
            }
          } catch (e) {}
        });
        vapi.start(cfg.assistantId);
      } catch (e) {
        busy = false;
        setStatut('Impossible de démarrer la conversation. Autorisez le micro et réessayez.');
      }
    });
  });
})();
