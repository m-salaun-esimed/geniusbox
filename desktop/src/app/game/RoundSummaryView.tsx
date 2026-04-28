import { useMemo } from 'react';
import { useAppStore } from '../store';
import { createSoundEffects } from '../soundEffects';
import { QUESTION_TYPE_COLOR, QUESTION_TYPE_LABELS } from '../questionTypeColors';
import { EndMatchConfirmModal } from '../components/EndMatchConfirmModal';

type RoundSummaryViewProps = {
  onConfirmEndMatch: () => void;
  endMatchConfirmOpen: boolean;
  onCancelEndMatch: () => void;
  onAcceptEndMatch: () => void;
};

export const RoundSummaryView = ({
  onConfirmEndMatch,
  endMatchConfirmOpen,
  onCancelEndMatch,
  onAcceptEndMatch,
}: RoundSummaryViewProps) => {
  const { matchState, continueAfterRound } = useAppStore();
  const sounds = useMemo(() => createSoundEffects(), []);

  if (!matchState || matchState.phase !== 'round_summary') {
    return null;
  }

  const card = matchState.orderedCards[matchState.currentCardIndex];

  return (
    <main>
      <section className='editor-card game-shell'>
        <header className='editor-header'>
          <h1>Fin de carte</h1>
          <p>Toutes les réponses de la carte sont affichées avant de passer à la suivante.</p>
        </header>
        <div
          className='panel has-type-stripe'
          style={{ ['--type-color' as string]: QUESTION_TYPE_COLOR[card.type].hex }}
        >
          <h3>Réponses de la carte</h3>
          <span className='type-badge' title={QUESTION_TYPE_LABELS[card.type]}>
            <span className='type-badge-dot' aria-hidden='true' />
            {QUESTION_TYPE_LABELS[card.type]}
          </span>
          <ul className='question-list propositions-live-grid'>
            {card.propositions.map((proposition) => {
              const wasFound = matchState.revealedPropositionIds.includes(proposition.id);
              return (
                <li
                  key={proposition.id}
                  className={wasFound ? 'card-item is-revealed' : 'card-item'}
                >
                  <div className='card-item-content'>
                    <strong>{proposition.text}</strong>
                    <span>
                      Réponse:{' '}
                      {card.type === 'true_false'
                        ? proposition.correctAnswer === 'true'
                          ? 'Vrai'
                          : 'Faux'
                        : proposition.correctAnswer}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <ul className='score-list'>
            {matchState.players.map((player) => (
              <li key={player.id}>
                <span>{player.name}</span>
                <strong>{player.totalScore}</strong>
              </li>
            ))}
          </ul>
          <div className='answer-actions'>
            <button
              type='button'
              className='primary-button'
              onClick={() => {
                sounds.navigate();
                continueAfterRound();
              }}
            >
              Carte suivante
            </button>
          </div>
          <div className='bottom-right-actions'>
            <button type='button' className='danger-button' onClick={onConfirmEndMatch}>
              Terminer la partie
            </button>
          </div>
        </div>
      </section>
      <EndMatchConfirmModal
        open={endMatchConfirmOpen}
        onCancel={onCancelEndMatch}
        onConfirm={onAcceptEndMatch}
      />
    </main>
  );
};
