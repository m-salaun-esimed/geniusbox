import { afterEach } from "vitest";

// jsdom provides localStorage; clear it between tests so persisted state
// (smart10.cards, smart10.paths) does not bleed across cases.
afterEach(() => {
  localStorage.clear();
});
