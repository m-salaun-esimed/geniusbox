# Install Guide

## Pour les joueurs (installation simple)

1. Téléchargez l'installeur pour votre OS :
   - macOS : `.dmg`
   - Windows : `.exe`
   - Linux : `.AppImage`
2. Ouvrez l'installeur et suivez les étapes.
3. Lancez **Smart10 Local** depuis votre menu d'applications.

## Pour les développeurs

### Prérequis

- **Node.js 20+** et npm

### Installation

```bash
git clone <url-du-repo>
cd geniusbox
npm install
```

### Développement

```bash
npm run dev          # Lance Vite + Electron en parallèle
```

L'application s'ouvre automatiquement dans une fenêtre Electron.
Le renderer Vite est disponible sur `http://localhost:5173` pour le debug navigateur.

### Build

```bash
npm run build        # Compile le renderer (dist/) et le process Electron (dist-electron/)
npm run dist         # Génère l'installeur multi-plateforme via electron-builder
```

### Tests unitaires

```bash
npm test             # Vitest — exécution unique
npm run test:watch   # Vitest — mode watch (relance à chaque modification)
```

Les tests se trouvent dans `desktop/tests/`.

### Lint / vérification de types

```bash
npm run lint         # tsc --noEmit (vérifie les types sans émettre de fichiers)
```

## Dépannage

- **macOS** : si l'installation est bloquée, autorisez l'application depuis *Réglages → Confidentialité et sécurité*.
- **Données corrompues** : si les cartes ne se chargent plus, videz le `localStorage` de l'application (DevTools → Application → Storage → Clear) puis relancez.
- **Port 5173 occupé** : arrêtez le processus qui utilise ce port avant de lancer `npm run dev`.
