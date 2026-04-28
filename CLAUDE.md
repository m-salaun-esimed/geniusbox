# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Smart 10 is a local desktop quiz/parcours game (Electron + React + TypeScript + Zustand + Vite, tested with Vitest). Cards each contain exactly 10 propositions across four question types: `true_false`, `ranking`, `binary_choice`, `free_text`.

## Common commands

- `npm run dev` — start Vite dev server (port 5173) AND Electron concurrently. The Electron side waits on `tcp:5173` then launches with `VITE_DEV_SERVER_URL=http://localhost:5173`.
- `npm run dev:web` — Vite only (renderer in browser, no Electron shell).
- `npm run build` — type-check + Vite build of renderer (`dist/`), then compile Electron TS to `dist-electron/` and copy `preload.cjs`.
- `npm run dist` — full build then `electron-builder` packaging (mac dmg / win nsis / linux AppImage).
- `npm run lint` — `tsc --noEmit` (no ESLint configured; type-checking is the lint).
- `npm run test` — Vitest run.
- `npm run test:watch` — Vitest watch.
- Run a single test file: `npx vitest run tests/engine.test.ts` (Vitest config has `root: "desktop"`, so test paths are relative to `desktop/`).

Node 20+ required.

## Architecture

Three-layer Electron desktop:

1. **Main process** — `desktop/electron/main.ts`. Creates the `BrowserWindow` with `contextIsolation: true`, `nodeIntegration: false`. Loads `VITE_DEV_SERVER_URL` in dev, `dist/index.html` in prod.
2. **Preload** — `desktop/electron/preload.ts` (compiled to `preload.cjs` and copied into `dist-electron/`). Intentionally minimal: only exposes `window.smart10` with the app version. Keep this surface narrow.
3. **Renderer** — React app rooted at `desktop/src/main.tsx`.

Vite is configured with `root: "desktop"` and `outDir: "../dist"`. The renderer entry HTML is `desktop/index.html`.

### Renderer modules

- `desktop/src/app/App.tsx` — single large UI file driving the 3-step setup (players → cards → parcours) and in-game phases (`in_round`, `round_summary`, `finished`). Includes modals, sound effects, manual free-text validation flow.
- `desktop/src/app/store.ts` — Zustand store. **This is the actual game logic in production**, including scoring, turn rotation, phase transitions (`startMatch`, `riskAndContinueTurn`, `secureAndStopTurn`, `resolveRoundIfEnded`, etc.), card CRUD, parcours management, and timer state.
- `desktop/src/app/soundEffects.ts` — sound feedback.
- `desktop/src/game-engine/engine.ts` + `types.ts` — **historical** pure engine for `true_false` only (`GameState`, `TfQuestion`). Currently used by `desktop/tests/engine.test.ts`. **Do not assume engine.ts reflects current rules** — it diverges from the multi-type production logic in `store.ts`.
- `desktop/src/storage/questionPacks.ts` — localStorage persistence of cards under key `smart10.cards` (parcours under `smart10.paths`). Handles JSON import (additive, validation-filtered), export, fallback to `sample-pack.json`, and a legacy migration from a flat questions format. Card validation enforces: required title, exactly 10 propositions, non-empty text + correctAnswer per proposition, case-insensitive unique title.

### Game rules (where they live)

- Free-text answer comparison normalizes via accent-stripping + lowercase + trim. On mismatch, the UI offers manual accept / reject — implemented in the store, not in `engine.ts`.
- Correct answer awards +1 temporary point; player then chooses capitalize (secure) or continue (risk). Wrong answer drops temp points and eliminates the player for the current card.
- End of card: all propositions revealed OR no active players remain. End of match: a player reaches the target score OR parcours exhausted. Ties produce multiple `winnerIds`.

### Persistence

Cards and saved parcours live in `localStorage` only (no encryption, no schema versioning yet). Import is additive — it adds to the catalog rather than replacing it. Export is on cards (catalog), not on the active parcours.

## Known divergences / gotchas

- Production game logic is in `store.ts`, not in `game-engine/engine.ts`. When touching rules, update the store; only update `engine.ts` if you also update `engine.test.ts`.
- The string "GeniusBox" still appears in `App.tsx` though the product is "Smart 10".
- No automated coverage of the multi-type store flow yet (only the legacy true/false engine is tested).
- Card-creation duplicate-title path currently throws instead of returning a result message — be aware when adding callers.

## Documentation

Functional and technical docs live in `docs/` — notably `docs/TECHNICAL_DESIGN.md` (kept up to date with the architecture above), `docs/GAME_RULES.md`, `docs/QUESTION_AUTHORING.md`, `docs/PROJECT_OVERVIEW.md`.
