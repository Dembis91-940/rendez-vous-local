/* Rendez-Vous Local — rvl-core.js
 * Moteur 100 % local : créneaux, indisponibilités, réservations, vue pro.
 * Fonctions PURES (pas de DOM, pas de localStorage) → testables en Node.
 * Les données vivent chez le praticien (localStorage / export JSON), jamais sur un serveur.
 */
'use strict';

var RVL = { version: '1.0.0' };

/* ---------- Utilitaires date (heure locale, fuseau du praticien) ---------- */

RVL.pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

RVL.dateKey = function (d) {
  return d.getFullYear() + '-' + RVL.pad2(d.getMonth() + 1) + '-' + RVL.pad2(d.getDate());
};

RVL.timeKey = function (d) {
  return RVL.pad2(d.getHours()) + ':' + RVL.pad2(d.getMinutes());
};

RVL.parseDate = function (key) { // 'YYYY-MM-DD' -> Date locale
  var p = key.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
};

/* Jour de semaine 1=lundi … 7=dimanche */
RVL.weekday = function (dateKey) {
  var d = RVL.parseDate(dateKey).getDay();
  return d === 0 ? 7 : d;
};

RVL.minutesOf = function (hhmm) {
  var p = String(hhmm).split(':');
  return (+p[0]) * 60 + (+p[1]);
};

RVL.hhmm = function (min) {
  return RVL.pad2(Math.floor(min / 60)) + ':' + RVL.pad2(min % 60);
};

/* ---------- Configuration par défaut (praticien) ---------- */

RVL.configParDefaut = function () {
  return {
    nom: 'Votre activité',
    profession: 'Indépendant',
    ville: 'France',
    emailContact: '',
    dureeMin: 30,                 // durée par défaut d'un créneau
    services: [
      { id: 'consult', nom: 'Consultation', dureeMin: 30, prix: '' },
      { id: 'seance', nom: 'Séance complète', dureeMin: 45, prix: '' }
    ],
    horaires: {                  // 1=lundi … 7=dimanche, liste de plages
      1: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '18:00' }],
      2: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '18:00' }],
      3: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '18:00' }],
      4: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '18:00' }],
      5: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '18:00' }],
      6: [],
      7: []
    },
    indispos: [],                // [{ date:'YYYY-MM-DD', label:'Congé' }]
    avanceJours: 60              // horizon de réservation
  };
};

/* ---------- Créneaux ---------- */

RVL.estIndispo = function (config, dateKey) {
  return (config.indispos || []).some(function (i) { return i.date === dateKey; });
};

RVL.estFerme = function (config, dateKey) {
  var wd = RVL.weekday(dateKey);
  var plages = (config.horaires || {})[wd] || [];
  return plages.length === 0;
};

/* Créneaux candidats (découpés selon la durée demandée), sans vérifier les prises */
RVL.creneauxBruts = function (config, dateKey, dureeMin) {
  var wd = RVL.weekday(dateKey);
  var plages = (config.horaires || {})[wd] || [];
  var d = dureeMin || config.dureeMin || 30;
  var out = [];
  plages.forEach(function (pl) {
    var t = RVL.minutesOf(pl.from);
    var fin = RVL.minutesOf(pl.to);
    while (t + d <= fin) {
      out.push(RVL.hhmm(t));
      t += d;
    }
  });
  return out;
};

/* Créneau déjà pris ? (chevauchement) */
RVL.estPris = function (bookings, dateKey, debutMin, dureeMin) {
  return (bookings || []).some(function (b) {
    if (b.date !== dateKey || b.statut === 'annule') return false;
    var bStart = RVL.minutesOf(b.time);
    var bEnd = bStart + (b.dureeMin || 30);
    var aEnd = debutMin + dureeMin;
    return debutMin < bEnd && bStart < aEnd; // chevauchement
  });
};

/* Créneaux libres pour une date donnée + durée */
RVL.creneauxLibres = function (config, bookings, dateKey, dureeMin) {
  if (RVL.estIndispo(config, dateKey) || RVL.estFerme(config, dateKey)) return [];
  var d = dureeMin || config.dureeMin || 30;
  var todayKey = RVL.dateKey(new Date());
  var nowMin = 0;
  if (dateKey === todayKey) {
    var now = new Date();
    nowMin = now.getHours() * 60 + now.getMinutes();
  }
  return RVL.creneauxBruts(config, dateKey, d).filter(function (hhmm) {
    var m = RVL.minutesOf(hhmm);
    if (dateKey === todayKey && m < nowMin) return false; // créneau passé
    return !RVL.estPris(bookings, dateKey, m, d);
  });
};

/* Prochains jours ouverts (pour la page publique) */
RVL.prochainsJours = function (config, bookings, nbJours, dureeMin) {
  var out = [];
  var today = new Date();
  var d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var garde = nbJours || 14;
  var max = (config.avanceJours || 60);
  for (var i = 0; i <= max && out.length < garde; i++) {
    var key = RVL.dateKey(d);
    if (RVL.creneauxLibres(config, bookings, key, dureeMin).length > 0) out.push(key);
    d.setDate(d.getDate() + 1);
  }
  return out;
};

/* ---------- Réservations ---------- */

RVL.codeCourt = function () {
  var alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var c = '';
  for (var i = 0; i < 5; i++) c += alpha.charAt(Math.floor(Math.random() * alpha.length));
  return c;
};

/* Tente de créer une réservation. Retour { ok:true, booking } ou { ok:false, raison } */
RVL.reserver = function (config, bookings, demande) {
  var dateKey = demande.date;
  var dureeMin = demande.dureeMin || config.dureeMin || 30;
  var debutMin = RVL.minutesOf(demande.time);

  if (RVL.estIndispo(config, dateKey)) return { ok: false, raison: 'indispo', message: 'Ce jour est indisponible (fermeture exceptionnelle).' };
  if (RVL.estFerme(config, dateKey)) return { ok: false, raison: 'ferme', message: 'Ce jour est fermé.' };

  var todayKey = RVL.dateKey(new Date());
  if (dateKey < todayKey) return { ok: false, raison: 'passe', message: 'Cette date est passée.' };
  if (dateKey === todayKey && debutMin <= new Date().getHours() * 60 + new Date().getMinutes()) {
    return { ok: false, raison: 'passe', message: 'Ce créneau est déjà passé.' };
  }

  if (RVL.creneauxBruts(config, dateKey, dureeMin).indexOf(demande.time) === -1) {
    return { ok: false, raison: 'hors-creneau', message: 'Ce créneau ne correspond pas à vos disponibilités.' };
  }
  if (RVL.estPris(bookings, dateKey, debutMin, dureeMin)) {
    return { ok: false, raison: 'pris', message: 'Ce créneau vient d\u2019être pris. Choisissez-en un autre.' };
  }

  var booking = {
    id: RVL.codeCourt() + Date.now().toString(36),
    code: RVL.codeCourt(),
    date: dateKey,
    time: demande.time,
    dureeMin: dureeMin,
    serviceId: demande.serviceId || (config.services && config.services[0] ? config.services[0].id : ''),
    nom: (demande.nom || '').trim(),
    email: (demande.email || '').trim(),
    tel: (demande.tel || '').trim(),
    note: (demande.note || '').trim(),
    source: demande.source || 'web',
    statut: 'confirme',
    creeLe: new Date().toISOString()
  };
  return { ok: true, booking: booking };
};

/* Vue pro : RDV d'une journée, triés par heure */
RVL.rdvDuJour = function (bookings, dateKey) {
  return (bookings || []).filter(function (b) {
    return b.date === dateKey && b.statut !== 'annule';
  }).sort(function (a, b) { return RVL.minutesOf(a.time) - RVL.minutesOf(b.time); });
};

RVL.annuler = function (bookings, id) {
  return (bookings || []).map(function (b) {
    if (b.id === id) { var c = JSON.parse(JSON.stringify(b)); c.statut = 'annule'; return c; }
    return b;
  });
};

/* ---------- Export / import JSON (sauvegarde locale, pas de cloud) ---------- */

RVL.exportJSON = function (config, bookings) {
  return JSON.stringify({ app: 'rendez-vous-local', version: RVL.version, exportLe: new Date().toISOString(), config: config, bookings: bookings }, null, 2);
};

RVL.importJSON = function (texte) {
  var d;
  try { d = JSON.parse(texte); } catch (e) { return { ok: false, message: 'Fichier illisible (JSON invalide).' }; }
  if (!d || d.app !== 'rendez-vous-local') return { ok: false, message: 'Ce fichier n\u2019est pas une sauvegarde Rendez-Vous Local.' };
  return { ok: true, config: d.config, bookings: d.bookings || [] };
};

/* ---------- Journal vocal (prototype vendable) ---------- */
/* Le moteur vocal ANNONCE la réservation et la journalise localement.
   La synchro automatique planning-vocal est documentée comme évolution. */

RVL.journalVocal = function (store, texte) {
  var liste = RVL.lireJournalVocal(store);
  liste.unshift({ ts: new Date().toISOString(), texte: String(texte).slice(0, 600) });
  store.setItem('rvl_vocal_log', JSON.stringify(liste.slice(0, 100)));
};

RVL.lireJournalVocal = function (store) {
  try { return JSON.parse(store.getItem('rvl_vocal_log') || '[]'); } catch (e) { return []; }
};

/* Pour tests Node et usage navigateur : adaptateur de stockage minimal */
RVL.memoire = function () {
  var m = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
    setItem: function (k, v) { m[k] = String(v); },
    removeItem: function (k) { delete m[k]; }
  };
};

if (typeof module !== 'undefined' && module.exports) module.exports = RVL;
