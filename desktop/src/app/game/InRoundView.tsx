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
  const [viewMode, setViewMode] = useState<'wheel' | 'list'>(() => {
    if (typeof window === 'undefined') return 'wheel';
    const stored = window.localStorage.getItem('smart10.inRoundViewMode');
    return stored === 'list' ? 'list' : 'wheel';
  });
  const previousDecisionPlayerRef = useRef<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem('smart10.inRoundViewMode', viewMode);
  }, [viewMode]);

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
          <div className='timer-bar'>
            <div
              className={`timer-pill ${timerRemaining !== null && timerRemaining <= 5 ? 'is-danger' : ''}`}
            >
              <svg
                viewBox='0 0 24 24'
                width='14'
                height='14'
                aria-hidden='true'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <circle cx='12' cy='13' r='8' />
                <path d='M12 9v4l2 2' />
                <path d='M9 2h6' />
              </svg>
              {timerRemaining === null ? 'Arrêté' : `${timerRemaining}s`}
            </div>
            <div className='points-selector timer-points'>
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
            <div className='timer-icon-actions'>
              <button
                type='button'
                className='icon-button icon-button-primary'
                title='Déclencher le timer'
                aria-label='Déclencher le timer'
                onClick={() => {
                  setTimerRemaining(timerDuration);
                  sounds.navigate();
                }}
                disabled={Boolean(decisionPlayer) || Boolean(wrongFeedback)}
              >
                <svg viewBox='0 0 24 24' width='14' height='14' aria-hidden='true' fill='currentColor'>
                  <path d='M8 5.5v13a1 1 0 0 0 1.55.83l10-6.5a1 1 0 0 0 0-1.66l-10-6.5A1 1 0 0 0 8 5.5z' />
                </svg>
              </button>
              <button
                type='button'
                className='icon-button'
                title='Arrêter le timer'
                aria-label='Arrêter le timer'
                onClick={() => setTimerRemaining(null)}
                disabled={timerRemaining === null}
              >
                <svg viewBox='0 0 24 24' width='14' height='14' aria-hidden='true' fill='currentColor'>
                  <rect x='6' y='6' width='12' height='12' rx='1.5' />
                </svg>
              </button>
            </div>
          </div>
          <div className='game-meta-row'>
            <div className='player-pill'>
              <span className='tiny-label'>Joueur actif</span>
              <strong>{currentPlayer.name}</strong>
            </div>
            <span className='type-badge' title={QUESTION_TYPE_LABELS[card.type]}>
              <span className='type-badge-dot' aria-hidden='true' />
              {QUESTION_TYPE_LABELS[card.type]}
            </span>
            <div className='view-mode-toggle' role='tablist' aria-label='Mode d’affichage'>
              <button
                type='button'
                role='tab'
                aria-selected={viewMode === 'wheel'}
                className={viewMode === 'wheel' ? 'is-active' : ''}
                onClick={() => setViewMode('wheel')}
                title='Affichage en cercle'
              >
                <span className='view-mode-icon' aria-hidden='true'>
                  <span className='dot' />
                  <span className='dot' />
                  <span className='dot' />
                  <span className='dot' />
                  <span className='dot' />
                  <span className='dot' />
                  <span className='dot' />
                  <span className='dot' />
                </span>
                Rond
              </button>
              <button
                type='button'
                role='tab'
                aria-selected={viewMode === 'list'}
                className={viewMode === 'list' ? 'is-active' : ''}
                onClick={() => setViewMode('list')}
                title='Affichage en liste'
              >
                <span className='view-mode-icon view-mode-icon-list' aria-hidden='true'>
                  <span />
                  <span />
                  <span />
                </span>
                Liste
              </button>
            </div>
          </div>
          {viewMode === 'list' ? (
            <p className='question-title'>{card.title}</p>
          ) : null}
          {viewMode === 'wheel' ? (
            <div className='proposition-wheel' aria-label='Propositions en cercle'>
              <svg
                className='wheel-connectors'
                viewBox='0 0 100 100'
                preserveAspectRatio='xMidYMid meet'
                aria-hidden='true'
              >
                <defs>
                  <radialGradient id='wheel-glow' cx='50%' cy='50%' r='50%'>
                    <stop offset='0%' stopColor='var(--type-color, currentColor)' stopOpacity='0.45' />
                    <stop offset='70%' stopColor='var(--type-color, currentColor)' stopOpacity='0.05' />
                    <stop offset='100%' stopColor='var(--type-color, currentColor)' stopOpacity='0' />
                  </radialGradient>
                </defs>
                <circle cx='50' cy='50' r='46' fill='url(#wheel-glow)' />
                <circle
                  cx='50'
                  cy='50'
                  r='42'
                  className='wheel-ring-outer'
                  fill='none'
                />
                <circle
                  cx='50'
                  cy='50'
                  r='20'
                  className='wheel-ring-inner'
                  fill='none'
                />
                {card.propositions.map((proposition, idx) => {
                  const angle = (idx / card.propositions.length) * 2 * Math.PI - Math.PI / 2;
                  const x1 = 50 + Math.cos(angle) * 20;
                  const y1 = 50 + Math.sin(angle) * 20;
                  const x2 = 50 + Math.cos(angle) * 39;
                  const y2 = 50 + Math.sin(angle) * 39;
                  const isRevealed = matchState.revealedPropositionIds.includes(proposition.id);
                  const isSelected = proposition.id === matchState.selectedPropositionId;
                  return (
                    <line
                      key={`line_${proposition.id}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      className={`wheel-spoke ${isSelected ? 'is-active' : ''} ${isRevealed ? 'is-revealed' : ''}`}
                    />
                  );
                })}
              </svg>
              <div className='wheel-center'>
                <span className='wheel-center-label'>Question</span>
                <span className='wheel-center-title'>{card.title}</span>
              </div>
              {card.propositions.map((proposition, idx) => {
                const angle = (idx / card.propositions.length) * 2 * Math.PI - Math.PI / 2;
                const radius = 45;
                const x = 50 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius;
                const isRevealed = matchState.revealedPropositionIds.includes(proposition.id);
                const isSelected = proposition.id === matchState.selectedPropositionId;
                return (
                  <button
                    type='button'
                    key={proposition.id}
                    className={`wheel-prop ${isSelected ? 'is-active' : ''} ${isRevealed ? 'is-revealed' : ''}`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    disabled={isRevealed || Boolean(decisionPlayer) || Boolean(wrongFeedback)}
                    onClick={() => {
                      if (!isRevealed && !decisionPlayer && !wrongFeedback) {
                        sounds.click();
                        selectProposition(proposition.id);
                      }
                    }}
                  >
                    <span className='wheel-prop-index' aria-hidden='true'>
                      {idx + 1}
                    </span>
                    <span className='wheel-prop-text'>{proposition.text}</span>
                  </button>
                );
              })}
            </div>
          ) : (
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
          )}
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
