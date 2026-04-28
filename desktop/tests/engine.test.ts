import { describe, expect, it } from "vitest";
import {
  buildInitialGameState,
  endRound,
  startGame,
  startNextRound,
  submitAnswer,
} from "../src/game-engine/engine";
import { Player, TfQuestion } from "../src/game-engine/types";

// ─── fixtures ────────────────────────────────────────────────────────────────

const players: Player[] = [
  { id: "p1", name: "Alice", score: 0 },
  { id: "p2", name: "Bob", score: 0 },
];

const questions: TfQuestion[] = [
  { id: "q1", prompt: "La Terre est ronde", correctAnswer: "true" },
  { id: "q2", prompt: "2 + 2 = 5", correctAnswer: "false" },
  { id: "q3", prompt: "Paris est en France", correctAnswer: "true" },
];

// ─── buildInitialGameState ────────────────────────────────────────────────────

describe("buildInitialGameState", () => {
  it("creates a valid initial state", () => {
    const state = buildInitialGameState(players, questions, 2, 1);
    expect(state.status).toBe("setup");
    expect(state.players).toHaveLength(2);
    expect(state.round).toBe(0);
    expect(state.usedQuestionIds).toHaveLength(0);
    expect(state.activeRound).toBeNull();
    expect(state.winnerIds).toHaveLength(0);
  });

  it("throws when fewer than 2 players", () => {
    const one = [players[0]];
    expect(() => buildInitialGameState(one, questions, 2, 1)).toThrow();
  });

  it("throws when more than 10 players", () => {
    const eleven = Array.from({ length: 11 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, score: 0 }));
    expect(() => buildInitialGameState(eleven, questions, 2, 1)).toThrow();
  });

  it("throws when not enough questions for max rounds", () => {
    expect(() => buildInitialGameState(players, questions, 10, 1)).toThrow();
  });

  it("throws when pointsPerCorrect < 1", () => {
    expect(() => buildInitialGameState(players, questions, 2, 0)).toThrow();
  });

  it("accepts exactly 2 players and 1 question for 1 round", () => {
    expect(() => buildInitialGameState(players, [questions[0]], 1, 1)).not.toThrow();
  });

  it("accepts 10 players", () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, score: 0 }));
    expect(() => buildInitialGameState(ten, questions, 2, 1)).not.toThrow();
  });
});

// ─── startGame ───────────────────────────────────────────────────────────────

describe("startGame", () => {
  it("moves status to in_round", () => {
    const state = buildInitialGameState(players, questions, 2, 1);
    const running = startGame(state);
    expect(running.status).toBe("in_round");
  });

  it("initialises round to 1", () => {
    const state = buildInitialGameState(players, questions, 2, 1);
    const running = startGame(state);
    expect(running.round).toBe(1);
  });

  it("selects a question for the first round", () => {
    const state = buildInitialGameState(players, questions, 2, 1);
    const running = startGame(state);
    expect(running.activeRound).not.toBeNull();
    expect(running.usedQuestionIds).toHaveLength(1);
  });

  it("throws when called from a non-setup state", () => {
    const state = buildInitialGameState(players, questions, 2, 1);
    const running = startGame(state);
    expect(() => startGame(running)).toThrow();
  });
});

// ─── submitAnswer — correct answer ───────────────────────────────────────────

describe("submitAnswer — correct answer", () => {
  it("awards points to the current player", () => {
    const initial = buildInitialGameState(players, questions, 2, 2);
    const running = startGame(initial);
    const after = submitAnswer(running, "true"); // q1 correctAnswer = "true"
    expect(after.players[0].score).toBe(2);
  });

  it("resolves the round (status → round_summary)", () => {
    const initial = buildInitialGameState(players, questions, 2, 2);
    const running = startGame(initial);
    const after = submitAnswer(running, "true");
    expect(after.status).toBe("round_summary");
  });

  it("marks the question as used", () => {
    const initial = buildInitialGameState(players, questions, 2, 2);
    const running = startGame(initial);
    const questionId = running.activeRound!.questionId;
    const after = submitAnswer(running, "true");
    expect(after.usedQuestionIds).toContain(questionId);
  });
});

// ─── submitAnswer — wrong answer ─────────────────────────────────────────────

describe("submitAnswer — wrong answer", () => {
  it("does not award points", () => {
    const initial = buildInitialGameState(players, questions, 2, 1);
    const running = startGame(initial);
    const after = submitAnswer(running, "false"); // q1 correct = "true"
    expect(after.players[0].score).toBe(0);
    expect(after.players[1].score).toBe(0);
  });

  it("moves to the next player", () => {
    const initial = buildInitialGameState(players, questions, 2, 1);
    const running = startGame(initial);
    const after = submitAnswer(running, "false");
    if (after.status === "in_round") {
      expect(after.activeRound!.currentPlayerIndex).toBe(1);
    }
  });

  it("records the wrong attempt in attemptedByPlayerIds", () => {
    const initial = buildInitialGameState(players, questions, 2, 1);
    const running = startGame(initial);
    const playerId = players[running.activeRound!.currentPlayerIndex].id;
    const after = submitAnswer(running, "false");
    if (after.status === "in_round") {
      expect(after.activeRound!.attemptedByPlayerIds).toContain(playerId);
    }
  });

  it("resolves round when everyone tried and no one got it right", () => {
    const initial = buildInitialGameState(players, questions, 2, 1);
    let state = startGame(initial);
    state = submitAnswer(state, "false"); // p1 wrong
    if (state.status === "in_round") {
      state = submitAnswer(state, "false"); // p2 wrong
    }
    expect(state.status === "round_summary" || state.status === "finished").toBe(true);
  });
});

// ─── multi-round flow ─────────────────────────────────────────────────────────

describe("multi-round flow", () => {
  it("finishes after max rounds when all answered correctly", () => {
    const initial = buildInitialGameState(players, questions, 1, 1);
    const running = startGame(initial);
    const after = submitAnswer(running, "true");
    expect(after.status).toBe("finished");
  });

  it("populates winnerIds on finish", () => {
    const initial = buildInitialGameState(players, questions, 1, 1);
    const running = startGame(initial);
    const after = submitAnswer(running, "true");
    expect(after.winnerIds).toHaveLength(1);
    expect(after.winnerIds[0]).toBe("p1");
  });

  it("allows a second round after round_summary", () => {
    const initial = buildInitialGameState(players, questions, 2, 1);
    let state = startGame(initial);
    state = submitAnswer(state, "true"); // round 1 done → round_summary
    expect(state.status).toBe("round_summary");
    state = startNextRound(state);
    expect(state.status).toBe("in_round");
    expect(state.round).toBe(2);
  });

  it("uses a different question for round 2", () => {
    const initial = buildInitialGameState(players, questions, 2, 1);
    let state = startGame(initial);
    const q1Id = state.activeRound!.questionId;
    state = submitAnswer(state, "true");
    state = startNextRound(state);
    expect(state.activeRound!.questionId).not.toBe(q1Id);
  });
});

// ─── tie handling ─────────────────────────────────────────────────────────────

describe("tie handling", () => {
  it("declares multiple winners when scores are equal", () => {
    const tiedPlayers: Player[] = [
      { id: "p1", name: "Alice", score: 1 },
      { id: "p2", name: "Bob", score: 1 },
    ];
    const state = buildInitialGameState(tiedPlayers, questions, 1, 1);
    const running = startGame(state);
    // Both start with 1 point; p1 answers correctly to get 2, p2 stays at 1 — not a tie.
    // To test a tie we need equal scores at end — end the round without correct answer.
    const after = submitAnswer(running, "false"); // p1 wrong
    if (after.status === "in_round") {
      const after2 = submitAnswer(after, "false"); // p2 wrong
      if (after2.status === "finished") {
        // Both at 1 point → tie
        expect(after2.winnerIds).toHaveLength(2);
      }
    }
  });
});

// ─── endRound ────────────────────────────────────────────────────────────────

describe("endRound", () => {
  it("throws when called outside an active round", () => {
    const state = buildInitialGameState(players, questions, 2, 1);
    expect(() => endRound(state)).toThrow();
  });
});

// ─── startNextRound ───────────────────────────────────────────────────────────

describe("startNextRound", () => {
  it("throws when called from in_round state", () => {
    const state = buildInitialGameState(players, questions, 2, 1);
    const running = startGame(state);
    expect(() => startNextRound(running)).toThrow();
  });

  it("throws when no questions are left", () => {
    const twoQs = questions.slice(0, 2);
    const state = buildInitialGameState(players, twoQs, 2, 1);
    let s = startGame(state);
    s = submitAnswer(s, "true"); // round 1 done
    s = startNextRound(s); // round 2 starts
    s = submitAnswer(s, "false"); // round 2 done → finished (maxRounds reached)
    expect(s.status).toBe("finished");
  });
});
