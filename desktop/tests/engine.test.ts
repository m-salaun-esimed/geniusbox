import { describe, expect, it } from "vitest";
import { buildInitialGameState, startGame, submitAnswer } from "../src/game-engine/engine";
import { Player, TfQuestion } from "../src/game-engine/types";

const players: Player[] = [
  { id: "p1", name: "A", score: 0 },
  { id: "p2", name: "B", score: 0 }
];

const questions: TfQuestion[] = [
  { id: "q1", prompt: "A", correctAnswer: "true" },
  { id: "q2", prompt: "B", correctAnswer: "false" }
];

describe("game engine", () => {
  it("awards points for correct answer and resolves round", () => {
    const initial = buildInitialGameState(players, questions, 2, 2);
    const running = startGame(initial);
    const after = submitAnswer(running, "true");
    expect(after.status).toBe("round_summary");
    expect(after.players[0].score).toBe(2);
  });

  it("finishes after max rounds", () => {
    const initial = buildInitialGameState(players, questions, 1, 1);
    const running = startGame(initial);
    const after = submitAnswer(running, "true");
    expect(after.status).toBe("finished");
    expect(after.winnerIds).toEqual(["p1"]);
  });
});
