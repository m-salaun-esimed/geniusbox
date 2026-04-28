import { beforeEach, describe, expect, it } from "vitest";
import {
  createCard,
  createDefaultCards,
  exportCards,
  flattenCardsToQuestions,
  importCardsFromJson,
  loadCards,
  parseNumericAnswer,
  saveCards,
} from "../src/storage/questionPacks";
import { QuestionCard } from "../src/game-engine/types";

// ─── helpers ────────────────────────────────────────────────────────────────

const makeTrueFalseCard = (overrides: Partial<QuestionCard> = {}): QuestionCard => ({
  id: "card_1",
  title: "Test TF",
  type: "true_false",
  propositions: Array.from({ length: 10 }, (_, i) => ({
    id: `prop_${i}`,
    text: `Proposition ${i + 1}`,
    correctAnswer: "true",
  })),
  ...overrides,
});

const makeChoiceCard = (): QuestionCard => ({
  id: "card_choice",
  title: "Test Choice",
  type: "choice",
  choices: ["homme", "femme"],
  propositions: Array.from({ length: 10 }, (_, i) => ({
    id: `prop_${i}`,
    text: `Q${i + 1}`,
    correctAnswer: "homme",
  })),
});

const makeFreeNumberCard = (): QuestionCard => ({
  id: "card_num",
  title: "Test Number",
  type: "free_number",
  propositions: Array.from({ length: 10 }, (_, i) => ({
    id: `prop_${i}`,
    text: `Q${i + 1}`,
    correctAnswer: String(i + 1),
  })),
});

const makeFreeColorCard = (): QuestionCard => ({
  id: "card_color",
  title: "Test Color",
  type: "free_color",
  propositions: Array.from({ length: 10 }, (_, i) => ({
    id: `prop_${i}`,
    text: `Q${i + 1}`,
    correctAnswer: "rouge",
  })),
});

// ─── parseNumericAnswer ──────────────────────────────────────────────────────

describe("parseNumericAnswer", () => {
  it("parses integers", () => {
    expect(parseNumericAnswer("42")).toBe(42);
  });

  it("parses decimal with dot", () => {
    expect(parseNumericAnswer("3.14")).toBeCloseTo(3.14);
  });

  it("parses decimal with comma (French locale)", () => {
    expect(parseNumericAnswer("3,14")).toBeCloseTo(3.14);
  });

  it("parses negative numbers", () => {
    expect(parseNumericAnswer("-7")).toBe(-7);
  });

  it("trims whitespace", () => {
    expect(parseNumericAnswer("  10  ")).toBe(10);
  });

  it("returns null for empty string", () => {
    expect(parseNumericAnswer("")).toBeNull();
  });

  it("returns null for non-numeric string", () => {
    expect(parseNumericAnswer("abc")).toBeNull();
  });

  it("returns null for NaN-producing input", () => {
    expect(parseNumericAnswer("1e999")).toBeNull();
  });
});

// ─── createCard ──────────────────────────────────────────────────────────────

describe("createCard", () => {
  it("creates a true_false card with generated ids", () => {
    const propositions = Array.from({ length: 10 }, (_, i) => ({
      text: `Q${i + 1}`,
      correctAnswer: "true",
    }));
    const card = createCard("Ma carte", "true_false", propositions);
    expect(card.title).toBe("Ma carte");
    expect(card.type).toBe("true_false");
    expect(card.propositions).toHaveLength(10);
    expect(card.id).toMatch(/^card_/);
    expect(card.propositions[0].id).toMatch(/^prop_/);
  });

  it("trims title and proposition texts", () => {
    const propositions = Array.from({ length: 10 }, () => ({
      text: "  texte  ",
      correctAnswer: "true",
    }));
    const card = createCard("  titre  ", "true_false", propositions);
    expect(card.title).toBe("titre");
    expect(card.propositions[0].text).toBe("texte");
  });

  it("stores choices for a choice card", () => {
    const propositions = Array.from({ length: 10 }, () => ({
      text: "Q",
      correctAnswer: "homme",
    }));
    const card = createCard("Choice", "choice", propositions, ["homme", "femme"]);
    expect(card.choices).toEqual(["homme", "femme"]);
  });

  it("does not include choices for non-choice type", () => {
    const propositions = Array.from({ length: 10 }, () => ({
      text: "Q",
      correctAnswer: "true",
    }));
    const card = createCard("TF", "true_false", propositions, ["homme", "femme"]);
    expect(card.choices).toBeUndefined();
  });
});

// ─── exportCards / importCardsFromJson ───────────────────────────────────────

describe("exportCards", () => {
  it("returns valid JSON array", () => {
    const card = makeTrueFalseCard();
    const json = exportCards([card]);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json)).toHaveLength(1);
  });

  it("returns empty array for no cards", () => {
    expect(JSON.parse(exportCards([]))).toEqual([]);
  });
});

describe("importCardsFromJson", () => {
  it("round-trips a valid card", () => {
    const card = makeTrueFalseCard();
    const json = exportCards([card]);
    const result = importCardsFromJson(json);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0].title).toBe(card.title);
  });

  it("filters out invalid cards and keeps valid ones", () => {
    const valid = makeTrueFalseCard();
    const invalid = { id: "bad", title: "" }; // missing required fields
    const json = JSON.stringify([valid, invalid]);
    const result = importCardsFromJson(json);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
  });

  it("returns null for non-array JSON", () => {
    expect(importCardsFromJson(JSON.stringify({ type: "object" }))).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(importCardsFromJson("not json at all")).toBeNull();
  });

  it("returns null when all cards are invalid", () => {
    expect(importCardsFromJson(JSON.stringify([{ id: "", title: "" }]))).toBeNull();
  });

  it("handles choice card with valid choices", () => {
    const card = makeChoiceCard();
    const json = exportCards([card]);
    const result = importCardsFromJson(json);
    expect(result).not.toBeNull();
    expect(result![0].choices).toEqual(["homme", "femme"]);
  });

  it("rejects choice card with wrong answer not in choices", () => {
    const card: QuestionCard = {
      ...makeChoiceCard(),
      propositions: Array.from({ length: 10 }, (_, i) => ({
        id: `p${i}`,
        text: `Q${i}`,
        correctAnswer: "invalide",
      })),
    };
    const json = exportCards([card]);
    expect(importCardsFromJson(json)).toBeNull();
  });

  it("accepts free_number card with numeric answers", () => {
    const card = makeFreeNumberCard();
    const result = importCardsFromJson(exportCards([card]));
    expect(result).not.toBeNull();
  });

  it("rejects free_number card with non-numeric answer", () => {
    const card: QuestionCard = {
      ...makeFreeNumberCard(),
      propositions: Array.from({ length: 10 }, (_, i) => ({
        id: `p${i}`,
        text: `Q${i}`,
        correctAnswer: "not-a-number",
      })),
    };
    expect(importCardsFromJson(exportCards([card]))).toBeNull();
  });

  it("accepts free_color card with valid color ids", () => {
    const card = makeFreeColorCard();
    expect(importCardsFromJson(exportCards([card]))).not.toBeNull();
  });

  it("rejects free_color card with unknown color id", () => {
    const card: QuestionCard = {
      ...makeFreeColorCard(),
      propositions: Array.from({ length: 10 }, (_, i) => ({
        id: `p${i}`,
        text: `Q${i}`,
        correctAnswer: "mauve-inexistant",
      })),
    };
    expect(importCardsFromJson(exportCards([card]))).toBeNull();
  });
});

// ─── flattenCardsToQuestions ─────────────────────────────────────────────────

describe("flattenCardsToQuestions", () => {
  it("flattens true_false propositions into TfQuestions", () => {
    const card = makeTrueFalseCard();
    const questions = flattenCardsToQuestions([card]);
    expect(questions).toHaveLength(10);
    expect(questions[0].prompt).toContain(card.title);
    expect(["true", "false"]).toContain(questions[0].correctAnswer);
  });

  it("ignores non-true_false cards", () => {
    const card = makeChoiceCard();
    expect(flattenCardsToQuestions([card])).toHaveLength(0);
  });

  it("produces unique ids per proposition", () => {
    const card = makeTrueFalseCard();
    const questions = flattenCardsToQuestions([card]);
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── loadCards / saveCards (localStorage via jsdom) ─────────────────────────

describe("loadCards / saveCards", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns default cards when localStorage is empty", () => {
    const cards = loadCards();
    expect(cards.length).toBeGreaterThan(0);
  });

  it("round-trips cards via save then load", () => {
    const card = makeTrueFalseCard();
    saveCards([card]);
    const loaded = loadCards();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].title).toBe(card.title);
  });

  it("falls back to defaults when localStorage contains invalid JSON", () => {
    localStorage.setItem("smart10.cards", "not-json");
    const cards = loadCards();
    expect(cards.length).toBeGreaterThan(0);
  });

  it("falls back to defaults when localStorage contains non-array JSON", () => {
    localStorage.setItem("smart10.cards", JSON.stringify({ type: "wrong" }));
    const cards = loadCards();
    expect(cards.length).toBeGreaterThan(0);
  });
});

// ─── createDefaultCards ──────────────────────────────────────────────────────

describe("createDefaultCards", () => {
  it("returns a non-empty array of valid cards", () => {
    const cards = createDefaultCards();
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => {
      expect(card.id).toBeTruthy();
      expect(card.title).toBeTruthy();
      expect(card.propositions).toHaveLength(10);
    });
  });
});
