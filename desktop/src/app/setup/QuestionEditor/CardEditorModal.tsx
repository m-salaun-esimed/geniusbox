import { createPortal } from 'react-dom';
import { QuestionType } from '../../../game-engine/types';
import { ColorSelect } from '../../components/ColorSelect';
import { QuestionTypeSelect } from '../../components/QuestionTypeSelect';
import {
  DEFAULT_ANSWER_BY_TYPE,
  DEFAULT_CHOICES,
  MIN_CHOICES,
} from '../../constants';

type Proposition = { text: string; correctAnswer: string };

type CardEditorModalProps = {
  mode: 'create' | 'edit';
  isOpen: boolean;
  modalError: string;
  title: string;
  setTitle: (value: string) => void;
  questionType: QuestionType;
  setQuestionType: (value: QuestionType) => void;
  choices: string[];
  setChoices: React.Dispatch<React.SetStateAction<string[]>>;
  propositions: Proposition[];
  setPropositions: React.Dispatch<React.SetStateAction<Proposition[]>>;
  onClose: () => void;
  onSubmit: () => void;
};

export const CardEditorModal = ({
  mode,
  isOpen,
  modalError,
  title,
  setTitle,
  questionType,
  setQuestionType,
  choices,
  setChoices,
  propositions,
  setPropositions,
  onClose,
  onSubmit,
}: CardEditorModalProps) => {
  if (!isOpen) {
    return null;
  }

  const updateProposition = (index: number, text: string) => {
    setPropositions((previous) =>
      previous.map((proposition, currentIndex) =>
        currentIndex === index ? { ...proposition, text } : proposition,
      ),
    );
  };

  const updatePropositionAnswer = (index: number, value: string) => {
    setPropositions((previous) =>
      previous.map((proposition, currentIndex) =>
        currentIndex === index ? { ...proposition, correctAnswer: value } : proposition,
      ),
    );
  };

  const updateChoice = (index: number, value: string) => {
    const previousValue = choices[index];
    setChoices((previous) => {
      const updated = [...previous];
      updated[index] = value;
      return updated;
    });
    if (questionType !== 'choice') {
      return;
    }
    setPropositions((previous) =>
      previous.map((proposition) => {
        const answer = proposition.correctAnswer.trim();
        if (answer === previousValue) {
          return { ...proposition, correctAnswer: value };
        }
        if (!choices.includes(answer)) {
          return { ...proposition, correctAnswer: value || choices[0] };
        }
        return proposition;
      }),
    );
  };

  const setChoiceCount = (nextCount: number) => {
    if (nextCount < MIN_CHOICES || nextCount > 3) {
      return;
    }
    setChoices((previous) => {
      if (previous.length === nextCount) {
        return previous;
      }
      if (nextCount < previous.length) {
        return previous.slice(0, nextCount);
      }
      const padded = [...previous];
      while (padded.length < nextCount) {
        padded.push('');
      }
      return padded;
    });
    if (questionType !== 'choice') {
      return;
    }
    setPropositions((previous) =>
      previous.map((proposition) => {
        const remaining = choices.slice(0, nextCount).filter((choice) => choice.trim().length > 0);
        if (remaining.length === 0) {
          return proposition;
        }
        return remaining.includes(proposition.correctAnswer.trim())
          ? proposition
          : { ...proposition, correctAnswer: remaining[0] };
      }),
    );
  };

  return createPortal(
    <div className='modal-backdrop' onClick={onClose}>
      <div
        className='modal-card modal-card--framed'
        onClick={(event) => event.stopPropagation()}
      >
        <header className='modal-header'>
          <div className='modal-header-text'>
            <h3>{mode === 'create' ? 'Nouvelle carte' : 'Modifier la carte'}</h3>
            <p className='modal-subtitle'>
              {mode === 'create'
                ? 'Définis le type de question et renseigne les 10 propositions de la carte.'
                : 'Met à jour le titre, le type ou les propositions de cette carte.'}
            </p>
          </div>
          <button type='button' className='modal-close' aria-label='Fermer' onClick={onClose}>
            ×
          </button>
        </header>
        <div className='modal-body'>
          {modalError ? <div className='modal-alert'>{modalError}</div> : null}
          <label htmlFor='title-input'>Titre de la carte</label>
          <input
            id='title-input'
            value={title}
            placeholder="Ex: Cette invention vient-elle d'un homme ou d'une femme ?"
            onChange={(event) => setTitle(event.target.value)}
          />
          <label htmlFor='type-input'>Type de question</label>
          <QuestionTypeSelect
            value={questionType}
            onChange={(nextType) => {
              setQuestionType(nextType);
              if (nextType === 'choice') {
                setChoices((previous) =>
                  previous.length >= MIN_CHOICES && previous.every((choice) => choice.trim().length > 0)
                    ? previous
                    : DEFAULT_CHOICES,
                );
              }
              setPropositions((previous) =>
                previous.map((proposition) => ({
                  ...proposition,
                  correctAnswer:
                    nextType === 'choice'
                      ? (choices[0]?.trim() || DEFAULT_CHOICES[0])
                      : DEFAULT_ANSWER_BY_TYPE[nextType],
                })),
              );
            }}
          />
          <label>10 propositions</label>
          {questionType === 'choice' ? (
            <div className='choices-editor'>
              <div className='choices-editor-field'>
                <span className='choices-editor-label'>Nombre de choix</span>
                <div className='choice-count-segment' role='radiogroup' aria-label='Nombre de choix'>
                  {[2, 3].map((count) => (
                    <button
                      key={`choice_count_${count}`}
                      type='button'
                      role='radio'
                      aria-checked={choices.length === count}
                      className={
                        choices.length === count
                          ? 'choice-count-pill is-active'
                          : 'choice-count-pill'
                      }
                      onClick={() => setChoiceCount(count)}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
              <div className='choices-editor-field'>
                <span className='choices-editor-label'>Réponses possibles</span>
                <div className='choices-inputs'>
                  {choices.map((choice, index) => (
                    <label
                      key={`choice_input_${index}`}
                      className='choice-input-row'
                    >
                      <span className='choice-input-badge'>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <input
                        value={choice}
                        placeholder={`Choix ${String.fromCharCode(65 + index)}`}
                        onChange={(event) => updateChoice(index, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <div className='propositions-grid'>
            {propositions.map((proposition, index) => (
              <div key={`prop_${index}`} className='proposition-row'>
                <span>{index + 1}.</span>
                <input
                  value={proposition.text}
                  placeholder='Ex: Monopoly'
                  onChange={(event) => updateProposition(index, event.target.value)}
                />
                {questionType === 'true_false' ||
                questionType === 'ranking' ||
                questionType === 'choice' ? (
                  <select
                    value={proposition.correctAnswer}
                    onChange={(event) => updatePropositionAnswer(index, event.target.value)}
                  >
                    {questionType === 'true_false' ? (
                      <>
                        <option value='true'>Vrai</option>
                        <option value='false'>Faux</option>
                      </>
                    ) : null}
                    {questionType === 'ranking'
                      ? Array.from({ length: 10 }, (_, idx) => (
                          <option key={`ranking_${idx + 1}`} value={String(idx + 1)}>
                            Position {idx + 1}
                          </option>
                        ))
                      : null}
                    {questionType === 'choice'
                      ? choices.map((choice, choiceIndex) => (
                          <option key={`choice_opt_${choiceIndex}`} value={choice}>
                            {choice || `Choix ${String.fromCharCode(65 + choiceIndex)}`}
                          </option>
                        ))
                      : null}
                  </select>
                ) : null}
                {questionType === 'free_text' ? (
                  <input
                    value={proposition.correctAnswer}
                    placeholder='Réponse attendue (ex: Sao Paulo)'
                    onChange={(event) => updatePropositionAnswer(index, event.target.value)}
                  />
                ) : null}
                {questionType === 'free_number' ? (
                  <input
                    type='number'
                    step='any'
                    value={proposition.correctAnswer}
                    placeholder='Ex: 1789'
                    onChange={(event) => updatePropositionAnswer(index, event.target.value)}
                  />
                ) : null}
                {questionType === 'free_color' ? (
                  <ColorSelect
                    value={proposition.correctAnswer}
                    onChange={(next) => updatePropositionAnswer(index, next)}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <footer className='modal-footer'>
          <button type='button' onClick={onClose}>
            Annuler
          </button>
          <button type='button' className='primary-button' onClick={onSubmit}>
            {mode === 'create' ? 'Valider la carte' : 'Enregistrer'}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
};
