export type TfAnswer = "true" | "false";
export type QuestionType =
  | "true_false"
  | "ranking"
  | "choice"
  | "free_text"
  | "free_number"
  | "free_color";

export interface ColorPaletteEntry {
  id: string;
  label: string;
  hex: string;
}

export const COLOR_PALETTE: readonly ColorPaletteEntry[] = [
  { id: "rouge", label: "Rouge", hex: "#e53935" },
  { id: "bleu", label: "Bleu", hex: "#1e88e5" },
  { id: "vert", label: "Vert", hex: "#43a047" },
  { id: "jaune", label: "Jaune", hex: "#fdd835" },
  { id: "orange", label: "Orange", hex: "#fb8c00" },
  { id: "violet", label: "Violet", hex: "#8e24aa" },
  { id: "rose", label: "Rose", hex: "#ec407a" },
  { id: "noir", label: "Noir", hex: "#212121" },
  { id: "blanc", label: "Blanc", hex: "#fafafa" },
  { id: "gris", label: "Gris", hex: "#757575" },
] as const;

export const COLOR_PALETTE_IDS: readonly string[] = COLOR_PALETTE.map((entry) => entry.id);

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface TfQuestion {
  id: string;
  prompt: string;
  correctAnswer: TfAnswer;
  category?: string;
}

export interface QuestionProposition {
  id: string;
  text: string;
  correctAnswer: string;
}

export interface QuestionCard {
  id: string;
  title: string;
  type: QuestionType;
  choices?: string[];
  propositions: QuestionProposition[];
}

export interface RoundState {
  questionId: string;
  currentPlayerIndex: number;
  attemptedByPlayerIds: string[];
  resolved: boolean;
}

export interface GameState {
  status: "setup" | "in_round" | "round_summary" | "finished";
  players: Player[];
  questions: TfQuestion[];
  pointsPerCorrect: number;
  usedQuestionIds: string[];
  round: number;
  maxRounds: number;
  activeRound: RoundState | null;
  winnerIds: string[];
}
