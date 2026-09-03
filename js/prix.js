/* Prix Rendez-Vous Local — source unique des montants (cohérence landing).
   Prix de lancement honnêtes : remontée après les 100 premières commandes,
   aucune fausse urgence. */
(function (root) {
  'use strict';

  var PRIX = {
    produit: 'Rendez-Vous Local',
    offres: [
      { id: 'solo', nom: 'Licence Solo', montant: 39, barre: 49, devise: '€' },
      { id: 'pro', nom: 'Licence Pro + vocal', montant: 79, barre: 99, devise: '€' },
      { id: 'cle', nom: 'Clé en main Agentia', montant: 490, barre: 590, devise: '€' }
    ],
    lancement: '100 premières commandes'
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PRIX;
  }
  root.PRIX = PRIX;
})(typeof window !== 'undefined' ? window : globalThis);
