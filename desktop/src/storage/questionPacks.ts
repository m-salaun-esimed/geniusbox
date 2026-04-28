import samplePackData from "../data/questions/sample-pack.json";
import {
  COLOR_PALETTE_IDS,
  QuestionCard,
  QuestionProposition,
  QuestionType,
  TfQuestion
} from "../game-engine/types";

const STORAGE_KEY = "smart10.cards";
const REQUIRED_PROPOSITION_COUNT = 10;
const QUESTION_TYPES: QuestionType[] = [
  "true_false",
  "ranking",
  "choice",
  "free_text",
  "free_number",
  "free_color"
];
const DEFAULT_CHOICES: string[] = ["homme", "femme"];
const MIN_CHOICE_COUNT = 2;
const MAX_CHOICE_COUNT = 3;

export const parseNumericAnswer = (value: string): number | null => {
  const cleaned = String(value ?? "").trim().replace(",", ".");
  if (!cleaned) {
    return null;
  }
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const sanitizeChoices = (choices: unknown): string[] | undefined => {
  if (!Array.isArray(choices)) {
    return undefined;
  }
  const trimmed = choices
    .map((choice) => String(choice ?? "").trim())
    .filter((choice) => choice.length > 0);
  if (trimmed.length < MIN_CHOICE_COUNT || trimmed.length > MAX_CHOICE_COUNT) {
    return undefined;
  }
  return trimmed;
};

const normalizeCard = (card: QuestionCard): QuestionCard => ({
  ...card,
  choices: card.type === "choice" ? sanitizeChoices(card.choices) : undefined
});

const validateProposition = (proposition: QuestionProposition): boolean => {
  return (
    Boolean(proposition.id.trim()) &&
    Boolean(proposition.text.trim()) &&
    Boolean(String(proposition.correctAnswer ?? "").trim())
  );
};

const validateCard = (card: QuestionCard): boolean => {
  if (!card.id.trim() || !card.title.trim()) {
    return false;
  }
  if (!QUESTION_TYPES.includes(card.type)) {
    return false;
  }
  if (card.type === "choice") {
    if (
      !Array.isArray(card.choices) ||
      card.choices.length < MIN_CHOICE_COUNT ||
      card.choices.length > MAX_CHOICE_COUNT ||
      card.choices.some((choice) => !String(choice).trim())
    ) {
      return false;
    }
  }
  if (!Array.isArray(card.propositions) || card.propositions.length !== REQUIRED_PROPOSITION_COUNT) {
    return false;
  }
  if (!card.propositions.every(validateProposition)) {
    return false;
  }
  if (card.type === "choice") {
    const validAnswers = new Set((card.choices ?? []).map((choice) => choice.trim()));
    if (card.propositions.some((proposition) => !validAnswers.has(String(proposition.correctAnswer).trim()))) {
      return false;
    }
  }
  if (card.type === "free_number") {
    if (card.propositions.some((proposition) => parseNumericAnswer(proposition.correctAnswer) === null)) {
      return false;
    }
  }
  if (card.type === "free_color") {
    if (
      card.propositions.some(
        (proposition) => !COLOR_PALETTE_IDS.includes(String(proposition.correctAnswer).trim().toLowerCase())
      )
    ) {
      return false;
    }
  }
  return true;
};

const validateQuestion = (question: TfQuestion): boolean => {
  const isAnswerValid = question.correctAnswer === "true" || question.correctAnswer === "false";
  return Boolean(question.id.trim()) && Boolean(question.prompt.trim()) && isAnswerValid;
};

export const createDefaultCards = (): QuestionCard[] =>
  (samplePackData as QuestionCard[]).map(normalizeCard).filter(validateCard);

export const loadCards = (): QuestionCard[] => {
  const rawValue = localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    const defaults = createDefaultCards();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return createDefaultCards();
    }

    const asCards = (parsed as QuestionCard[]).map(normalizeCard).filter(validateCard);
    if (asCards.length > 0) {
      return asCards;
    }

    // Legacy fallback if local storage still contains old flat-question shape.
    const asQuestions = (parsed as TfQuestion[]).filter(validateQuestion);
    if (asQuestions.length === REQUIRED_PROPOSITION_COUNT) {
      const migrated: QuestionCard = {
        id: `card_${crypto.randomUUID()}`,
        title: "Carte migree",
        type: "true_false",
        propositions: asQuestions.map((question) => ({
          id: `prop_${crypto.randomUUID()}`,
          text: question.prompt,
          correctAnswer: question.correctAnswer
        }))
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([migrated]));
      return [migrated];
    }
    const defaults = createDefaultCards();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  } catch (_error) {
    const defaults = createDefaultCards();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
};

export const saveCards = (cards: QuestionCard[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
};

export interface CardDraftProposition {
  text: string;
  correctAnswer: string;
}

export const createCard = (
  title: string,
  type: QuestionType,
  propositions: CardDraftProposition[],
  choices?: string[]
): QuestionCard => ({
  id: `card_${crypto.randomUUID()}`,
  title: title.trim(),
  type,
  choices: type === "choice" ? (choices ?? DEFAULT_CHOICES).map((choice) => choice.trim()) : undefined,
  propositions: propositions.map((proposition) => ({
    id: `prop_${crypto.randomUUID()}`,
    text: proposition.text.trim(),
    correctAnswer: proposition.correctAnswer
  }))
});

export const exportCards = (cards: QuestionCard[]): string => JSON.stringify(cards, null, 2);

export type DetailedValidationResult =
  | { valid: true; card: QuestionCard }
  | { valid: false; errors: string[] };

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const validateCardDetailed = (raw: unknown): DetailedValidationResult => {
  const errors: string[] = [];
  if (!isPlainObject(raw)) {
    return { valid: false, errors: ["Le JSON doit être un objet (pas un tableau)."] };
  }

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) {
    errors.push("Champ 'title' manquant ou vide.");
  }

  const type = raw.type;
  const isValidType = typeof type === "string" && QUESTION_TYPES.includes(type as QuestionType);
  if (!isValidType) {
    errors.push(`Champ 'type' invalide. Valeurs autorisées: ${QUESTION_TYPES.join(", ")}.`);
  }

  let normalizedChoices: string[] | undefined;
  if (isValidType && type === "choice") {
    const sanitized = sanitizeChoices(raw.choices);
    if (!sanitized) {
      errors.push(
        `Champ 'choices' invalide pour type=choice (attendu ${MIN_CHOICE_COUNT} à ${MAX_CHOICE_COUNT} valeurs non vides).`
      );
    } else {
      normalizedChoices = sanitized;
    }
  }

  const propositions = raw.propositions;
  if (!Array.isArray(propositions)) {
    errors.push("Champ 'propositions' manquant ou n'est pas un tableau.");
    return { valid: false, errors };
  }
  if (propositions.length !== REQUIRED_PROPOSITION_COUNT) {
    errors.push(`${REQUIRED_PROPOSITION_COUNT} propositions attendues, ${propositions.length} reçue(s).`);
  }

  const choiceSet = normalizedChoices ? new Set(normalizedChoices) : null;
  const normalizedPropositions: QuestionProposition[] = [];

  propositions.forEach((proposition, index) => {
    const position = index + 1;
    if (!isPlainObject(proposition)) {
      errors.push(`Proposition ${position} : objet invalide.`);
      return;
    }
    const text = typeof proposition.text === "string" ? proposition.text.trim() : "";
    const rawAnswer = proposition.correctAnswer;
    const answer = typeof rawAnswer === "string" || typeof rawAnswer === "number"
      ? String(rawAnswer).trim()
      : "";
    if (!text) {
      errors.push(`Proposition ${position} : champ 'text' manquant ou vide.`);
    }
    if (!answer) {
      errors.push(`Proposition ${position} : champ 'correctAnswer' manquant ou vide.`);
    }
    if (isValidType && answer) {
      if (type === "true_false" && answer !== "true" && answer !== "false") {
        errors.push(`Proposition ${position} : correctAnswer doit être "true" ou "false".`);
      }
      if (type === "ranking") {
        const numeric = Number.parseInt(answer, 10);
        if (!Number.isFinite(numeric) || numeric < 1 || numeric > 10 || String(numeric) !== answer) {
          errors.push(`Proposition ${position} : correctAnswer doit être un entier entre 1 et 10.`);
        }
      }
      if (type === "choice" && choiceSet && !choiceSet.has(answer)) {
        errors.push(
          `Proposition ${position} : correctAnswer "${answer}" n'est pas dans choices [${normalizedChoices?.join(", ")}].`
        );
      }
      if (type === "free_number" && parseNumericAnswer(answer) === null) {
        errors.push(`Proposition ${position} : correctAnswer doit être un nombre.`);
      }
      if (type === "free_color" && !COLOR_PALETTE_IDS.includes(answer.toLowerCase())) {
        errors.push(
          `Proposition ${position} : correctAnswer "${answer}" doit être une couleur (${COLOR_PALETTE_IDS.join(", ")}).`
        );
      }
    }
    const propositionId =
      typeof proposition.id === "string" && proposition.id.trim()
        ? proposition.id.trim()
        : `prop_${index + 1}`;
    normalizedPropositions.push({ id: propositionId, text, correctAnswer: answer });
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const card: QuestionCard = {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `card_${crypto.randomUUID()}`,
    title,
    type: type as QuestionType,
    choices: normalizedChoices,
    propositions: normalizedPropositions
  };
  return { valid: true, card };
};

export const importCardsFromJson = (raw: string): QuestionCard[] | null => {
  try {
    const candidate = JSON.parse(raw) as QuestionCard[];
    if (!Array.isArray(candidate)) {
      return null;
    }
    const cards = candidate.map(normalizeCard).filter(validateCard);
    if (cards.length === 0) {
      return null;
    }
    return cards;
  } catch (_error) {
    return null;
  }
};

export const flattenCardsToQuestions = (cards: QuestionCard[]): TfQuestion[] =>
  cards.flatMap((card) =>
    card.type === "true_false"
      ? card.propositions.map((proposition) => ({
          id: `${card.id}_${proposition.id}`,
          prompt: `${card.title} - ${proposition.text}`,
          correctAnswer: proposition.correctAnswer === "true" ? "true" : "false"
        }))
      : []
  );

export { DEFAULT_CHOICES, MIN_CHOICE_COUNT, MAX_CHOICE_COUNT };
