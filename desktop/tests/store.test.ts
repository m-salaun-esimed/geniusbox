import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../src/app/store";
import { QuestionCard, QuestionType } from "../src/game-engine/types";

// ─── fixtures ────────────────────────────────────────────────────────────────

const makeCard = (
  id: string,
  type: QuestionType,
  correctAnswer: string,
  options: { title?: string; choices?: string[] } = {}
): QuestionCard => ({
  id,
  title: options.title ?? `Card ${id}`,
  type,
  choices: options.choices,
  propositions: Array.from({ length: 10 }, (_, index) => ({
    id: `${id}_prop_${index}`,
    text: `Proposition ${index + 1}`,
    correctAnswer,
  })),
});

const seedCards = (cards: QuestionCard[]): void => {
  useAppStore.setState({
    cards,
    savedPaths: [],
    matchState: null,
    setupPlayers: ["Alice", "Bob"],
    targetPointsToWin: 10,
    selectedCardIdsForMatch: cards.map((card) => card.id),
    gameMode: "parcours",
    suddenDeath: false,
    suddenDeathDuration: 30,
  });
};

const startWith = (cards: QuestionCard[]): void => {
  seedCards(cards);
  const error = useAppStore.getState().startMatch();
  expect(error).toBeNull();
};

const firstPropId = (state = useAppStore.getState()): string => {
  const match = state.matchState;
  if (!match) throw new Error("no match");
  const card = match.orderedCards[match.currentCardIndex];
  return card.propositions.find((p) => !match.revealedPropositionIds.includes(p.id))!.id;
};

// ─── setup helpers ──────────────────────────────────────────────────────────

beforeEach(() => {
  useAppStore.setState({
    cards: [],
    savedPaths: [],
    matchState: null,
    setupPlayers: ["Joueur 1"],
    targetPointsToWin: 30,
    selectedCardIdsForMatch: [],
    gameMode: null,
    suddenDeath: false,
    suddenDeathDuration: 30,
  });
});

// ─── setup: players & target ────────────────────────────────────────────────

describe("player setup", () => {
  it("addPlayer appends a player up to 10 max", () => {
    const { addPlayer } = useAppStore.getState();
    for (let i = 0; i < 15; i += 1) addPlayer();
    expect(useAppStore.getState().setupPlayers.length).toBe(10);
  });

  it("removePlayer keeps at least one player", () => {
    useAppStore.setState({ setupPlayers: ["A"] });
    useAppStore.getState().removePlayer(0);
    expect(useAppStore.getState().setupPlayers).toEqual(["A"]);
  });

  it("setPlayerName updates only the targeted index", () => {
    useAppStore.setState({ setupPlayers: ["A", "B", "C"] });
    useAppStore.getState().setPlayerName(1, "Z");
    expect(useAppStore.getState().setupPlayers).toEqual(["A", "Z", "C"]);
  });

  it("setTargetPointsToWin clamps to [1, 999]", () => {
    const { setTargetPointsToWin } = useAppStore.getState();
    setTargetPointsToWin(-5);
    expect(useAppStore.getState().targetPointsToWin).toBe(1);
    setTargetPointsToWin(99999);
    expect(useAppStore.getState().targetPointsToWin).toBe(999);
  });
});

// ─── match selection ────────────────────────────────────────────────────────

describe("match selection", () => {
  it("adds and removes cards, ignoring duplicates and unknown ids", () => {
    const c1 = makeCard("c1", "true_false", "true");
    const c2 = makeCard("c2", "true_false", "true");
    useAppStore.setState({ cards: [c1, c2] });
    const store = useAppStore.getState();
    store.addCardToMatchSelection("c1");
    store.addCardToMatchSelection("c1");
    store.addCardToMatchSelection("ghost");
    store.addCardToMatchSelection("c2");
    expect(useAppStore.getState().selectedCardIdsForMatch).toEqual(["c1", "c2"]);
    useAppStore.getState().removeCardFromMatchSelection("c1");
    expect(useAppStore.getState().selectedCardIdsForMatch).toEqual(["c2"]);
  });

  it("moveSelectedCardInMatch reorders within bounds", () => {
    useAppStore.setState({
      cards: [makeCard("a", "true_false", "true"), makeCard("b", "true_false", "true"), makeCard("c", "true_false", "true")],
      selectedCardIdsForMatch: ["a", "b", "c"],
    });
    useAppStore.getState().moveSelectedCardInMatch("c", "up");
    expect(useAppStore.getState().selectedCardIdsForMatch).toEqual(["a", "c", "b"]);
    useAppStore.getState().moveSelectedCardInMatch("a", "up"); // already first → noop
    expect(useAppStore.getState().selectedCardIdsForMatch).toEqual(["a", "c", "b"]);
  });
});

// ─── startMatch ─────────────────────────────────────────────────────────────

describe("startMatch", () => {
  it("returns an error when no card is selected", () => {
    useAppStore.setState({ cards: [makeCard("c1", "true_false", "true")], selectedCardIdsForMatch: [] });
    expect(useAppStore.getState().startMatch()).toMatch(/au moins une carte/i);
  });

  it("flash mode trims selection to a single card", () => {
    const cards = [
      makeCard("c1", "true_false", "true"),
      makeCard("c2", "true_false", "true"),
      makeCard("c3", "true_false", "true"),
    ];
    seedCards(cards);
    useAppStore.setState({ gameMode: "flash" });
    useAppStore.getState().startMatch();
    const match = useAppStore.getState().matchState!;
    expect(match.orderedCards).toHaveLength(1);
    expect(match.targetPointsToWin).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("parcours mode keeps the full ordered selection and target points", () => {
    const cards = [makeCard("c1", "true_false", "true"), makeCard("c2", "true_false", "true")];
    seedCards(cards);
    useAppStore.setState({ targetPointsToWin: 7 });
    useAppStore.getState().startMatch();
    const match = useAppStore.getState().matchState!;
    expect(match.orderedCards.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(match.targetPointsToWin).toBe(7);
    expect(match.phase).toBe("in_round");
    expect(match.currentPlayerId).toBe("p_1");
  });
});

// ─── correct answer flow ────────────────────────────────────────────────────

describe("answer flow", () => {
  it("correct true_false answer awards a temp point and pends a decision", () => {
    startWith([makeCard("c1", "true_false", "true")]);
    const propId = firstPropId();
    const store = useAppStore.getState();
    store.selectProposition(propId);
    store.answerSelectedProposition("true");
    const match = useAppStore.getState().matchState!;
    expect(match.players[0].tempScore).toBe(1);
    expect(match.decisionPendingPlayerId).toBe("p_1");
    expect(match.revealedPropositionIds).toContain(propId);
  });

  it("secure capitalizes temp score and rotates to the next active player", () => {
    startWith([makeCard("c1", "true_false", "true")]);
    const store = useAppStore.getState();
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("true");
    store.secureAndStopTurn();
    const match = useAppStore.getState().matchState!;
    expect(match.players[0].totalScore).toBe(1);
    expect(match.players[0].tempScore).toBe(0);
    expect(match.players[0].status).toBe("stopped");
    expect(match.currentPlayerId).toBe("p_2");
  });

  it("risk keeps the same player and clears the pending decision", () => {
    startWith([makeCard("c1", "true_false", "true")]);
    const store = useAppStore.getState();
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("true");
    store.riskAndContinueTurn();
    const match = useAppStore.getState().matchState!;
    expect(match.currentPlayerId).toBe("p_1");
    expect(match.decisionPendingPlayerId).toBeNull();
    expect(match.players[0].tempScore).toBe(1);
  });

  it("wrong answer eliminates the player, drops temp points, exposes feedback", () => {
    startWith([makeCard("c1", "true_false", "true")]);
    const store = useAppStore.getState();
    // First a correct one to bank temp.
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("true");
    store.riskAndContinueTurn();
    // Now answer wrong.
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("false");
    const match = useAppStore.getState().matchState!;
    expect(match.players[0].status).toBe("eliminated");
    expect(match.players[0].tempScore).toBe(0);
    expect(match.players[0].totalScore).toBe(0);
    expect(match.wrongAnswerFeedback?.correctAnswer).toBe("Vrai");
    expect(match.wrongAnswerFeedback?.nextPlayerId).toBe("p_2");
  });

  it("acknowledging wrong-answer feedback hands turn to the next player", () => {
    startWith([makeCard("c1", "true_false", "true")]);
    const store = useAppStore.getState();
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("false");
    store.acknowledgeWrongAnswerFeedback();
    const match = useAppStore.getState().matchState!;
    expect(match.wrongAnswerFeedback).toBeNull();
    expect(match.currentPlayerId).toBe("p_2");
  });
});

// ─── free-text manual validation ────────────────────────────────────────────

describe("free_text manual validation", () => {
  it("on mismatch, exposes pendingFreeTextValidation instead of eliminating", () => {
    startWith([makeCard("c1", "free_text", "Paris")]);
    const store = useAppStore.getState();
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("paaris");
    const match = useAppStore.getState().matchState!;
    expect(match.pendingFreeTextValidation).not.toBeNull();
    expect(match.pendingFreeTextValidation?.expectedAnswer).toBe("Paris");
    expect(match.players[0].status).toBe("active");
  });

  it("validateFreeTextAsCorrect awards the point and pends a decision", () => {
    startWith([makeCard("c1", "free_text", "Paris")]);
    const store = useAppStore.getState();
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("Pariss");
    store.validateFreeTextAsCorrect();
    const match = useAppStore.getState().matchState!;
    expect(match.players[0].tempScore).toBe(1);
    expect(match.decisionPendingPlayerId).toBe("p_1");
    expect(match.pendingFreeTextValidation).toBeNull();
  });

  it("validateFreeTextAsWrong eliminates and exposes feedback", () => {
    startWith([makeCard("c1", "free_text", "Paris")]);
    const store = useAppStore.getState();
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("Lyon");
    store.validateFreeTextAsWrong();
    const match = useAppStore.getState().matchState!;
    expect(match.players[0].status).toBe("eliminated");
    expect(match.wrongAnswerFeedback?.correctAnswer).toBe("Paris");
  });

  it("normalizes accents/case for an exact match (no manual validation needed)", () => {
    startWith([makeCard("c1", "free_text", "Café")]);
    const store = useAppStore.getState();
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("  CAFE  ");
    const match = useAppStore.getState().matchState!;
    expect(match.pendingFreeTextValidation).toBeNull();
    expect(match.players[0].tempScore).toBe(1);
  });
});

// ─── free_number normalization ──────────────────────────────────────────────

describe("free_number answer comparison", () => {
  it("treats '3,14' and '3.14' as equal", () => {
    startWith([makeCard("c1", "free_number", "3,14")]);
    const store = useAppStore.getState();
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("3.14");
    expect(useAppStore.getState().matchState!.players[0].tempScore).toBe(1);
  });

  it("rejects non-numeric answers", () => {
    startWith([makeCard("c1", "free_number", "42")]);
    const store = useAppStore.getState();
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("forty-two");
    expect(useAppStore.getState().matchState!.players[0].status).toBe("eliminated");
  });
});

// ─── round / match resolution ───────────────────────────────────────────────

describe("round & match resolution", () => {
  it("revealing all 10 propositions ends the round in round_summary", () => {
    seedCards([
      makeCard("c1", "true_false", "true"),
      makeCard("c2", "true_false", "true"),
    ]);
    useAppStore.setState({ targetPointsToWin: 999 });
    expect(useAppStore.getState().startMatch()).toBeNull();
    for (let i = 0; i < 10; i += 1) {
      const store = useAppStore.getState();
      store.selectProposition(firstPropId());
      store.answerSelectedProposition("true");
      store.riskAndContinueTurn();
    }
    const match = useAppStore.getState().matchState!;
    // After all 10 are revealed the player auto-banks and we move to round_summary.
    expect(match.phase).toBe("round_summary");
    expect(match.players[0].totalScore).toBe(10);
  });

  it("continueAfterRound advances to the next card and rotates the starter", () => {
    seedCards([
      makeCard("c1", "true_false", "true"),
      makeCard("c2", "true_false", "true"),
    ]);
    useAppStore.setState({ targetPointsToWin: 999 });
    expect(useAppStore.getState().startMatch()).toBeNull();
    for (let i = 0; i < 10; i += 1) {
      const store = useAppStore.getState();
      store.selectProposition(firstPropId());
      store.answerSelectedProposition("true");
      store.riskAndContinueTurn();
    }
    useAppStore.getState().continueAfterRound();
    const match = useAppStore.getState().matchState!;
    expect(match.phase).toBe("in_round");
    expect(match.currentCardIndex).toBe(1);
    expect(match.currentPlayerId).toBe("p_2");
    expect(match.players.every((p) => p.status === "active")).toBe(true);
  });

  it("reaching the target points moves the match to match_complete with a winner", () => {
    seedCards([makeCard("c1", "true_false", "true")]);
    useAppStore.setState({ targetPointsToWin: 1 });
    useAppStore.getState().startMatch();
    const store = useAppStore.getState();
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("true");
    const match = useAppStore.getState().matchState!;
    expect(match.phase).toBe("match_complete");
    expect(match.winnerIds).toEqual(["p_1"]);
    expect(match.players[0].totalScore).toBe(1);
  });

  it("proceedToFinalRanking moves match_complete → finished", () => {
    seedCards([makeCard("c1", "true_false", "true")]);
    useAppStore.setState({ targetPointsToWin: 1 });
    useAppStore.getState().startMatch();
    const store = useAppStore.getState();
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("true");
    store.proceedToFinalRanking();
    expect(useAppStore.getState().matchState!.phase).toBe("finished");
  });

  it("eliminating every player ends the round even if propositions remain", () => {
    startWith([makeCard("c1", "true_false", "true")]);
    const store = useAppStore.getState();
    // p_1 wrong → eliminated.
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("false");
    store.acknowledgeWrongAnswerFeedback();
    // p_2 wrong → eliminated.
    const store2 = useAppStore.getState();
    store2.selectProposition(firstPropId());
    store2.answerSelectedProposition("false");
    store2.acknowledgeWrongAnswerFeedback();
    const match = useAppStore.getState().matchState!;
    // Only one card → match_complete, not round_summary.
    expect(match.phase).toBe("match_complete");
  });

  it("terminateMatch clears matchState", () => {
    startWith([makeCard("c1", "true_false", "true")]);
    useAppStore.getState().terminateMatch();
    expect(useAppStore.getState().matchState).toBeNull();
  });
});

// ─── timeout forfeit ────────────────────────────────────────────────────────

describe("forfeitTurnAsTimeout", () => {
  it("eliminates the current player and exposes the timeout feedback", () => {
    startWith([makeCard("c1", "true_false", "true")]);
    useAppStore.getState().forfeitTurnAsTimeout();
    const match = useAppStore.getState().matchState!;
    expect(match.players[0].status).toBe("eliminated");
    expect(match.wrongAnswerFeedback?.message).toMatch(/temps/i);
    expect(match.wrongAnswerFeedback?.nextPlayerId).toBe("p_2");
  });

  it("is a no-op while a decision is pending", () => {
    startWith([makeCard("c1", "true_false", "true")]);
    const store = useAppStore.getState();
    store.selectProposition(firstPropId());
    store.answerSelectedProposition("true");
    store.forfeitTurnAsTimeout();
    expect(useAppStore.getState().matchState!.players[0].status).toBe("active");
  });
});

// ─── card CRUD ──────────────────────────────────────────────────────────────

describe("card CRUD", () => {
  const draftPropositions = (correct: string) =>
    Array.from({ length: 10 }, (_, i) => ({ text: `Q${i + 1}`, correctAnswer: correct }));

  it("addCard rejects a missing title", () => {
    const error = useAppStore.getState().addCard("  ", "true_false", draftPropositions("true"));
    expect(error).toMatch(/titre/i);
  });

  it("addCard rejects when fewer than 10 propositions are provided", () => {
    const error = useAppStore
      .getState()
      .addCard("Test", "true_false", draftPropositions("true").slice(0, 9));
    expect(error).toMatch(/10 propositions/);
  });

  it("addCard rejects an exact duplicate (same title, type, answers)", () => {
    useAppStore.getState().addCard("Quiz", "true_false", draftPropositions("true"));
    const error = useAppStore.getState().addCard("Quiz", "true_false", draftPropositions("true"));
    expect(error).toMatch(/identique/i);
  });

  it("addCard accepts a same-title card if the type or answers differ", () => {
    expect(useAppStore.getState().addCard("Quiz", "true_false", draftPropositions("true"))).toBeNull();
    expect(useAppStore.getState().addCard("Quiz", "true_false", draftPropositions("false"))).toBeNull();
    expect(useAppStore.getState().cards).toHaveLength(2);
  });

  it("addCard rejects a 'choice' card whose answers are not in the choices set", () => {
    const props = Array.from({ length: 10 }, (_, i) => ({ text: `Q${i + 1}`, correctAnswer: "intrus" }));
    const error = useAppStore.getState().addCard("C", "choice", props, ["a", "b"]);
    expect(error).toMatch(/choix/i);
  });

  it("addCard rejects a 'free_number' card with a non-numeric answer", () => {
    const props = Array.from({ length: 10 }, (_, i) => ({ text: `Q${i + 1}`, correctAnswer: "abc" }));
    expect(useAppStore.getState().addCard("N", "free_number", props)).toMatch(/nombre/i);
  });

  it("deleteCard prunes the card from selections and saved paths", () => {
    expect(useAppStore.getState().addCard("X", "true_false", draftPropositions("true"))).toBeNull();
    const id = useAppStore.getState().cards[0].id;
    useAppStore.setState({
      selectedCardIdsForMatch: [id],
      savedPaths: [{ id: "p1", name: "n", category: "c", cardIds: [id] }],
    });
    useAppStore.getState().deleteCard(id);
    const after = useAppStore.getState();
    expect(after.cards).toHaveLength(0);
    expect(after.selectedCardIdsForMatch).toEqual([]);
    expect(after.savedPaths[0].cardIds).toEqual([]);
  });
});

// ─── path CRUD ──────────────────────────────────────────────────────────────

describe("saved path CRUD", () => {
  it("createPathFromSelection requires name, category, and a non-empty selection", () => {
    useAppStore.setState({
      cards: [makeCard("c1", "true_false", "true")],
      selectedCardIdsForMatch: [],
    });
    const store = useAppStore.getState();
    expect(store.createPathFromSelection("", "cat")).toMatch(/nom/i);
    expect(store.createPathFromSelection("name", "")).toMatch(/cat/i);
    expect(store.createPathFromSelection("name", "cat")).toMatch(/au moins une carte/i);
  });

  it("createPathFromSelection persists a new path on success", () => {
    useAppStore.setState({
      cards: [makeCard("c1", "true_false", "true")],
      selectedCardIdsForMatch: ["c1"],
    });
    expect(useAppStore.getState().createPathFromSelection("My path", "Quiz")).toBeNull();
    expect(useAppStore.getState().savedPaths).toHaveLength(1);
    expect(useAppStore.getState().savedPaths[0]).toMatchObject({
      name: "My path",
      category: "Quiz",
      cardIds: ["c1"],
    });
  });

  it("deletePath removes the targeted path", () => {
    useAppStore.setState({
      savedPaths: [
        { id: "a", name: "A", category: "c", cardIds: [] },
        { id: "b", name: "B", category: "c", cardIds: [] },
      ],
    });
    useAppStore.getState().deletePath("a");
    expect(useAppStore.getState().savedPaths.map((p) => p.id)).toEqual(["b"]);
  });
});
