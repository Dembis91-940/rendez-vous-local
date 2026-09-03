/* Configuration EmailJS — clé publique (conçue pour être publique).
   Toute demande (lead, question, commande) notifie l'éditeur
   sur agentiadeploiement@gmail.com via le template existant. */
(function (root) {
  'use strict';

  var EMAILJS_CONFIG = {
    publicKey: '8Pui4ZEqxW2jRVF7h',
    serviceId: 'service_cy1ytdb',
    templateId: 'template_xpo58cv',
    site: 'Rendez-Vous Local' // valeur envoyée dans le champ {site}
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EMAILJS_CONFIG;
  }
  root.EMAILJS_CONFIG = EMAILJS_CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
