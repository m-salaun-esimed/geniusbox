# Smart 10 - Documentation Projet Complète

## Vision du projet

Smart 10 est une application desktop de quiz et de jeu de parcours, inspirée du format « 10 propositions ».
Le projet a été conçu dans un cadre pédagogique pour apprendre à travailler en Agile, avec des itérations courtes, un backlog priorisé et des livraisons fréquentes.

L'objectif est double :
- proposer une expérience de jeu multi-joueurs claire et engageante ;
- structurer le développement autour des besoins métier exprimés par le Product Owner.

## Équipe et rôles Agile

### Composition de l'équipe

| Rôle | Nom | Responsabilités |
|------|------|------------------|
| Product Owner | Mathéo | Définition des besoins, priorisation du backlog, validation des itérations |
| Scrum Master | Jérémy | Animation des cérémonies, suppression des obstacles, respect du processus Agile |
| Développeur & Gestion des Sprints | Nathan | Architecture, implémentation, coordination des sprints |
| Développeur | Axel | Implémentation des fonctionnalités, tests |
| Développeur & UX/UI | Matthieu | Implémentation, design d'interface, ergonomie |

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

### Gestion des parcours

- Composer un parcours de partie en sélectionnant les cartes.
- Réordonner les cartes du parcours avant lancement.
- Retirer des cartes du parcours.
- Créer, modifier et supprimer des parcours sauvegardés.
- Sauvegarder localement le catalogue de cartes.

### Conception des cartes

- Six types de questions :
  - Vrai / Faux (`true_false`)
  - Classement de 1 à 10 (`ranking`)
  - Question fermée à 2 ou 3 réponses (`choice`)
  - Réponse libre texte (`free_text`)
  - Réponse libre numérique (`free_number`)
  - Réponse libre couleur (`free_color`)
- Contrainte métier : 10 propositions obligatoires par carte.
- Paramétrage par carte :
  - titre (unique, insensible à la casse) ;
  - type de question ;
  - pour les cartes `choice` : la liste des choix (2 ou 3) ;
  - réponse attendue pour chaque proposition.

### Import / export et parcours

- Export des cartes sélectionnées en JSON depuis l'étape Cartes.
- Import d'un JSON valide pour ajouter des cartes au catalogue existant.
- Construction du parcours depuis l'étape Parcours : ajout, retrait et réordonnancement des cartes.
- Les parcours peuvent être sauvegardés et réutilisés localement.
- Les parcours ne sont pas importés/exportés en JSON (seules les cartes le sont).

### Déroulement d'une partie

- Démarrer une partie avec un à dix joueurs.
- Choisir un mode de jeu : **Flash** (une seule carte) ou **Parcours** (plusieurs cartes enchaînées avec objectif de points).
- Définir un score cible (mode Parcours) ou jouer sans limite (mode Flash).
- Régler un timer d'ambiance (15 s, 30 s ou 45 s) pour le rythme de jeu.
- Répondre proposition par proposition.
- Verrouiller les propositions déjà traitées.
- Afficher un retour visuel immédiat (bonne/mauvaise réponse).
- Capitaliser les points ou continuer la carte.
- Suivre les scores en direct.
- Afficher un écran d'outro de fin de partie puis le classement final (égalité possible).

## Flux utilisateur

1. Accueil : création ou sélection d'un parcours.
2. Édition : ajout des cartes et des 10 propositions.
3. Configuration : sélection du parcours, des joueurs et des règles.
4. Jeu : réponses successives et mise à jour des scores.
5. Résultats : classement final et fin de partie.

## Choix technique : Electron + Capacitor

Le choix d'Electron répond à l'objectif de simplicité de déploiement desktop :

- application desktop native sur Windows, macOS et Linux ;
- aucune infrastructure serveur obligatoire ;
- persistance locale des données ;
- base technologique web moderne (React + TypeScript).

Capacitor est utilisé pour empaqueter le même renderer React sous forme d'application Android (WebView), avec un code métier mutualisé entre desktop et mobile.

## Stack technique

- React 19
- TypeScript
- Zustand (état global)
- Vite (bundler renderer)
- Electron (shell desktop)
- Capacitor (shell Android)
- Vitest + jsdom (tests unitaires)

## Organisation du code

- `desktop/src/main.tsx` — point d'entrée React.
- `desktop/src/app/App.tsx` — orchestration des écrans (setup → partie).
- `desktop/src/app/store.ts` — état global Zustand et logique de partie.
- `desktop/src/app/setup/` — étapes de configuration (joueurs, mode, éditeur de cartes, sélection du parcours).
- `desktop/src/app/game/` — vues de partie (`InRoundView`, `RoundSummaryView`, `MatchOutroView`, `FinishedView`).
- `desktop/src/app/components/` — composants UI partagés (sélecteurs, modales, crédits).
- `desktop/src/game-engine/types.ts` — types partagés (`QuestionCard`, `QuestionType`, palette de couleurs).
- `desktop/src/game-engine/engine.ts` — moteur historique Vrai/Faux (utilisé par les tests).
- `desktop/src/storage/questionPacks.ts` — chargement, validation, persistence et import/export.
- `desktop/electron/main.ts` — processus principal Electron.
- `desktop/electron/preload.ts` — couche de communication sécurisée.
- `desktop/tests/` — tests Vitest (`engine.test.ts`, `questionPacks.test.ts`, `questionTypeColors.test.ts`, `constants.test.ts`).
- `android/` — projet natif Android généré par Capacitor.

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
