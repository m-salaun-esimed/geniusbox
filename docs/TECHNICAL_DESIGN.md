# GeniusBox — Conception Technique

## 1. Objectif et périmètre

Ce document décrit la conception technique de GeniusBox dans son état actuel (sprint 5).

Périmètre couvert :

- architecture desktop Electron + renderer React ;
- extension mobile Android via Capacitor ;
- organisation des modules et composants ;
- modèle de données du jeu ;
- gestion d'état et logique métier ;
- persistance locale des cartes et des parcours ;
- pipeline build / test ;
- dette technique et recommandations.

## 2. Architecture globale

Smart 10 suit une architecture à 3 couches côté client desktop :

1. **Processus principal Electron** (main process)
2. **Couche bridge sécurisée** (preload)
3. **Application React** (renderer)

Le même renderer React est également réutilisé pour Android via Capacitor :

- Vite produit les assets web dans `dist/`
- Capacitor embarque ces assets dans la WebView Android (`android/`)
- la logique métier reste centralisée dans le store Zustand (code partagé desktop/mobile)

### 2.1 Main process Electron

Fichier : `desktop/electron/main.ts`

Responsabilités :

- création de la fenêtre (`BrowserWindow`) ;
- chargement de l'URL de dev (`VITE_DEV_SERVER_URL`) en développement ;
- chargement du fichier statique `dist/index.html` en production ;
- cycle de vie applicatif standard (macOS activation, quit hors macOS).

Contraintes de sécurité :

- `contextIsolation: true`
- `nodeIntegration: false`
- preload dédié.

### 2.2 Preload

Fichier : `desktop/electron/preload.ts`

Exposition minimale d'un objet global `window.smart10` avec la version applicative.
Le preload reste volontairement faible pour limiter la surface d'attaque.

### 2.3 Renderer React

Point d'entrée : `desktop/src/main.tsx`

Cœur applicatif :

- `desktop/src/app/App.tsx` — orchestrateur des flux setup et partie ;
- `desktop/src/app/store.ts` — état global et transitions métier (Zustand).

## 3. Organisation des modules

```
desktop/src/
├── app/
│   ├── App.tsx                        # Orchestrateur principal
│   ├── store.ts                       # Store Zustand (état + actions)
│   ├── constants.ts                   # Constantes UI (types par défaut, étapes)
│   ├── questionTypeColors.ts          # Labels, descriptions et couleurs par type
│   ├── soundEffects.ts                # Effets sonores
│   ├── confirmModal.tsx               # Modale de confirmation générique
│   ├── components/
│   │   ├── ColorSelect.tsx            # Sélecteur de couleur (palette)
│   │   ├── QuestionTypeSelect.tsx     # Dropdown de sélection de type de carte
│   │   ├── StepHeader.tsx             # En-tête d'étape de configuration
│   │   ├── TypeLegendModal.tsx        # Modale légende des types de questions
│   │   ├── EndMatchConfirmModal.tsx   # Modale confirmation fin de partie
│   │   └── CreditsModal.tsx           # Modale crédits équipe + technologies (bouton i fixe)
│   ├── setup/
│   │   ├── PlayersSection.tsx         # Étape 1 — Joueurs
│   │   ├── FlashCardSection.tsx       # Sélection carte en mode Flash
│   │   ├── GameModeSection.tsx        # Sélection du mode (Flash / Parcours)
│   │   ├── MatchOrderSection.tsx      # Étape 4 — Sélection et ordre du parcours
│   │   └── QuestionEditor/
│   │       ├── index.tsx              # Étape 2 — Éditeur de cartes
│   │       ├── CardsGrid.tsx          # Grille des cartes existantes
│   │       ├── CardEditorModal.tsx    # Modale création / édition d'une carte
│   │       ├── ExportPanel.tsx        # Panel d'export JSON
│   │       ├── ImportPanel.tsx        # Panel d'import JSON
│   │       └── AiImportModal.tsx      # Modale d'import assistée par IA
│   ├── game/
│   │   ├── InRoundView.tsx            # Vue de jeu en cours de manche
│   │   ├── RoundSummaryView.tsx       # Vue résumé de fin de manche
│   │   ├── MatchOutroView.tsx         # Outro animé de fin de partie
│   │   └── FinishedView.tsx           # Vue classement final
│   └── utils/
│       └── downloadJsonFile.ts        # Helper de téléchargement JSON
├── game-engine/
│   ├── engine.ts                      # Moteur de jeu Vrai/Faux (utilisé en tests)
│   └── types.ts                       # Types partagés (QuestionCard, QuestionType, etc.)
├── storage/
│   └── questionPacks.ts               # Chargement, validation, persistence, import/export
└── data/
    └── questions/
        └── sample-pack.json           # Pack de cartes par défaut
```

## 4. Gestion d'état (Zustand)

Fichier : `desktop/src/app/store.ts`

Le store centralise :

- la configuration de partie (`setupPlayers`, `targetPointsToWin`, `gameMode`, sélection des cartes) ;
- les cartes et les parcours sauvegardés ;
- l'état dynamique d'une partie (`matchState`).

### 4.1 Phases de partie

```
setup → (startMatch) → in_round → (fin de carte) → round_summary
                                                   → (carte suivante) → in_round
                                                   → (fin de partie)  → match_complete → finished
```

- `match_complete` correspond à l'écran d'outro (`MatchOutroView`) joué juste avant le classement final.
- `finished` correspond au classement final (`FinishedView`), atteint via `proceedToFinalRanking`.

### 4.2 Joueur dans une partie

Chaque `MatchPlayer` possède :

- `totalScore` — points capitalisés ;
- `tempScore` — points en cours de tour, perdus en cas de mauvaise réponse ;
- `status` — `"active"` | `"stopped"` | `"eliminated"` (réinitialisé à chaque carte).

### 4.3 Modes de jeu

| Mode       | Comportement                                                      |
| ---------- | ----------------------------------------------------------------- |
| `flash`    | Une seule carte jouée ; `targetPointsToWin = MAX_SAFE_INTEGER`    |
| `parcours` | Toutes les cartes sélectionnées ; objectif de points configurable |

## 5. Modèle de données

Source : `desktop/src/game-engine/types.ts`

### 5.1 Types de questions

```typescript
type QuestionType =
  | 'true_false'
  | 'ranking'
  | 'choice'
  | 'free_text'
  | 'free_number'
  | 'free_color';
```

### 5.2 Carte

```typescript
interface QuestionCard {
  id: string;
  title: string;
  type: QuestionType;
  choices?: string[]; // uniquement pour "choice" (2 ou 3 éléments)
  propositions: QuestionProposition[]; // exactement 10
}

interface QuestionProposition {
  id: string;
  text: string;
  correctAnswer: string;
}
```

### 5.3 Palette de couleurs

Définie dans `types.ts` (constante `COLOR_PALETTE`) : 10 couleurs avec id, label et hex.
Utilisée par le type `free_color`.

### 5.4 Parcours sauvegardé

```typescript
interface SavedPath {
  id: string;
  name: string;
  category: string;
  cardIds: string[];
}
```

Persisté sous la clé `smart10.paths` dans `localStorage`.

## 6. Stockage local

| Clé localStorage | Contenu                     |
| ---------------- | --------------------------- |
| `smart10.cards`  | Tableau de `QuestionCard[]` |
| `smart10.paths`  | Tableau de `SavedPath[]`    |

Validation à la lecture : les entrées invalides sont filtrées silencieusement.
Fallback sur le pack d'exemple (`sample-pack.json`) si aucune carte valide n'est trouvée.

Migration legacy : un ancien format de questions plates (10 `TfQuestion`) est détecté et converti automatiquement en une `QuestionCard` de type `true_false`.

## 7. Règles métier implémentées

### 7.1 Contraintes de création / édition de carte

- Titre obligatoire (unique, insensible à la casse).
- Exactement 10 propositions, toutes renseignées.
- Pour `choice` : 2 ou 3 choix définis ; chaque réponse attendue doit être dans les choix.
- Pour `free_number` : chaque réponse attendue doit être un nombre valide.
- Pour `free_color` : chaque réponse attendue doit être un id de la palette.

### 7.2 Comparaison des réponses

| Type                              | Logique de comparaison                                 |
| --------------------------------- | ------------------------------------------------------ |
| `true_false`, `ranking`, `choice` | Égalité stricte de chaînes                             |
| `free_text`                       | Normalisation : suppression accents, minuscules, trim  |
| `free_number`                     | Parsing décimal (virgule acceptée) + égalité numérique |
| `free_color`                      | Normalisation identique à `free_text`                  |

Pour `free_text`, une validation manuelle est proposée si la normalisation ne suffit pas.

### 7.3 Fin de carte / fin de partie

- Fin de carte : toutes propositions révélées **ou** aucun joueur actif.
- Fin de partie : joueur atteint l'objectif de points **ou** parcours terminé.
- Les points temporaires des joueurs encore actifs en fin de carte sont capitalisés automatiquement.
- Gestion des égalités via `winnerIds` multiples.

## 8. Build, tests et qualité

### 8.1 Scripts principaux

| Commande                   | Rôle                                              |
| -------------------------- | ------------------------------------------------- |
| `npm run dev`              | Vite + Electron en parallèle                      |
| `npm run dev:android`      | Vite en mode host réseau pour debug WebView       |
| `npm run build`            | Build renderer + compilation TS Electron          |
| `npm run cap:sync`         | Build web + synchronisation Capacitor Android     |
| `npm run cap:open:android` | Ouvre le projet natif Android dans Android Studio |
| `npm run dist`             | Packaging electron-builder                        |
| `npm test`                 | Vitest (run once)                                 |
| `npm run test:watch`       | Vitest en mode watch                              |
| `npm run lint`             | `tsc --noEmit`                                    |

### 8.2 Tests unitaires

Répertoire : `desktop/tests/`

| Fichier                      | Couverture                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `engine.test.ts`             | Moteur historique Vrai/Faux (buildInitialGameState, startGame, submitAnswer, endRound, cas limites)     |
| `questionPacks.test.ts`      | parseNumericAnswer, createCard, validateCard, importCardsFromJson, exportCards, flattenCardsToQuestions |
| `questionTypeColors.test.ts` | Labels, couleurs et descriptions par type ; cohérence palette                                           |
| `constants.test.ts`          | DEFAULT_ANSWER_BY_TYPE, EMPTY_PROPOSITIONS                                                              |

Environnement jsdom (Vitest) — `localStorage` disponible nativement.

### 8.3 Outils

- Bundler renderer : Vite (`vite.config.ts`, root `desktop`)
- Compilation TS Electron : `tsconfig.electron.json`
- Packaging : `electron-builder`

## 9. Sécurité et robustesse

- Isolation du contexte renderer (`contextIsolation: true`).
- Absence d'API Node directe en UI.
- Validation des payloads importés (filtre silencieux des entrées invalides).
- Fallback en cas de JSON invalide ou corrompu.

Points de vigilance :

- Les données persistent en `localStorage` (non chiffré).
- Absence de versionnement explicite des schémas de données.

## 10. Composant crédits

### 10.1 Bouton fixe

Un bouton « i » (`credits-fab`) est rendu en `position: fixed; top: 1rem; left: 1rem; z-index: 100` directement dans `App.tsx`, avant chaque vue (`InRoundView`, `RoundSummaryView`, `FinishedView`, setup). Il est donc visible sur toutes les pages sans duplication de logique dans les vues enfants.

### 10.2 Modal crédits (`CreditsModal.tsx`)

Rendu via `createPortal` dans `document.body`. Contient :

- en-tête : logo GB, titre GeniusBox, sous-titre, mention initiative Thierry Secqueville / Esimed 2026 ;
- grille 3×2 de cartes membres (photo importée depuis `assets/credits/`, nom, citation) ;
- pills technologies ;
- bouton ✕ absolu en haut à droite.

Responsive mobile : `max-height: 92dvh`, scroll interne, et bottom-sheet (100vw, border-radius 0) sous 480 px via `@media`.

Les photos sont importées statiquement (imports Vite) — Vite les hash et copie dans `dist/assets/` au build.

## 11. Dette technique identifiée

1. Duplication de logique entre le moteur historique (`engine.ts`) et la logique de partie du store.
2. Couverture de tests insuffisante sur le flux réel multi-types (store Zustand).
3. Dépendance forte à la logique du store (peu de séparation service / métier).

## 12. Recommandations d'évolution

1. Isoler un moteur unique (pur, sans Zustand) utilisé à la fois par le store et les tests.
2. Ajouter des tests d'intégration du store (phases, scoring, élimination, fins de manche).
3. Introduire un schéma versionné pour l'import / export des cartes.
4. Ajouter une couche de persistance abstraite pour préparer une option de stockage fichier / DB.

## 13. Références

- Règles fonctionnelles : [docs/GAME_RULES.md](GAME_RULES.md)
- Création de cartes : [docs/QUESTION_AUTHORING.md](QUESTION_AUTHORING.md)
- Installation : [docs/INSTALL.md](INSTALL.md)
- Plan de tests : [docs/TEST_PLAN.md](TEST_PLAN.md)
- Vue projet complète : [docs/PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
