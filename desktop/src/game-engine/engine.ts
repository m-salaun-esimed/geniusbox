import { GameState, Player, TfAnswer, TfQuestion } from "./types";

const nextPlayerIndex = (current: number, count: number): number =>
  (current + 1) % count;

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

export const buildInitialGameState = (
  players: Player[],
  questions: TfQuestion[],
  maxRounds: number,
  pointsPerCorrect: number
): GameState => {
  assert(players.length >= 2, "At least 2 players are required.");
  assert(players.length <= 10, "At most 10 players are supported.");
  assert(questions.length >= maxRounds, "Not enough questions for max rounds.");
  assert(pointsPerCorrect >= 1, "Points per correct answer must be at least 1.");

  return {
    status: "setup",
    players,
    questions,
    pointsPerCorrect,
    usedQuestionIds: [],
    round: 0,
    maxRounds,
    activeRound: null,
    winnerIds: []
  };
};

export const startGame = (state: GameState): GameState => {
  assert(state.status === "setup", "Game can only start from setup.");
  return startNextRound({ ...state, round: 0, usedQuestionIds: [] });
};

export const startNextRound = (state: GameState): GameState => {
  assert(
    state.status === "setup" || state.status === "round_summary",
    "Can only start next round from setup or round summary."
  );
  const availableQuestion = state.questions.find(
    (question) => !state.usedQuestionIds.includes(question.id)
  );
  assert(Boolean(availableQuestion), "No questions left.");
  if (!availableQuestion) {
    return state;
  }

  const nextRoundNumber = state.round + 1;
  return {
    ...state,
    status: "in_round",
    round: nextRoundNumber,
    usedQuestionIds: [...state.usedQuestionIds, availableQuestion.id],
    activeRound: {
      questionId: availableQuestion.id,
      currentPlayerIndex: 0,
      attemptedByPlayerIds: [],
      resolved: false
    }
  };
};

export const submitAnswer = (
  state: GameState,
  answer: TfAnswer
): GameState => {
  assert(state.status === "in_round", "Cannot submit answer outside of a round.");
  assert(Boolean(state.activeRound), "Round not initialized.");
  if (!state.activeRound) {
    return state;
  }

  const round = state.activeRound;
  const question = state.questions.find((item) => item.id === round.questionId);
  assert(Boolean(question), "Question not found.");
  if (!question) {
    return state;
  }

  const currentPlayer = state.players[round.currentPlayerIndex];
  const attemptedByPlayerIds = [...round.attemptedByPlayerIds, currentPlayer.id];
  const answeredCorrectly = question.correctAnswer === answer;
  const updatedPlayers = state.players.map((player) =>
    player.id === currentPlayer.id && answeredCorrectly
      ? { ...player, score: player.score + state.pointsPerCorrect }
      : player
  );

  const everyoneTried = attemptedByPlayerIds.length >= state.players.length;
  const roundResolved = answeredCorrectly || everyoneTried;
  const nextState: GameState = {
    ...state,
    players: updatedPlayers,
    activeRound: {
      ...round,
      attemptedByPlayerIds,
      resolved: roundResolved,
      currentPlayerIndex: nextPlayerIndex(round.currentPlayerIndex, state.players.length)
    }
  };

  return roundResolved ? endRound(nextState) : nextState;
};

export const endRound = (state: GameState): GameState => {
  assert(state.status === "in_round", "Cannot end round outside active play.");
  const isGameDone = state.round >= state.maxRounds;
  if (isGameDone) {
    const topScore = Math.max(...state.players.map((player) => player.score));
    return {
      ...state,
      status: "finished",
      activeRound: null,
      winnerIds: state.players
        .filter((player) => player.score === topScore)
        .map((player) => player.id)
    };
  }

  return {
    ...state,
    status: "round_summary",
    activeRound: null
  };
};
