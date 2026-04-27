# Smoke Test Plan

## Core gameplay smoke test
1. Launch app.
2. Configure 2 players and start game.
3. Answer one question correctly and verify score increments by 1.
4. Continue through rounds until game end.
5. Verify winner summary and replay/back to setup flow.

## Question authoring smoke test
1. Add a new True/False question.
2. Verify duplicate prompt is rejected.
3. Delete a question and verify it disappears.
4. Export pack JSON and re-import it.

## Installation smoke test
1. Build installer with `npm run dist`.
2. Install on clean machine profile.
3. Launch app and complete one short game.
