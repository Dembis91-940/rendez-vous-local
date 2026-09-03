# BRIEF — Rendez-Vous Local (35e business)

Fichier autoporté (mission autonome, pas d'interview possible).
Date : 2026-09-03. Agent : business-builder. Demandeur : Poseidon.

## Réponses aux 8 questions (autoportées, voix de la marque)

1. Vibe en 3-5 mots : « Le plan de quartier du rendez-vous. Papier, forêt, terracotta, tracé local. »
   Références : une affiche d'échoppe française, un plan de ville ancien, le carnet papier d'un artisan.
2. Parcours au scroll, section par section :
   a) Hero — la promesse : « Vos rendez-vous ne quittent pas votre ordinateur. »
   b) Tension — Calendly/Google : la réservation part chez un géant (nuage lointain).
   c) Tournant — la carte du quartier : le tracé LOCAL (signature) qui ne sort pas du périmètre.
   d) Substance — les fonctionnalités réelles (agenda, lien, refus de double résa, vue pro, rappels).
   e) Démo — l'outil en vrai (iframe mode démo sur les Pages, données d'exemple).
   f) Prix — 3 offres (39 € licence, 79 € + vocal, 490 € clé en main).
   g) FAQ, formulaire EmailJS, footer RGPD + disclaimers honnêtes.
3. Courbe d'énergie : hero posé → tension forte → tournant calme et précis (peak) → substance dense
   → démo interactive → prix clairs → clôture.
4. Sentiment par étape : reconnu (c'est mon quotidien de praticien) → inquiet (mes données chez Google ?)
   → soulagé (ça reste au quartier) → confiant (c'est réel) → convaincu (je l'essaie) → décidé (je prends).
   MOMENT À RETENIR : le tracé en pointillés qui fait le tour du quartier et rentre au cabinet, pendant
   que le nuage Google reste hors-cadre.
5. Une chose qu'aucun autre site ne fait : une carte de quartier dessinée où le scroll DESSINE le trajet
   de la demande de RDV, et ce trajet ne franchit jamais la limite du quartier. Signature : « le tracé
   qui reste chez soi ».
6. Distance du premium-minimal : premium-artisanal (papier texturé, sérigraphie, dessin vectoriel soigné,
   pas de glassmorphism, pas de 3D).
7. Un seul monde continu ou scènes distinctes : scènes distinctes mais même univers « carte/quartier »
   (comme des rues différentes du même plan).
8. Assets disponibles : aucun asset photo/vidéo. Tout est dessiné (SVG/CSS) ou réel (l'outil en iframe).
   Le bundle vocal Vapi existe (assets/vapi-bundle.js, 570 Ko).

## Identité (décision)

- Concept : « Le plan de quartier » — le RDV comme une course qui reste dans le quartier.
- Palette (aucune dominante identique dans le portefeuille) :
  - papier #F4ECDD (fond), papier-2 #EBE0C9 (surface)
  - encre #26311E (texte sur papier)
  - forêt #15352A (sections sombres), forêt-2 #1D4536 (surface sombre)
  - terracotta #BF4A1F (CTA), route #D97B2E (tracés/épingles), ambre #F0B35E (accents sur sombre)
- Typos : Archivo (display + corps, Google Fonts) sur la landing ; l'OUTIL = zéro CDN (system-ui + ui-monospace).
- Signature scroll : SVG carte de quartier + tracé en pointillés dessiné au scroll (stroke-dashoffset),
  qui boucle localement. Le nuage (Calendly) dessiné hors du quartier, barré.
- Pas de : 3D WebGL, glassmorphism, bento, chatbot de la landing (l'agent vocal vit dans l'outil),
  counters inventés, em-dash, « scroll to explore », section numbers.

## Produit (ce qui est VENDU, réel)

Dossier téléchargeable « rendez-vous-local-v1.zip » : agenda.html (vue pro locale) + rdv.html
(page publique de réservation) + rvl-core.js (moteur pur) + assets vocaux Vapi. Fonctionne en
localStorage local (fichier file:// ou hébergement au choix du praticien), export/import JSON.
Démo en ligne publiée (Pages) avec données d'exemple.
Vocal : assistant Vapi dédié « Rendez-Vous Local — Prise de RDV (démo) » id ce134492-7870-405c-b434-e6547902b01f.
Honnêteté : la voix passe par Vapi (tiers vocal), les données RDV restent locales. Synchro
planning-vocal complète = évolution documentée.

## Offres (3, avec prix)

1. Licence Solo — 39 € (barré 49 €, lancement) : outil complet 100 % local, 1 praticien, mises à jour 12 mois.
2. Licence Pro — 79 € : tout Solo + agent vocal branché (assistant personnalisé aux horaires/services
   du praticien, widget 🎙️, 100 min d'appel incluses puis usage Vapi réel ~0,15 €/min documenté).
3. Clé en main Agentia — 490 € (barré 590 €) : installation chez le client, page publique hébergée à son
   nom, agent vocal calibré, formation 1 h, support 30 jours.

## Preuves à produire

node --check (tous JS), tests unitaires Node du moteur (réservation créée, refus de double, vue pro
du jour, indisponibilités), test navigateur réel (réserver sur rdv.html → visible dans agenda.html →
créneau pris refusé), HTTP 200 sur Pages, orthographe française, contrastes WCAG ≥ 4.5:1 calculés.
