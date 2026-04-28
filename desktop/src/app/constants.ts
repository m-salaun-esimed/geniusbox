import { COLOR_PALETTE, QuestionType } from '../game-engine/types';

export const DEFAULT_ANSWER_BY_TYPE: Record<QuestionType, string> = {
  true_false: 'true',
  ranking: '1',
  choice: 'homme',
  free_text: '',
  free_number: '0',
  free_color: COLOR_PALETTE[0].id,
};

export const DEFAULT_CHOICES: string[] = ['homme', 'femme'];
export const MIN_CHOICES = 2;
export const MAX_CHOICES = 3;

export const EMPTY_PROPOSITIONS = (type: QuestionType) =>
  Array.from({ length: 10 }, () => ({ text: '', correctAnswer: DEFAULT_ANSWER_BY_TYPE[type] }));

export const STEPS = ['Joueurs', 'Cartes', 'Mode'] as const;
