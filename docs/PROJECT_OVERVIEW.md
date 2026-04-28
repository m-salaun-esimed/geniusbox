# GeniusBox - Documentation Projet Complète

## Vision du projet

GeniusBox est une application desktop (et Android) de quiz et de jeu de parcours, inspirée du format « 10 propositions ».
Le projet est une **initiative ludo-pédagogique proposée par Thierry Secqueville — Esimed 2026**, conçue pour apprendre à travailler en Agile, avec des itérations courtes, un backlog priorisé et des livraisons fréquentes.

L'objectif est double :
- proposer une expérience de jeu multi-joueurs claire et engageante ;
- structurer le développement autour des besoins métier exprimés par le Product Owner.

## Équipe et rôles Agile

### Composition de l'équipe

| Rôle | Nom | Responsabilités |
|------|------|------------------|
| Product Owner | Mathéo Bert | Définition des besoins, priorisation du backlog, validation des itérations |
| Scrum Master | Jérémy Mercklen | Animation des cérémonies, suppression des obstacles, respect du processus Agile |
| Développeur & Gestion des Sprints | Nathan Sabaty | Architecture, implémentation, coordination des sprints |
| Développeur | Axel Lapierre | Implémentation des fonctionnalités, build Android (Capacitor) |
| Développeur & UX/UI | Matthieu Salaun | Implémentation, design d'interface, ergonomie |
| Développeur | Lucas Joly | Refactoring composants jeu, gestion des phases et styles |

### Cadence des sprints

- Durée : 30 minutes à 1 heure
- Démo : présentation des fonctionnalités au Product Owner et aux parties prenantes
- Fréquence : itérations rapides pour ajuster en continu
- Résultat attendu : livraison de user stories avec valeur visible

### Exemple de sprint

1. Planning (5 min) : sélection des user stories prioritaires
2. Développement (20-50 min) : implémentation et pair programming avec IA
3. Démo & rétrospective (5-10 min) : feedback PO et amélioration continue
4. Ajustements : intégration des retours dans le sprint suivant

## Contexte pédagogique

Le projet sert de support d'apprentissage pour les pratiques Agile :

- Product Owner : formalisation des besoins fonctionnels.
- Backlog : priorisation continue des fonctionnalités.
- Sprints : cycles courts de réalisation.
- Itérations : adaptation rapide selon les retours.
- IA : assistance au prototypage et à l'implémentation, avec validation humaine.

## Fonctionnalités de l'application

### Page crédits

- Bouton « i » fixe en haut à gauche, visible sur toutes les pages (setup, jeu, résumé, fin de partie).
- Ouvre une modale crédits avec : logo GeniusBox, mention de l'initiative Thierry Secqueville / Esimed 2026, 6 cartes membres d'équipe (photo, nom, citation), section technologies.
- Modale responsive : scrollable, bouton ✕, affichage bottom-sheet sur mobile.

### Gestion des parcours

- Composer un parcours de partie en sélectionnant les cartes.
- Réordonner les cartes du parcours avant lancement.
- Retirer des cartes du parcours.
- Créer, modifier et supprimer des parcours sauvegardés.
- Sauvegarder localement le catalogue de cartes.

### Conception des cartes

- Quatre types de questions :
  - Vrai / Faux
  - Classement
  - Choix multiple
  - Réponse libre
- Contrainte métier : 10 propositions obligatoires par carte.
- Paramétrage par carte :
  - titre ;
  - type de question ;
  - réponse attendue pour chaque proposition.

### Import / export et parcours

- Export des cartes sélectionnées en JSON depuis l'étape Cartes.
- Import d'un JSON valide pour ajouter des cartes au catalogue existant.
- Construction du parcours depuis l'étape Parcours : ajout, retrait et réordonnancement des cartes.
- Les parcours peuvent être sauvegardés et réutilisés localement.
- Les parcours ne sont pas importés/exportés en JSON (seules les cartes le sont).

### Déroulement d'une partie

- Démarrer une partie avec un ou plusieurs joueurs.
- Choisir le parcours avant le lancement.
- Définir un score cible ou jouer sans limite.
- Régler un timer d'ambiance (15s, 30s ou 45s) pour le rythme de jeu.
- Répondre proposition par proposition.
- Verrouiller les propositions déjà traitées.
- Afficher un retour visuel immédiat (bonne/mauvaise réponse).
- Capitaliser les points ou continuer la carte.
- Suivre les scores en direct.
- Afficher le classement final (égalité possible).

## Flux utilisateur

1. Accueil : création ou sélection d'un parcours.
2. Édition : ajout des cartes et des 10 propositions.
3. Configuration : sélection du parcours, des joueurs et des règles.
4. Jeu : réponses successives et mise à jour des scores.
5. Résultats : classement final et fin de partie.

## Choix technique : Electron + Android

L'application cible deux plateformes :

**Desktop (Electron)** :
- application native sur Windows, macOS et Linux ;
- aucune infrastructure serveur obligatoire ;
- persistance locale des données ;
- base technologique web moderne (React + TypeScript).

**Android (Capacitor)** :
- le même renderer React est embarqué dans une WebView Android via Capacitor ;
- le build web (`dist/`) est synchronisé dans le projet natif Android (`android/`) ;
- génération d'un APK depuis Android Studio.

## Stack technique

- React
- TypeScript
- Zustand
- Vite
- Electron
- Capacitor (Android)
- Vitest

## Organisation du code

- desktop/src/main.tsx : point d'entrée React.
- desktop/src/app/App.tsx : orchestration des écrans.
- desktop/src/app/store.ts : état global de la partie.
- desktop/src/game-engine/engine.ts : règles et logique de jeu.
- desktop/src/storage/questionPacks.ts : stockage des packs de questions.
- desktop/electron/main.ts : processus principal Electron.
- desktop/electron/preload.ts : couche de communication sécurisée.
- desktop/tests/engine.test.ts : tests de logique métier.

## Exécution du projet

Prérequis :
- Node.js 20+
- npm

Commandes utiles depuis la racine :

    npm install
    npm run dev
    npm run build
    npm run dist
    npm run test

## Références documentaires

Documentation fonctionnelle :
- docs/GAME_RULES.md
- docs/QUESTION_AUTHORING.md

Documents importants :
- docs/INSTALL.md
- docs/TEST_PLAN.md
- docs/TECHNICAL_DESIGN.md

## Approche de développement

Le développement est piloté par la valeur métier :

- édition rapide et guidée des parcours ;
- validation stricte de la règle des 10 propositions ;
- feedback visuel immédiat pour fluidifier le jeu ;
- support multi-joueurs avec suivi des scores ;
- persistance locale pour un usage pédagogique simple.

L'assistance IA a servi d'accélérateur de livraison, avec relecture et validation humaine à chaque itération.
