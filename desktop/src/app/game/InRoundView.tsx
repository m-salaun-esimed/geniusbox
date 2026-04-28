import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store';
import { createSoundEffects } from '../soundEffects';
import { COLOR_PALETTE } from '../../game-engine/types';
import { QUESTION_TYPE_COLOR, QUESTION_TYPE_LABELS } from '../questionTypeColors';
import { DEFAULT_CHOICES } from '../constants';
import { EndMatchConfirmModal } from '../components/EndMatchConfirmModal';

type InRoundViewProps = {
  onConfirmEndMatch: () => void;
  endMatchConfirmOpen: boolean;
  onCancelEndMatch: () => void;
  onAcceptEndMatch: () => void;
};

export const InRoundView = ({
  onConfirmEndMatch,
  endMatchConfirmOpen,
  onCancelEndMatch,
  onAcceptEndMatch,
}: InRoundViewProps) => {
  const {
    matchState,
    selectProposition,
    answerSelectedProposition,
    secureAndStopTurn,
    riskAndContinueTurn,
    acknowledgeWrongAnswerFeedback,
    validateFreeTextAsCorrect,
    validateFreeTextAsWrong,
  } = useAppStore();
  const sounds = useMemo(() => createSoundEffects(), []);
  const [textAnswer, setTextAnswer] = useState('');
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState(30);
  const previousDecisionPlayerRef = useRef<string | null>(null);

  useEffect(() => {
    setTextAnswer('');
  }, [matchState?.selectedPropositionId, matchState?.currentCardIndex]);

  useEffect(() => {
    const currentDecisionPlayerId = matchState?.decisionPendingPlayerId ?? null;
    if (currentDecisionPlayerId && currentDecisionPlayerId !== previousDecisionPlayerRef.current) {
      sounds.correct();
    }
    previousDecisionPlayerRef.current = currentDecisionPlayerId;
  }, [matchState?.decisionPendingPlayerId, sounds]);

  useEffect(() => {
    if (timerRemaining === null || timerRemaining <= 0) {
      return;
    }
    const interval = window.setInterval(() => {
      setTimerRemaining((previous) => {
        if (previous === null) {
          return null;
        }
        const next = previous - 1;
        if (next <= 0) {
          sounds.timerEnd();
          return 0;
        }
        sounds.timerTick();
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRemaining, sounds]);

  if (!matchState || matchState.phase !== 'in_round') {
    return null;
  }

  const card = matchState.orderedCards[matchState.currentCardIndex];
  const cardChoices = card.choices && card.choices.length > 0 ? card.choices : DEFAULT_CHOICES;
  const currentPlayer = matchState.players.find(
    (player) => player.id === matchState.currentPlayerId,
  );
  const selectedProposition =
    card.propositions.find((prop) => prop.id === matchState.selectedPropositionId) ?? null;
  const decisionPlayer =
    matchState.players.find((player) => player.id === matchState.decisionPendingPlayerId) ?? null;
  const wrongFeedback = matchState.wrongAnswerFeedback;
  const pendingFreeTextValidation = matchState.pendingFreeTextValidation;

  if (!currentPlayer) {
    return null;
  }

  const answerInputsDisabled =
    !selectedProposition || Boolean(decisionPlayer) || Boolean(wrongFeedback);

  return (
    <main>
      <section className='editor-card game-shell'>
        <header className='editor-header'>
          <h1>Smart10 — Partie</h1>
          <p>
            Carte {matchState.currentCardIndex + 1} / {matchState.orderedCards.length}
            {matchState.targetPointsToWin >= Number.MAX_SAFE_INTEGER
              ? ' · Mode Flash'
              : ` · Objectif ${matchState.targetPointsToWin}`}
          </p>
        </header>

        <div
          className='panel game-question-panel has-type-stripe'
          style={{ ['--type-color' as string]: QUESTION_TYPE_COLOR[card.type].hex }}
        >
          <div className='timer-controls'>
            <div
              className={`timer-pill ${timerRemaining !== null && timerRemaining <= 5 ? 'is-danger' : ''}`}
            >
              Timer: {timerRemaining === null ? 'Arrêté' : `${timerRemaining}s`}
            </div>
            <div className='points-selector'>
              {[15, 30, 45].map((value) => (
                <button
                  key={`in_game_timer_${value}`}
                  type='button'
                  className={
                    timerDuration === value ? 'points-button is-active' : 'points-button'
                  }
                  onClick={() => setTimerDuration(value)}
                >
                  {value}s
                </button>
              ))}
            </div>
            <div className='inline-actions'>
              <button
                type='button'
                className='primary-button'
                onClick={() => {
                  setTimerRemaining(timerDuration);
                  sounds.navigate();
                }}
                disabled={Boolean(decisionPlayer) || Boolean(wrongFeedback)}
              >
                Déclencher le timer
              </button>
              <button
                type='button'
                onClick={() => setTimerRemaining(null)}
                disabled={timerRemaining === null}
              >
                Stop
              </button>
            </div>
          </div>
          <div className='tiny-label'>Joueur actif</div>
          <h2>{currentPlayer.name}</h2>
          <p className='question-title'>{card.title}</p>
          <div className='game-question-type-row'>
            <span className='type-badge' title={QUESTION_TYPE_LABELS[card.type]}>
              <span className='type-badge-dot' aria-hidden='true' />
              {QUESTION_TYPE_LABELS[card.type]}
            </span>
          </div>
          <ul className='question-list propositions-live-grid'>
            {card.propositions.map((proposition) => {
              const isRevealed = matchState.revealedPropositionIds.includes(proposition.id);
              const isSelected = proposition.id === matchState.selectedPropositionId;
              return (
                <li
                  key={proposition.id}
                  className={`${isSelected ? 'card-item is-active' : 'card-item'} ${isRevealed ? 'is-revealed' : ''}`}
                  onClick={() => {
                    if (!isRevealed && !decisionPlayer && !wrongFeedback) {
                      sounds.click();
                      selectProposition(proposition.id);
                    }
                  }}
                >
                  <div className='card-item-content'>
                    <strong>{proposition.text}</strong>
                    <span>{isRevealed ? 'Déjà répondu' : 'Clique pour répondre'}</span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className='answer-actions'>
            {card.type === 'true_false' ? (
              <>
                <button
                  type='button'
                  className='primary-button'
                  onClick={() => {
                    if (selectedProposition && !decisionPlayer && !wrongFeedback) {
                      answerSelectedProposition('true');
                    }
                  }}
                  disabled={answerInputsDisabled}
                >
                  Vrai
                </button>
                <button
                  type='button'
                  onClick={() => {
                    if (selectedProposition && !decisionPlayer && !wrongFeedback) {
                      answerSelectedProposition('false');
                    }
                  }}
                  disabled={answerInputsDisabled}
                >
                  Faux
                </button>
              </>
            ) : null}
            {card.type === 'ranking' ? (
              <>
                <input
                  type='number'
                  min={1}
                  max={10}
                  value={textAnswer}
                  placeholder='Position 1 à 10'
                  onChange={(event) => setTextAnswer(event.target.value)}
                  disabled={answerInputsDisabled}
                />
                <button
                  type='button'
                  className='primary-button'
                  onClick={() => {
                    if (!selectedProposition || !textAnswer) return;
                    answerSelectedProposition(textAnswer);
                    setTextAnswer('');
                  }}
                  disabled={answerInputsDisabled || !textAnswer}
                >
                  Valider le rang
                </button>
              </>
            ) : null}
            {card.type === 'choice'
              ? cardChoices.map((choice, index) => (
                  <button
                    key={`choice_btn_${index}`}
                    type='button'
                    className={index === 0 ? 'primary-button' : ''}
                    onClick={() => selectedProposition && answerSelectedProposition(choice)}
                    disabled={answerInputsDisabled}
                  >
                    {choice}
                  </button>
                ))
              : null}
            {card.type === 'free_text' ? (
              <>
                <input
                  value={textAnswer}
                  placeholder='Saisis ta réponse'
                  onChange={(event) => setTextAnswer(event.target.value)}
                  disabled={answerInputsDisabled}
                />
                <button
                  type='button'
                  className='primary-button'
                  onClick={() => {
                    if (!selectedProposition || !textAnswer.trim()) return;
                    answerSelectedProposition(textAnswer);
                  }}
                  disabled={answerInputsDisabled || !textAnswer.trim()}
                >
                  Valider
                </button>
              </>
            ) : null}
            {card.type === 'free_number' ? (
              <>
                <input
                  type='number'
                  step='any'
                  value={textAnswer}
                  placeholder='Saisis un nombre'
                  onChange={(event) => setTextAnswer(event.target.value)}
                  disabled={answerInputsDisabled}
                />
                <button
                  type='button'
                  className='primary-button'
                  onClick={() => {
                    if (!selectedProposition || !textAnswer.trim()) return;
                    answerSelectedProposition(textAnswer);
                  }}
                  disabled={answerInputsDisabled || !textAnswer.trim()}
                >
                  Valider
                </button>
              </>
            ) : null}
            {card.type === 'free_color' ? (
              <div className='color-picker color-picker-game'>
                {COLOR_PALETTE.map((entry) => (
                  <button
                    key={`game_color_${entry.id}`}
                    type='button'
                    className='color-pill'
                    style={{ backgroundColor: entry.hex }}
                    aria-label={entry.label}
                    title={entry.label}
                    onClick={() =>
                      selectedProposition && answerSelectedProposition(entry.id)
                    }
                    disabled={answerInputsDisabled}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className='panel'>
          <h3>Scores</h3>
          <ul className='score-list'>
            {matchState.players.map((player) => {
              const status =
                player.status === 'active'
                  ? 'actif'
                  : player.status === 'stopped'
                    ? 'stop'
                    : 'éliminé';
              return (
                <li key={player.id}>
                  <span>
                    {player.name} ({status})
                  </span>
                  <strong>{player.totalScore}</strong>
                </li>
              );
            })}
          </ul>
          <div className='bottom-right-actions'>
            <button type='button' className='danger-button' onClick={onConfirmEndMatch}>
              Terminer la partie
            </button>
          </div>
        </div>
      </section>
      {decisionPlayer ? (
        <div className='modal-backdrop'>
          <div className='modal-card decision-modal'>
            <h3>Bonne réponse</h3>
            <p>
              <strong>{decisionPlayer.name}</strong> a maintenant {decisionPlayer.tempScore}{' '}
              point(s) temporaire(s).
            </p>
            <p>Tu veux capitaliser tes points ou continuer pour en gagner d'autres ?</p>
            <div className='modal-actions'>
              <button
                type='button'
                className='primary-button'
                onClick={() => {
                  sounds.secure();
                  secureAndStopTurn();
                }}
              >
                Capitaliser
              </button>
              <button
                type='button'
                onClick={() => {
                  sounds.risk();
                  riskAndContinueTurn();
                }}
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {wrongFeedback ? (
        <div className='modal-backdrop'>
          <div className='modal-card decision-modal'>
            <h3>Réponse fausse</h3>
            <p>{wrongFeedback.message}</p>
            <p>Cette proposition est désormais marquée comme déjà répondue.</p>
            <div className='modal-actions'>
              <button
                type='button'
                className='primary-button'
                onClick={() => {
                  sounds.navigate();
                  acknowledgeWrongAnswerFeedback();
                }}
              >
                Tour suivant
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {pendingFreeTextValidation ? (
        <div className='modal-backdrop'>
          <div className='modal-card decision-modal'>
            <h3>Réponse libre à confirmer</h3>
            <p>Réponse saisie: {pendingFreeTextValidation.submittedAnswer || '(vide)'}</p>
            <p>Réponse attendue: {pendingFreeTextValidation.expectedAnswer}</p>
            <p>Tu peux valider manuellement même si ce n'est pas identique.</p>
            <div className='modal-actions'>
              <button
                type='button'
                className='primary-button'
                onClick={() => {
                  sounds.correct();
                  validateFreeTextAsCorrect();
                }}
              >
                Valider quand même (+1)
              </button>
              <button
                type='button'
                onClick={() => {
                  sounds.wrong();
                  validateFreeTextAsWrong();
                }}
              >
                Compter comme faux
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <EndMatchConfirmModal
        open={endMatchConfirmOpen}
        onCancel={onCancelEndMatch}
        onConfirm={onAcceptEndMatch}
      />
    </main>
  );
};
