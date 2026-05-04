import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
    forfeitTurnAsTimeout,
  } = useAppStore();
  const sounds = useMemo(() => createSoundEffects(), []);
  const [textAnswer, setTextAnswer] = useState('');
  const suddenDeath = matchState?.suddenDeath ?? false;
  const suddenDeathDuration = matchState?.suddenDeathDuration ?? 30;
  const [timerRemaining, setTimerRemaining] = useState<number | null>(
    suddenDeath ? suddenDeathDuration : null,
  );
  const [timerDuration, setTimerDuration] = useState(suddenDeath ? suddenDeathDuration : 30);
  const textAnswerRef = useRef('');
  textAnswerRef.current = textAnswer;
  const [viewMode, setViewMode] = useState<'wheel' | 'list'>(() => {
    if (typeof window === 'undefined') return 'wheel';
    const stored = window.localStorage.getItem('smart10.inRoundViewMode');
    return stored === 'list' ? 'list' : 'wheel';
  });
  const previousDecisionPlayerRef = useRef<string | null>(null);
  const [playerChangeBanner, setPlayerChangeBanner] = useState<string | null>(null);
  const previousCurrentPlayerRef = useRef<string | null>(null);
  const playerChangeTimeoutRef = useRef<number | null>(null);

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
    const currentId = matchState?.currentPlayerId ?? null;
    const previousId = previousCurrentPlayerRef.current;
    if (
      currentId &&
      previousId &&
      currentId !== previousId &&
      matchState?.phase === 'in_round'
    ) {
      const nextPlayer = matchState.players.find((player) => player.id === currentId);
      if (nextPlayer) {
        setPlayerChangeBanner(nextPlayer.name);
        if (playerChangeTimeoutRef.current !== null) {
          window.clearTimeout(playerChangeTimeoutRef.current);
        }
        playerChangeTimeoutRef.current = window.setTimeout(() => {
          setPlayerChangeBanner(null);
          playerChangeTimeoutRef.current = null;
        }, 1600);
      }
    }
    previousCurrentPlayerRef.current = currentId;
  }, [matchState?.currentPlayerId, matchState?.phase, matchState?.players]);

  useEffect(() => {
    return () => {
      if (playerChangeTimeoutRef.current !== null) {
        window.clearTimeout(playerChangeTimeoutRef.current);
      }
    };
  }, []);

  const isTimerPaused = Boolean(
    matchState?.decisionPendingPlayerId ||
      matchState?.wrongAnswerFeedback ||
      matchState?.pendingFreeTextValidation,
  );

  useEffect(() => {
    if (timerRemaining === null || timerRemaining <= 0 || isTimerPaused) {
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
  }, [timerRemaining, isTimerPaused, sounds]);

  useEffect(() => {
    if (!suddenDeath) return;
    if (matchState?.phase !== 'in_round') return;
    setTimerRemaining(suddenDeathDuration);
  }, [
    suddenDeath,
    suddenDeathDuration,
    matchState?.currentPlayerId,
    matchState?.currentCardIndex,
    matchState?.phase,
  ]);

  useEffect(() => {
    if (!suddenDeath) return;
    if (timerRemaining !== 0) return;
    if (isTimerPaused) return;
    if (!matchState || matchState.phase !== 'in_round') return;
    const card = matchState.orderedCards[matchState.currentCardIndex];
    if (!card) return;
    const isFreeInput = card.type === 'free_text' || card.type === 'free_number';
    const trimmed = textAnswerRef.current.trim();
    if (isFreeInput && matchState.selectedPropositionId && trimmed) {
      answerSelectedProposition(trimmed);
      return;
    }
    sounds.wrong();
    forfeitTurnAsTimeout();
  }, [
    timerRemaining,
    suddenDeath,
    isTimerPaused,
    matchState,
    answerSelectedProposition,
    forfeitTurnAsTimeout,
    sounds,
  ]);

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
  const selectedPathName = matchState.selectedPathName;
  const selectedPathCategory = matchState.selectedPathCategory;

  if (!currentPlayer) {
    return null;
  }

  const answerInputsDisabled =
    !selectedProposition || Boolean(decisionPlayer) || Boolean(wrongFeedback);

  const decisionWouldWin = decisionPlayer
    ? decisionPlayer.totalScore + decisionPlayer.tempScore >= matchState.targetPointsToWin
    : false;

  const restartTimerIfRunning = () => {
    if (suddenDeath) {
      setTimerRemaining(suddenDeathDuration);
      return;
    }
    if (timerRemaining !== null) {
      setTimerRemaining(timerDuration);
    }
  };

  const handleCapitalize = () => {
    sounds.secure();
    secureAndStopTurn();
    restartTimerIfRunning();
  };

  const handleContinue = () => {
    if (decisionWouldWin) return;
    sounds.risk();
    riskAndContinueTurn();
    restartTimerIfRunning();
  };

  const handleAcknowledgeWrong = () => {
    sounds.navigate();
    acknowledgeWrongAnswerFeedback();
    restartTimerIfRunning();
  };

  return (
    <main>
      <section className='editor-card game-shell'>
        <header className='editor-header'>
          <h1>GeniusBox — Partie</h1>
          <p>
            Carte {matchState.currentCardIndex + 1} / {matchState.orderedCards.length}
            {matchState.targetPointsToWin >= Number.MAX_SAFE_INTEGER
              ? ' · Mode Flash'
              : ` · Objectif ${matchState.targetPointsToWin}`}
          </p>
          {selectedPathName ? (
            <div className='game-path-pill' title={`Parcours: ${selectedPathName}`}>
              <span className='game-path-pill-label'>Parcours</span>
              <strong>{selectedPathName}</strong>
              <span className='game-path-pill-separator' aria-hidden='true'>
                •
              </span>
              <span className='game-path-pill-category'>
                {selectedPathCategory || 'Sans catégorie'}
              </span>
            </div>
          ) : null}
        </header>

        <div className='game-grid'>
          <div
            className='panel game-question-panel has-type-stripe'
            style={{ ['--type-color' as string]: QUESTION_TYPE_COLOR[card.type].hex }}
          >
            <div className='timer-bar'>
              <div
                className={`timer-pill ${timerRemaining !== null && timerRemaining <= 5 ? 'is-danger' : ''} ${isTimerPaused && timerRemaining !== null ? 'is-paused' : ''}`}
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
              {suddenDeath ? (
                <span className='target-chip' title='Mort subite active'>
                  Mort subite
                </span>
              ) : (
                <div className='points-selector timer-points'>
                  {[15, 30, 45].map((value) => (
                    <button
                      key={`in_game_timer_${value}`}
                      type='button'
                      className={
                        timerDuration === value ? 'points-button is-active' : 'points-button'
                      }
                      onClick={() => {
                        setTimerDuration(value);
                        setTimerRemaining(value);
                        sounds.navigate();
                      }}
                    >
                      {value}s
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className='game-meta-row'>
              <div className='player-pill' title={`Joueur actif: ${currentPlayer.name}`}>
                <svg
                  className='player-pill-icon'
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
                  <circle cx='12' cy='8' r='4' />
                  <path d='M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8' />
                </svg>
                <span className='tiny-label player-pill-label'>Joueur actif</span>
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
            {viewMode === 'list' ? <p className='question-title'>{card.title}</p> : null}
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
                      <stop
                        offset='0%'
                        stopColor='var(--type-color, currentColor)'
                        stopOpacity='0.45'
                      />
                      <stop
                        offset='70%'
                        stopColor='var(--type-color, currentColor)'
                        stopOpacity='0.05'
                      />
                      <stop
                        offset='100%'
                        stopColor='var(--type-color, currentColor)'
                        stopOpacity='0'
                      />
                    </radialGradient>
                  </defs>
                  <circle cx='50' cy='50' r='46' fill='url(#wheel-glow)' />
                  <circle cx='50' cy='50' r='42' className='wheel-ring-outer' fill='none' />
                  <circle cx='50' cy='50' r='20' className='wheel-ring-inner' fill='none' />
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
                  <span className='wheel-center-title' title={card.title}>{card.title}</span>
                </div>
                {card.propositions.map((proposition, idx) => {
                  const angle = (idx / card.propositions.length) * 2 * Math.PI - Math.PI / 2;
                  const cos = Math.cos(angle).toFixed(4);
                  const sin = Math.sin(angle).toFixed(4);
                  const isRevealed = matchState.revealedPropositionIds.includes(proposition.id);
                  const isSelected = proposition.id === matchState.selectedPropositionId;
                  return (
                    <button
                      type='button'
                      key={proposition.id}
                      title={proposition.text}
                      className={`wheel-prop ${isSelected ? 'is-active' : ''} ${isRevealed ? 'is-revealed' : ''}`}
                      style={{
                        left: `calc(50% + var(--wheel-radius) * ${cos})`,
                        top: `calc(50% + var(--wheel-radius) * ${sin})`,
                      }}
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
                {card.propositions.map((proposition, idx) => {
                  const isRevealed = matchState.revealedPropositionIds.includes(proposition.id);
                  const isSelected = proposition.id === matchState.selectedPropositionId;
                  const disabled =
                    isRevealed || Boolean(decisionPlayer) || Boolean(wrongFeedback);
                  return (
                    <li
                      key={proposition.id}
                      className={`card-item list-prop ${isSelected ? 'is-active' : ''} ${isRevealed ? 'is-revealed' : ''}`}
                      role='button'
                      tabIndex={disabled ? -1 : 0}
                      aria-pressed={isSelected}
                      aria-disabled={disabled}
                      onClick={() => {
                        if (!disabled) {
                          sounds.click();
                          selectProposition(proposition.id);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (disabled) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          sounds.click();
                          selectProposition(proposition.id);
                        }
                      }}
                    >
                      <span className='list-prop-index' aria-hidden='true'>
                        {isRevealed ? (
                          <svg
                            viewBox='0 0 24 24'
                            width='14'
                            height='14'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='3'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          >
                            <path d='M5 12.5l4.5 4.5L19 7.5' />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <span className='list-prop-text'>{proposition.text}</span>
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
                      onClick={() => selectedProposition && answerSelectedProposition(entry.id)}
                      disabled={answerInputsDisabled}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <aside className='panel game-side-panel'>
            <div className='game-side-panel-header'>
              <h3>Scores</h3>
              {matchState.targetPointsToWin < Number.MAX_SAFE_INTEGER ? (
                <span className='target-chip' title='Objectif de points'>
                  {matchState.targetPointsToWin} pts
                </span>
              ) : (
                <span className='target-chip target-chip-flash'>Flash</span>
              )}
            </div>
            <ul className='score-list score-list-rich'>
              {[...matchState.players]
                .map((player, originalIndex) => ({ player, originalIndex }))
                .sort((a, b) => b.player.totalScore - a.player.totalScore)
                .map(({ player }) => {
                  const isCurrent = player.id === matchState.currentPlayerId;
                  const initials = player.name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? '')
                    .join('');
                  const statusLabel =
                    player.status === 'active'
                      ? 'En jeu'
                      : player.status === 'stopped'
                        ? 'Sécurisé'
                        : 'Éliminé';
                  return (
                    <li
                      key={player.id}
                      className={`score-row score-row--${player.status} ${isCurrent ? 'is-current' : ''}`}
                    >
                      <span className='score-avatar' aria-hidden='true'>
                        {initials || '?'}
                      </span>
                      <div className='score-identity'>
                        <span className='score-name'>{player.name}</span>
                        <span className='score-status'>{statusLabel}</span>
                      </div>
                      <div className='score-values'>
                        <span className='score-total'>{player.totalScore}</span>
                        {player.tempScore > 0 ? (
                          <span className='score-temp' title='Points temporaires'>
                            +{player.tempScore}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
            </ul>
            <button
              type='button'
              className='danger-button game-side-panel-end'
              onClick={onConfirmEndMatch}
            >
              Terminer la partie
            </button>
          </aside>
        </div>
      </section>
      {decisionPlayer
        ? createPortal(
            <div className='modal-backdrop'>
              <div className='modal-card decision-modal decision-modal--correct'>
                <div className='decision-burst' aria-hidden='true'>
                  <svg viewBox='0 0 24 24' width='38' height='38'>
                    <path
                      d='M5 12.5l4.5 4.5L19 7.5'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='3'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </div>
                <p className='decision-eyebrow'>Bonne réponse</p>
                <h3 className='decision-player'>{decisionPlayer.name}</h3>
                <div className='decision-points'>
                  <span className='decision-points-current'>
                    {decisionPlayer.totalScore}
                  </span>
                  <span className='decision-points-plus'>
                    +{decisionPlayer.tempScore}
                  </span>
                  <span className='decision-points-label'>pts en jeu</span>
                </div>
                {decisionWouldWin ? (
                  <p className='decision-helper decision-helper--win'>
                    En capitalisant, tu remportes la partie !
                  </p>
                ) : (
                  <p className='decision-helper'>
                    Capitalise pour sécuriser tes points, ou continue pour en gagner plus
                    (au risque de tout perdre).
                  </p>
                )}
                <div className='decision-actions'>
                  <button
                    type='button'
                    className='primary-button decision-action decision-action--secure'
                    onClick={handleCapitalize}
                  >
                    <span className='decision-action-title'>
                      {decisionWouldWin ? 'Gagner la partie' : 'Capitaliser'}
                    </span>
                    <span className='decision-action-sub'>
                      +{decisionPlayer.tempScore} sécurisé{decisionPlayer.tempScore > 1 ? 's' : ''}
                    </span>
                  </button>
                  {decisionWouldWin ? null : (
                    <button
                      type='button'
                      className='decision-action decision-action--risk'
                      onClick={handleContinue}
                    >
                      <span className='decision-action-title'>Continuer</span>
                      <span className='decision-action-sub'>Risquer pour plus de points</span>
                    </button>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      {wrongFeedback
        ? createPortal(
            <div className='modal-backdrop'>
              <div className='modal-card decision-modal decision-modal--wrong'>
                <div className='decision-burst decision-burst--wrong' aria-hidden='true'>
                  <svg viewBox='0 0 24 24' width='38' height='38'>
                    <path
                      d='M6 6l12 12M18 6L6 18'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='3'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </div>
                <p className='decision-eyebrow decision-eyebrow--wrong'>
                  {wrongFeedback.message === 'Temps écoulé' ? 'Temps écoulé' : 'Mauvaise réponse'}
                </p>
                <h3 className='decision-player'>{currentPlayer.name}</h3>
                {wrongFeedback.propositionText ? (
                  <div className='decision-points decision-points--wrong'>
                    <span className='decision-points-label'>Proposition</span>
                    <span className='decision-points-current'>
                      {wrongFeedback.propositionText}
                    </span>
                  </div>
                ) : null}
                {wrongFeedback.correctAnswer ? (
                  <p className='decision-helper decision-helper--wrong'>
                    Bonne réponse&nbsp;: <strong>{wrongFeedback.correctAnswer}</strong>
                  </p>
                ) : null}
                <p className='decision-helper'>
                  Tu perds tes points en jeu et tu es éliminé pour cette carte.
                </p>
                <div className='decision-actions'>
                  <button
                    type='button'
                    className='primary-button decision-action decision-action--wrong'
                    onClick={handleAcknowledgeWrong}
                  >
                    <span className='decision-action-title'>Tour suivant</span>
                    <span className='decision-action-sub'>Passer la main</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      {pendingFreeTextValidation
        ? createPortal(
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
            </div>,
            document.body,
          )
        : null}
      {playerChangeBanner
        ? createPortal(
            <div className='player-change-overlay' aria-live='polite'>
              <div className='player-change-card'>
                <span className='player-change-eyebrow'>Au tour de</span>
                <span className='player-change-name'>{playerChangeBanner}</span>
              </div>
            </div>,
            document.body,
          )
        : null}
      <EndMatchConfirmModal
        open={endMatchConfirmOpen}
        onCancel={onCancelEndMatch}
        onConfirm={onAcceptEndMatch}
      />
    </main>
  );
};
