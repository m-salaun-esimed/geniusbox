import { describe, expect, it } from "vitest";
import {
  DEFAULT_ANSWER_BY_TYPE,
  EMPTY_PROPOSITIONS,
  MAX_CHOICES,
  MIN_CHOICES,
  STEPS,
} from "../src/app/constants";
import { COLOR_PALETTE_IDS, QuestionType } from "../src/game-engine/types";

const ALL_TYPES: QuestionType[] = [
  "true_false",
  "ranking",
  "choice",
  "free_text",
  "free_number",
  "free_color",
];

describe("DEFAULT_ANSWER_BY_TYPE", () => {
  it("has an entry for every QuestionType", () => {
    ALL_TYPES.forEach((type) => {
      expect(DEFAULT_ANSWER_BY_TYPE[type]).toBeDefined();
    });
  });

  it("true_false default is 'true'", () => {
    expect(DEFAULT_ANSWER_BY_TYPE["true_false"]).toBe("true");
  });

  it("ranking default is a numeric string", () => {
    expect(Number.isFinite(Number(DEFAULT_ANSWER_BY_TYPE["ranking"]))).toBe(true);
  });

  it("free_color default is a valid palette id", () => {
    expect(COLOR_PALETTE_IDS).toContain(DEFAULT_ANSWER_BY_TYPE["free_color"]);
  });

  it("free_number default is a numeric string", () => {
    expect(Number.isFinite(Number(DEFAULT_ANSWER_BY_TYPE["free_number"]))).toBe(true);
  });
});

describe("EMPTY_PROPOSITIONS", () => {
  it("returns exactly 10 propositions for each type", () => {
    ALL_TYPES.forEach((type) => {
      const propositions = EMPTY_PROPOSITIONS(type);
      expect(propositions).toHaveLength(10);
    });
  });

  it("each proposition has the default answer for the type", () => {
    ALL_TYPES.forEach((type) => {
      const propositions = EMPTY_PROPOSITIONS(type);
      propositions.forEach((proposition) => {
        expect(proposition.correctAnswer).toBe(DEFAULT_ANSWER_BY_TYPE[type]);
      });
    });
  });

  it("each proposition has an empty text", () => {
    ALL_TYPES.forEach((type) => {
      const propositions = EMPTY_PROPOSITIONS(type);
      propositions.forEach((proposition) => {
        expect(proposition.text).toBe("");
      });
    });
  });

  it("returns independent arrays (no shared reference)", () => {
    const a = EMPTY_PROPOSITIONS("true_false");
    const b = EMPTY_PROPOSITIONS("true_false");
    expect(a).not.toBe(b);
  });
});

describe("MIN_CHOICES / MAX_CHOICES", () => {
  it("MIN_CHOICES is 2", () => {
    expect(MIN_CHOICES).toBe(2);
  });

  it("MAX_CHOICES is greater than MIN_CHOICES", () => {
    expect(MAX_CHOICES).toBeGreaterThan(MIN_CHOICES);
  });
});

describe("STEPS", () => {
  it("has at least 2 steps", () => {
    expect(STEPS.length).toBeGreaterThanOrEqual(2);
  });

  it("steps are non-empty strings", () => {
    STEPS.forEach((step) => {
      expect(typeof step).toBe("string");
      expect(step.length).toBeGreaterThan(0);
    });
  });
});
