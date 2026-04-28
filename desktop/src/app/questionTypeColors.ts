import { COLOR_PALETTE, ColorPaletteEntry, QuestionType } from '../game-engine/types';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  true_false: 'Vrai / Faux',
  ranking: 'Classement (1 à 10)',
  choice: 'Question fermée (2 ou 3 choix)',
  free_text: 'Réponse libre',
  free_number: 'Réponse libre (nombre)',
  free_color: 'Réponse libre (couleur)',
};

export const QUESTION_TYPE_DESCRIPTIONS: Record<QuestionType, string> = {
  true_false: 'Le joueur répond Vrai ou Faux.',
  ranking: 'Le joueur place une réponse de 1 à 10.',
  choice: 'Le joueur choisit parmi 2 ou 3 réponses possibles.',
  free_text: 'Le joueur saisit une réponse libre.',
  free_number: 'Le joueur saisit un nombre.',
  free_color: 'Le joueur sélectionne une couleur dans la palette.',
};

const colorById = (id: string): ColorPaletteEntry => {
  const entry = COLOR_PALETTE.find((color) => color.id === id);
  if (!entry) {
    throw new Error(`Color "${id}" missing from COLOR_PALETTE`);
  }
  return entry;
};

export const QUESTION_TYPE_COLOR: Record<QuestionType, ColorPaletteEntry> = {
  true_false: colorById('orange'),
  ranking: colorById('vert'),
  free_text: colorById('bleu'),
  choice: colorById('violet'),
  free_number: colorById('jaune'),
  free_color: colorById('rose'),
};

export const QUESTION_TYPE_ORDER: QuestionType[] = [
  'true_false',
  'ranking',
  'choice',
  'free_text',
  'free_number',
  'free_color',
];
