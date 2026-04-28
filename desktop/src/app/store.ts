import { create } from "zustand";
import { COLOR_PALETTE_IDS, QuestionCard, QuestionType } from "../game-engine/types";
import {
  MAX_CHOICE_COUNT,
  MIN_CHOICE_COUNT,
  createCard,
  exportCards,
  importCardsFromJson,
  loadCards,
  parseNumericAnswer,
  saveCards
} from "../storage/questionPacks";

type MatchPlayerStatus = "active" | "stopped" | "eliminated";
type MatchPhase = "in_round" | "round_summary" | "match_complete" | "finished";
export type GameMode = "flash" | "parcours";
const PATHS_STORAGE_KEY = "smart10.paths";

interface MatchPlayer {
  id: string;
  name: string;
  totalScore: number;
  tempScore: number;
  status: MatchPlayerStatus;
}

interface MatchState {
  phase: MatchPhase;
  targetPointsToWin: number;
  selectedPathName: string | null;
  selectedPathCategory: string | null;
  orderedCards: QuestionCard[];
  currentCardIndex: number;
  currentPlayerId: string;
  players: MatchPlayer[];
  revealedPropositionIds: string[];
  wrongPropositionIds: string[];
  selectedPropositionId: string | null;
  decisionPendingPlayerId: string | null;
  wrongAnswerFeedback: {
    message: string;
    nextPlayerId: string | null;
    propositionId: string;
    propositionText: string;
    correctAnswer: string;
  } | null;
  pendingFreeTextValidation: {
    propositionId: string;
    submittedAnswer: string;
    expectedAnswer: string;
  } | null;
  winnerIds: string[];
  suddenDeath: boolean;
  suddenDeathDuration: number;
}

export const TIMEOUT_FEEDBACK_MESSAGE = "Temps écoulé";

export interface SavedPath {
  id: string;
  name: string;
  category: string;
  cardIds: string[];
}

interface AppState {
  cards: QuestionCard[];
  savedPaths: SavedPath[];
  matchState: MatchState | null;
  setupPlayers: string[];
  targetPointsToWin: number;
  selectedCardIdsForMatch: string[];
  gameMode: GameMode | null;
  suddenDeath: boolean;
  suddenDeathDuration: number;
  setGameMode: (mode: GameMode) => void;
  setSuddenDeath: (enabled: boolean) => void;
  setSuddenDeathDuration: (seconds: number) => void;
  forfeitTurnAsTimeout: () => void;
  setPlayerName: (index: number, name: string) => void;
  addPlayer: () => void;
  removePlayer: (index: number) => void;
  setTargetPointsToWin: (points: number) => void;
  addCardToMatchSelection: (cardId: string) => void;
  removeCardFromMatchSelection: (cardId: string) => void;
  moveSelectedCardInMatch: (cardId: string, direction: "up" | "down") => void;
  setCardSelectionForMatch: (cardIds: string[]) => void;
  createPathFromSelection: (name: string, category: string) => string | null;
  updatePathFromSelection: (pathId: string, name: string, category: string) => string | null;
  deletePath: (pathId: string) => void;
  startMatch: () => string | null;
  selectProposition: (propositionId: string) => void;
  answerSelectedProposition: (answer: string) => void;
  validateFreeTextAsCorrect: () => void;
  validateFreeTextAsWrong: () => void;
  secureAndStopTurn: () => void;
  riskAndContinueTurn: () => void;
  acknowledgeWrongAnswerFeedback: () => void;
  continueAfterRound: () => void;
  proceedToFinalRanking: () => void;
  terminateMatch: () => void;
  addCard: (
    title: string,
    type: QuestionType,
    propositions: { text: string; correctAnswer: string }[],
    choices?: string[]
  ) => string | null;
  updateCard: (
    cardId: string,
    title: string,
    type: QuestionType,
    propositions: { text: string; correctAnswer: string }[],
    choices?: string[]
  ) => string | null;
  deleteCard: (cardId: string) => void;
  exportCards: (subset?: QuestionCard[]) => string;
  importCards: (raw: string) => boolean;
}

const cards = loadCards();
const cloneImportedCardWithNewIds = (card: QuestionCard): QuestionCard => ({
  ...card,
  id: `card_${crypto.randomUUID()}`,
  propositions: card.propositions.map((proposition) => ({
    ...proposition,
    id: `prop_${crypto.randomUUID()}`
  }))
});
const createDefaultPaths = (availableCards: QuestionCard[]): SavedPath[] => {
  const ids = availableCards.map((card) => card.id);
  const pick = (start: number, count: number): string[] => ids.slice(start, start + count);
  const defaults: SavedPath[] = [
    {
      id: "path_default_geo",
      name: "Tour du monde",
      category: "Géographie",
      cardIds: pick(0, 5)
    },
    {
      id: "path_default_culture",
      name: "Culture pop",
      category: "Culture générale",
      cardIds: pick(3, 5)
    },
    {
      id: "path_default_mix",
      name: "Mix rapide",
      category: "Mix",
      cardIds: pick(6, 5)
    }
  ];
  return defaults.filter((path) => path.cardIds.length > 0);
};
const loadPaths = (availableCards: QuestionCard[]): SavedPath[] => {
  const defaults = createDefaultPaths(availableCards);
  const raw = localStorage.getItem(PATHS_STORAGE_KEY);
  if (!raw) {
    savePaths(defaults);
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw) as SavedPath[];
    if (!Array.isArray(parsed)) {
      savePaths(defaults);
      return defaults;
    }
    const valid = parsed.filter(
      (path) =>
        Boolean(path?.id?.trim()) &&
        Boolean(path?.name?.trim()) &&
        Boolean(path?.category?.trim()) &&
        Array.isArray(path.cardIds)
    );
    const merged = [...valid];
    defaults.forEach((defaultPath) => {
      if (!merged.some((path) => path.id === defaultPath.id)) {
        merged.push(defaultPath);
      }
    });
    if (merged.length === 0) {
      savePaths(defaults);
      return defaults;
    }
    if (merged.length !== valid.length) {
      savePaths(merged);
    }
    return merged;
  } catch (_error) {
    savePaths(defaults);
    return defaults;
  }
};
const savePaths = (paths: SavedPath[]): void => {
  localStorage.setItem(PATHS_STORAGE_KEY, JSON.stringify(paths));
};
const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();

const sameAnswerSet = (
  a: { correctAnswer: string }[],
  b: { correctAnswer: string }[]
): boolean => {
  if (a.length !== b.length) return false;
  const sortedA = a.map((p) => normalizeText(p.correctAnswer)).sort();
  const sortedB = b.map((p) => normalizeText(p.correctAnswer)).sort();
  return sortedA.every((value, index) => value === sortedB[index]);
};

const validateCardDraft = (
  type: QuestionType,
  propositions: { text: string; correctAnswer: string }[],
  choices?: string[]
): string | null => {
  if (type === "choice") {
    const trimmed = (choices ?? []).map((choice) => choice.trim()).filter((choice) => choice.length > 0);
    if (trimmed.length < MIN_CHOICE_COUNT || trimmed.length > MAX_CHOICE_COUNT) {
      return `Une question fermée doit avoir entre ${MIN_CHOICE_COUNT} et ${MAX_CHOICE_COUNT} choix.`;
    }
    const validAnswers = new Set(trimmed);
    if (propositions.some((proposition) => !validAnswers.has(proposition.correctAnswer.trim()))) {
      return "Chaque réponse doit correspondre à l'un des choix définis.";
    }
  }
  if (type === "free_number") {
    if (propositions.some((proposition) => parseNumericAnswer(proposition.correctAnswer) === null)) {
      return "Chaque réponse attendue doit être un nombre valide.";
    }
  }
  if (type === "free_color") {
    if (
      propositions.some(
        (proposition) => !COLOR_PALETTE_IDS.includes(proposition.correctAnswer.trim().toLowerCase())
      )
    ) {
      return "Chaque réponse doit être une couleur de la palette.";
    }
  }
  return null;
};

const getCurrentCard = (state: MatchState): QuestionCard => state.orderedCards[state.currentCardIndex];
const isAnswerCorrect = (cardType: QuestionType, expected: string, received: string): boolean => {
  if (cardType === "free_text") {
    return normalizeText(expected) === normalizeText(received);
  }
  if (cardType === "free_number") {
    const expectedNumber = parseNumericAnswer(expected);
    const receivedNumber = parseNumericAnswer(received);
    if (expectedNumber === null || receivedNumber === null) {
      return false;
    }
    return expectedNumber === receivedNumber;
  }
  if (cardType === "free_color") {
    return normalizeText(expected) === normalizeText(received);
  }
  return expected === received;
};

const getActivePlayers = (state: MatchState): MatchPlayer[] => state.players.filter((player) => player.status === "active");

const getNextActivePlayerId = (state: MatchState, fromPlayerId: string): string | null => {
  const fromIndex = state.players.findIndex((player) => player.id === fromPlayerId);
  if (fromIndex < 0) {
    return null;
  }
  for (let offset = 1; offset <= state.players.length; offset += 1) {
    const candidate = state.players[(fromIndex + offset) % state.players.length];
    if (candidate.status === "active") {
      return candidate.id;
    }
  }
  return null;
};

const finishMatchIfNeeded = (state: MatchState): MatchState => {
  const reachedTarget = state.players.some((player) => player.totalScore + player.tempScore >= state.targetPointsToWin);
  const outOfCards = state.currentCardIndex >= state.orderedCards.length - 1;
  if (!reachedTarget && !outOfCards) {
    return { ...state, phase: "round_summary", winnerIds: [] };
  }
  const settledPlayers = state.players.map((player) =>
    player.tempScore > 0
      ? { ...player, totalScore: player.totalScore + player.tempScore, tempScore: 0 }
      : player
  );
  const topScore = Math.max(...settledPlayers.map((player) => player.totalScore));
  return {
    ...state,
    players: settledPlayers,
    phase: "match_complete",
    winnerIds: settledPlayers.filter((player) => player.totalScore === topScore).map((player) => player.id),
    decisionPendingPlayerId: null,
    selectedPropositionId: null
  };
};

const resolveRoundIfEnded = (state: MatchState): MatchState => {
  const reachedTarget = state.players.some(
    (player) => player.totalScore + player.tempScore >= state.targetPointsToWin
  );
  if (reachedTarget) {
    return finishMatchIfNeeded(state);
  }
  const card = getCurrentCard(state);
  const allRevealed = state.revealedPropositionIds.length >= card.propositions.length;
  const noActivePlayer = getActivePlayers(state).length === 0;
  if (!allRevealed && !noActivePlayer) {
    return state;
  }
  const settledPlayers = state.players.map((player) =>
    player.status === "active" && player.tempScore > 0
      ? { ...player, totalScore: player.totalScore + player.tempScore, tempScore: 0, status: "stopped" as const }
      : player
  );
  return finishMatchIfNeeded({
    ...state,
    players: settledPlayers,
    decisionPendingPlayerId: null,
    selectedPropositionId: null
  });
};

export const useAppStore = create<AppState>((set, get) => ({
  cards,
  savedPaths: loadPaths(cards),
  matchState: null,
  setupPlayers: ["Joueur 1"],
  targetPointsToWin: 30,
  selectedCardIdsForMatch: [],
  gameMode: null,
  suddenDeath: false,
  suddenDeathDuration: 30,
  setGameMode: (mode) =>
    set((state) => (state.gameMode === mode ? state : { gameMode: mode, selectedCardIdsForMatch: [] })),
  setSuddenDeath: (enabled) => set(() => ({ suddenDeath: enabled })),
  setSuddenDeathDuration: (seconds) =>
    set(() => ({ suddenDeathDuration: Math.max(5, Math.min(120, Math.round(seconds))) })),
  setPlayerName: (index, name) =>
    set((state) => {
      const updated = [...state.setupPlayers];
      updated[index] = name;
      return { setupPlayers: updated };
    }),
  addPlayer: () =>
    set((state) =>
      state.setupPlayers.length >= 10
        ? state
        : { setupPlayers: [...state.setupPlayers, `Joueur ${state.setupPlayers.length + 1}`] }
    ),
  removePlayer: (index) =>
    set((state) => {
      if (state.setupPlayers.length <= 1) {
        return state;
      }
      const updated = state.setupPlayers.filter((_, currentIndex) => currentIndex !== index);
      return { setupPlayers: updated };
    }),
  setTargetPointsToWin: (points) =>
    set(() => ({
      targetPointsToWin: Math.max(1, Math.min(999, points))
    })),
  addCardToMatchSelection: (cardId) =>
    set((state) => {
      if (!state.cards.some((card) => card.id === cardId) || state.selectedCardIdsForMatch.includes(cardId)) {
        return state;
      }
      return { selectedCardIdsForMatch: [...state.selectedCardIdsForMatch, cardId] };
    }),
  removeCardFromMatchSelection: (cardId) =>
    set((state) => ({
      selectedCardIdsForMatch: state.selectedCardIdsForMatch.filter((id) => id !== cardId)
    })),
  moveSelectedCardInMatch: (cardId, direction) =>
    set((state) => {
      const currentIndex = state.selectedCardIdsForMatch.indexOf(cardId);
      if (currentIndex < 0) {
        return state;
      }
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= state.selectedCardIdsForMatch.length) {
        return state;
      }
      const updated = [...state.selectedCardIdsForMatch];
      const [moved] = updated.splice(currentIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return { selectedCardIdsForMatch: updated };
    }),
  setCardSelectionForMatch: (cardIds) =>
    set((state) => ({
      selectedCardIdsForMatch: cardIds.filter((cardId) => state.cards.some((card) => card.id === cardId))
    })),
  createPathFromSelection: (name, category) => {
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const state = get();
    if (!trimmedName) {
      return "Le nom du parcours est obligatoire.";
    }
    if (!trimmedCategory) {
      return "La catégorie du parcours est obligatoire.";
    }
    if (state.selectedCardIdsForMatch.length === 0) {
      return "Ajoute au moins une carte dans le parcours avant de sauvegarder.";
    }
    const created: SavedPath = {
      id: `path_${crypto.randomUUID()}`,
      name: trimmedName,
      category: trimmedCategory,
      cardIds: [...state.selectedCardIdsForMatch]
    };
    const updated = [...state.savedPaths, created];
    savePaths(updated);
    set({ savedPaths: updated });
    return null;
  },
  updatePathFromSelection: (pathId, name, category) => {
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const state = get();
    if (!trimmedName) {
      return "Le nom du parcours est obligatoire.";
    }
    if (!trimmedCategory) {
      return "La catégorie du parcours est obligatoire.";
    }
    if (state.selectedCardIdsForMatch.length === 0) {
      return "Ajoute au moins une carte dans le parcours avant de sauvegarder.";
    }
    const exists = state.savedPaths.some((path) => path.id === pathId);
    if (!exists) {
      return "Parcours introuvable.";
    }
    const updated = state.savedPaths.map((path) =>
      path.id === pathId
        ? {
            ...path,
            name: trimmedName,
            category: trimmedCategory,
            cardIds: [...state.selectedCardIdsForMatch]
          }
        : path
    );
    savePaths(updated);
    set({ savedPaths: updated });
    return null;
  },
  deletePath: (pathId) =>
    set((state) => {
      const updated = state.savedPaths.filter((path) => path.id !== pathId);
      savePaths(updated);
      return { savedPaths: updated };
    }),
  startMatch: () => {
    const state = get();
    if (state.selectedCardIdsForMatch.length === 0) {
      return "Sélectionne au moins une carte pour la partie.";
    }
    const cardIdsForMatch =
      state.gameMode === "flash"
        ? state.selectedCardIdsForMatch.slice(0, 1)
        : state.selectedCardIdsForMatch;
    const orderedCards = cardIdsForMatch
      .map((id) => state.cards.find((card) => card.id === id))
      .filter((card): card is QuestionCard => Boolean(card));
    if (orderedCards.length === 0) {
      return "Aucune carte exploitable dans la sélection.";
    }
    const players: MatchPlayer[] = state.setupPlayers.map((name, index) => ({
      id: `p_${index + 1}`,
      name: name.trim() || `Joueur ${index + 1}`,
      totalScore: 0,
      tempScore: 0,
      status: "active"
    }));
    const matchTargetPoints =
      state.gameMode === "flash" ? Number.MAX_SAFE_INTEGER : state.targetPointsToWin;
    const selectedPath =
      state.gameMode === "parcours"
        ? state.savedPaths.find((path) => {
            if (path.cardIds.length !== cardIdsForMatch.length) {
              return false;
            }
            return path.cardIds.every((cardId, index) => cardId === cardIdsForMatch[index]);
          }) ?? null
        : null;
    set({
      matchState: {
        phase: "in_round",
        targetPointsToWin: matchTargetPoints,
        selectedPathName: selectedPath?.name ?? null,
        selectedPathCategory: selectedPath?.category ?? null,
        orderedCards,
        currentCardIndex: 0,
        currentPlayerId: players[0].id,
        players,
        revealedPropositionIds: [],
        wrongPropositionIds: [],
        selectedPropositionId: null,
        decisionPendingPlayerId: null,
        wrongAnswerFeedback: null,
        pendingFreeTextValidation: null,
        winnerIds: [],
        suddenDeath: state.suddenDeath,
        suddenDeathDuration: state.suddenDeathDuration
      }
    });
    return null;
  },
  selectProposition: (propositionId) =>
    set((state) => {
      const match = state.matchState;
      if (!match || match.phase !== "in_round" || match.decisionPendingPlayerId) {
        return state;
      }
      const current = match.players.find((player) => player.id === match.currentPlayerId);
      if (!current || current.status !== "active" || match.revealedPropositionIds.includes(propositionId)) {
        return state;
      }
      return { matchState: { ...match, selectedPropositionId: propositionId } };
    }),
  answerSelectedProposition: (answer) =>
    set((state) => {
      const match = state.matchState;
      if (!match || match.phase !== "in_round" || !match.selectedPropositionId) {
        return state;
      }
      const card = getCurrentCard(match);
      const proposition = card.propositions.find((item) => item.id === match.selectedPropositionId);
      const current = match.players.find((player) => player.id === match.currentPlayerId);
      if (!proposition || !current || current.status !== "active") {
        return state;
      }
      const isCorrect = isAnswerCorrect(card.type, proposition.correctAnswer, answer);
      if (card.type === "free_text" && !isCorrect) {
        return {
          matchState: {
            ...match,
            pendingFreeTextValidation: {
              propositionId: proposition.id,
              submittedAnswer: answer.trim(),
              expectedAnswer: proposition.correctAnswer
            }
          }
        };
      }
      if (isCorrect) {
        const updatedPlayers = match.players.map((player) =>
          player.id === current.id ? { ...player, tempScore: player.tempScore + 1 } : player
        );
        const updated: MatchState = {
          ...match,
          players: updatedPlayers,
          revealedPropositionIds: [...match.revealedPropositionIds, proposition.id],
          selectedPropositionId: null,
          decisionPendingPlayerId: current.id,
          wrongAnswerFeedback: null,
          pendingFreeTextValidation: null
        };
        if (updated.players.some((player) => player.totalScore + player.tempScore >= updated.targetPointsToWin)) {
          return { matchState: finishMatchIfNeeded(updated) };
        }
        return { matchState: resolveRoundIfEnded(updated) };
      }
      const updatedPlayers = match.players.map((player) =>
        player.id === current.id ? { ...player, tempScore: 0, status: "eliminated" as const } : player
      );
      const pendingMatch: MatchState = {
        ...match,
        players: updatedPlayers,
        revealedPropositionIds: [...match.revealedPropositionIds, proposition.id],
        wrongPropositionIds: [...match.wrongPropositionIds, proposition.id],
        selectedPropositionId: null,
        decisionPendingPlayerId: null,
        wrongAnswerFeedback: null,
        pendingFreeTextValidation: null
      };
      const nextPlayerId = getNextActivePlayerId(pendingMatch, current.id);
      return {
        matchState: {
          ...pendingMatch,
          wrongAnswerFeedback: {
            message: `Mauvaise réponse pour "${proposition.text}".`,
            nextPlayerId,
            propositionId: proposition.id,
            propositionText: proposition.text,
            correctAnswer:
              card.type === "true_false"
                ? proposition.correctAnswer === "true"
                  ? "Vrai"
                  : "Faux"
                : proposition.correctAnswer
          }
        }
      };
    }),
  validateFreeTextAsCorrect: () =>
    set((state) => {
      const match = state.matchState;
      if (!match || match.phase !== "in_round" || !match.pendingFreeTextValidation || !match.selectedPropositionId) {
        return state;
      }
      const current = match.players.find((player) => player.id === match.currentPlayerId);
      if (!current || current.status !== "active") {
        return state;
      }
      const updatedPlayers = match.players.map((player) =>
        player.id === current.id ? { ...player, tempScore: player.tempScore + 1 } : player
      );
      const updated: MatchState = {
        ...match,
        players: updatedPlayers,
        revealedPropositionIds: [...match.revealedPropositionIds, match.pendingFreeTextValidation.propositionId],
        selectedPropositionId: null,
        decisionPendingPlayerId: current.id,
        wrongAnswerFeedback: null,
        pendingFreeTextValidation: null
      };
      if (updated.players.some((player) => player.totalScore + player.tempScore >= updated.targetPointsToWin)) {
        return { matchState: finishMatchIfNeeded(updated) };
      }
      return { matchState: resolveRoundIfEnded(updated) };
    }),
  validateFreeTextAsWrong: () =>
    set((state) => {
      const match = state.matchState;
      if (!match || match.phase !== "in_round" || !match.pendingFreeTextValidation) {
        return state;
      }
      const current = match.players.find((player) => player.id === match.currentPlayerId);
      if (!current || current.status !== "active") {
        return state;
      }
      const pending = match.pendingFreeTextValidation;
      const card = getCurrentCard(match);
      const proposition = card.propositions.find((item) => item.id === pending.propositionId);
      const updatedPlayers = match.players.map((player) =>
        player.id === current.id ? { ...player, tempScore: 0, status: "eliminated" as const } : player
      );
      const pendingMatch: MatchState = {
        ...match,
        players: updatedPlayers,
        revealedPropositionIds: [...match.revealedPropositionIds, pending.propositionId],
        wrongPropositionIds: [...match.wrongPropositionIds, pending.propositionId],
        selectedPropositionId: null,
        decisionPendingPlayerId: null,
        wrongAnswerFeedback: null,
        pendingFreeTextValidation: null
      };
      const nextPlayerId = getNextActivePlayerId(pendingMatch, current.id);
      return {
        matchState: {
          ...pendingMatch,
          wrongAnswerFeedback: {
            message: "Mauvaise réponse.",
            nextPlayerId,
            propositionId: pending.propositionId,
            propositionText: proposition?.text ?? "",
            correctAnswer: pending.expectedAnswer
          }
        }
      };
    }),
  secureAndStopTurn: () =>
    set((state) => {
      const match = state.matchState;
      if (!match || match.phase !== "in_round" || !match.decisionPendingPlayerId) {
        return state;
      }
      const playerId = match.decisionPendingPlayerId;
      const updatedPlayers = match.players.map((player) =>
        player.id === playerId
          ? { ...player, totalScore: player.totalScore + player.tempScore, tempScore: 0, status: "stopped" as const }
          : player
      );
      const updated = resolveRoundIfEnded({
        ...match,
        players: updatedPlayers,
        decisionPendingPlayerId: null,
        selectedPropositionId: null
      });
      if (updated.phase !== "in_round") {
        return { matchState: updated };
      }
      const nextPlayerId = getNextActivePlayerId(updated, playerId);
      return { matchState: nextPlayerId ? { ...updated, currentPlayerId: nextPlayerId } : updated };
    }),
  riskAndContinueTurn: () =>
    set((state) => {
      const match = state.matchState;
      if (!match || match.phase !== "in_round" || !match.decisionPendingPlayerId) {
        return state;
      }
      const samePlayer = match.players.find((player) => player.id === match.decisionPendingPlayerId);
      if (!samePlayer || samePlayer.status !== "active") {
        return state;
      }
      return {
        matchState: {
          ...match,
          // Continue means the exact same player keeps the turn.
          currentPlayerId: match.decisionPendingPlayerId,
          decisionPendingPlayerId: null
        }
      };
    }),
  acknowledgeWrongAnswerFeedback: () =>
    set((state) => {
      const match = state.matchState;
      if (!match || !match.wrongAnswerFeedback) {
        return state;
      }
      const cleared: MatchState = {
        ...match,
        wrongAnswerFeedback: null,
        pendingFreeTextValidation: null
      };
      const resolved = resolveRoundIfEnded(cleared);
      if (resolved.phase !== "in_round") {
        return { matchState: resolved };
      }
      return {
        matchState: {
          ...resolved,
          currentPlayerId: match.wrongAnswerFeedback.nextPlayerId ?? resolved.currentPlayerId
        }
      };
    }),
  forfeitTurnAsTimeout: () =>
    set((state) => {
      const match = state.matchState;
      if (
        !match ||
        match.phase !== "in_round" ||
        match.decisionPendingPlayerId ||
        match.wrongAnswerFeedback ||
        match.pendingFreeTextValidation
      ) {
        return state;
      }
      const current = match.players.find((player) => player.id === match.currentPlayerId);
      if (!current || current.status !== "active") {
        return state;
      }
      const card = getCurrentCard(match);
      const proposition = match.selectedPropositionId
        ? card.propositions.find((item) => item.id === match.selectedPropositionId) ?? null
        : null;
      const updatedPlayers = match.players.map((player) =>
        player.id === current.id ? { ...player, tempScore: 0, status: "eliminated" as const } : player
      );
      const revealedIds = proposition
        ? [...match.revealedPropositionIds, proposition.id]
        : match.revealedPropositionIds;
      const wrongIds = proposition
        ? [...match.wrongPropositionIds, proposition.id]
        : match.wrongPropositionIds;
      const pendingMatch: MatchState = {
        ...match,
        players: updatedPlayers,
        revealedPropositionIds: revealedIds,
        wrongPropositionIds: wrongIds,
        selectedPropositionId: null,
        decisionPendingPlayerId: null,
        wrongAnswerFeedback: null,
        pendingFreeTextValidation: null
      };
      const nextPlayerId = getNextActivePlayerId(pendingMatch, current.id);
      const correctAnswerLabel = proposition
        ? card.type === "true_false"
          ? proposition.correctAnswer === "true"
            ? "Vrai"
            : "Faux"
          : proposition.correctAnswer
        : "";
      return {
        matchState: {
          ...pendingMatch,
          wrongAnswerFeedback: {
            message: TIMEOUT_FEEDBACK_MESSAGE,
            nextPlayerId,
            propositionId: proposition?.id ?? "",
            propositionText: proposition?.text ?? "",
            correctAnswer: correctAnswerLabel
          }
        }
      };
    }),
  continueAfterRound: () =>
    set((state) => {
      const match = state.matchState;
      if (!match || match.phase !== "round_summary") {
        return state;
      }
      const nextIndex = match.currentCardIndex + 1;
      if (nextIndex >= match.orderedCards.length) {
        return { matchState: finishMatchIfNeeded({ ...match, currentCardIndex: nextIndex - 1 }) };
      }
      const nextPlayers = match.players.map((player) => ({ ...player, tempScore: 0, status: "active" as const }));
      const finisherIndex = nextPlayers.findIndex((player) => player.id === match.currentPlayerId);
      const nextStarterIndex = finisherIndex < 0 ? 0 : (finisherIndex + 1) % nextPlayers.length;
      return {
        matchState: {
          ...match,
          phase: "in_round",
          currentCardIndex: nextIndex,
          currentPlayerId: nextPlayers[nextStarterIndex].id,
          players: nextPlayers,
          revealedPropositionIds: [],
          wrongPropositionIds: [],
          selectedPropositionId: null,
          decisionPendingPlayerId: null,
          wrongAnswerFeedback: null,
          pendingFreeTextValidation: null
        }
      };
    }),
  proceedToFinalRanking: () =>
    set((state) => {
      const match = state.matchState;
      if (!match || match.phase !== "match_complete") {
        return state;
      }
      return { matchState: { ...match, phase: "finished" } };
    }),
  terminateMatch: () => set({ matchState: null }),
  addCard: (title, type, propositions, choices) => {
    const validationError = validateCardDraft(type, propositions, choices);
    if (validationError) {
      return validationError;
    }
    if (!title.trim()) {
      return "Le titre de la carte est obligatoire.";
    }
    if (
      propositions.length !== 10 ||
      propositions.some((proposition) => !proposition.text.trim() || !proposition.correctAnswer.trim())
    ) {
      return "Les 10 propositions doivent être renseignées.";
    }
    const state = get();
    const normalizedTitle = title.trim().toLowerCase();
    if (
      state.cards.some(
        (card) =>
          card.title.trim().toLowerCase() === normalizedTitle &&
          card.type === type &&
          sameAnswerSet(card.propositions, propositions)
      )
    ) {
      return "Une carte identique (même titre, type et réponses) existe déjà.";
    }
    const trimmedChoices = type === "choice" && choices ? choices.map((choice) => choice.trim()) : undefined;
    const updatedCards = [...state.cards, createCard(title, type, propositions, trimmedChoices)];
    saveCards(updatedCards);
    set({ cards: updatedCards });
    return null;
  },
  updateCard: (cardId, title, type, propositions, choices) => {
    const validationError = validateCardDraft(type, propositions, choices);
    if (validationError) {
      return validationError;
    }
    if (!title.trim()) {
      return "Le titre de la carte est obligatoire.";
    }
    if (
      propositions.length !== 10 ||
      propositions.some((proposition) => !proposition.text.trim() || !proposition.correctAnswer.trim())
    ) {
      return "Les 10 propositions doivent être renseignées.";
    }
    const state = get();
    const normalizedTitle = title.trim().toLowerCase();
    if (
      state.cards.some(
        (card) =>
          card.id !== cardId &&
          card.title.trim().toLowerCase() === normalizedTitle &&
          card.type === type &&
          sameAnswerSet(card.propositions, propositions)
      )
    ) {
      return "Une autre carte identique (même titre, type et réponses) existe déjà.";
    }
    const trimmedChoices = type === "choice" && choices ? choices.map((choice) => choice.trim()) : undefined;
    const updatedCards = state.cards.map((card) =>
      card.id === cardId
        ? {
            ...card,
            title: title.trim(),
            type,
            choices: trimmedChoices,
            propositions: card.propositions.map((item, index) => ({
              ...item,
              text: propositions[index].text.trim(),
              correctAnswer: propositions[index].correctAnswer
            }))
          }
        : card
    );
    saveCards(updatedCards);
    set({ cards: updatedCards });
    return null;
  },
  deleteCard: (cardId) =>
    set((state) => {
      const updatedCards = state.cards.filter((card) => card.id !== cardId);
      const updatedPaths = state.savedPaths.map((path) => ({
        ...path,
        cardIds: path.cardIds.filter((id) => id !== cardId)
      }));
      saveCards(updatedCards);
      savePaths(updatedPaths);
      return {
        cards: updatedCards,
        savedPaths: updatedPaths,
        selectedCardIdsForMatch: state.selectedCardIdsForMatch.filter((id) => id !== cardId)
      };
    }),
  exportCards: (subset) => exportCards(subset ?? get().cards),
  importCards: (raw) => {
    const imported = importCardsFromJson(raw);
    if (!imported) {
      return false;
    }
    const state = get();
    const importedAsAdditions = imported.map(cloneImportedCardWithNewIds);
    const updatedCards = [...state.cards, ...importedAsAdditions];
    saveCards(updatedCards);
    set({ cards: updatedCards });
    return true;
  }
}));
