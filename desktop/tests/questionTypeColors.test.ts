import { describe, expect, it } from "vitest";
import {
  QUESTION_TYPE_COLOR,
  QUESTION_TYPE_DESCRIPTIONS,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_ORDER,
} from "../src/app/questionTypeColors";
import { COLOR_PALETTE, QuestionType } from "../src/game-engine/types";

const ALL_TYPES: QuestionType[] = [
  "true_false",
  "ranking",
  "choice",
  "free_text",
  "free_number",
  "free_color",
];

describe("QUESTION_TYPE_LABELS", () => {
  it("has an entry for every QuestionType", () => {
    ALL_TYPES.forEach((type) => {
      expect(QUESTION_TYPE_LABELS[type]).toBeTruthy();
    });
  });

  it("labels are non-empty strings", () => {
    ALL_TYPES.forEach((type) => {
      expect(typeof QUESTION_TYPE_LABELS[type]).toBe("string");
      expect(QUESTION_TYPE_LABELS[type].length).toBeGreaterThan(0);
    });
  });
});

describe("QUESTION_TYPE_DESCRIPTIONS", () => {
  it("has an entry for every QuestionType", () => {
    ALL_TYPES.forEach((type) => {
      expect(QUESTION_TYPE_DESCRIPTIONS[type]).toBeTruthy();
    });
  });

  it("descriptions are non-empty strings", () => {
    ALL_TYPES.forEach((type) => {
      expect(typeof QUESTION_TYPE_DESCRIPTIONS[type]).toBe("string");
      expect(QUESTION_TYPE_DESCRIPTIONS[type].length).toBeGreaterThan(0);
    });
  });
});

describe("QUESTION_TYPE_COLOR", () => {
  it("has an entry for every QuestionType", () => {
    ALL_TYPES.forEach((type) => {
      expect(QUESTION_TYPE_COLOR[type]).toBeDefined();
    });
  });

  it("each color entry references a valid COLOR_PALETTE entry", () => {
    const paletteIds = COLOR_PALETTE.map((entry) => entry.id);
    ALL_TYPES.forEach((type) => {
      const colorEntry = QUESTION_TYPE_COLOR[type];
      expect(paletteIds).toContain(colorEntry.id);
      expect(colorEntry.hex).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(colorEntry.label).toBeTruthy();
    });
  });

  it("all types have distinct colors", () => {
    const colorIds = ALL_TYPES.map((type) => QUESTION_TYPE_COLOR[type].id);
    const unique = new Set(colorIds);
    expect(unique.size).toBe(colorIds.length);
  });
});

describe("QUESTION_TYPE_ORDER", () => {
  it("contains all QuestionTypes exactly once", () => {
    expect(QUESTION_TYPE_ORDER).toHaveLength(ALL_TYPES.length);
    ALL_TYPES.forEach((type) => {
      expect(QUESTION_TYPE_ORDER).toContain(type);
    });
  });

  it("has no duplicates", () => {
    expect(new Set(QUESTION_TYPE_ORDER).size).toBe(QUESTION_TYPE_ORDER.length);
  });
});
