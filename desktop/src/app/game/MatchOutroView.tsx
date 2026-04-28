import { useEffect, useMemo } from 'react';
import { useAppStore } from '../store';
import { createSoundEffects } from '../soundEffects';

export const MatchOutroView = () => {
  const { matchState, proceedToFinalRanking } = useAppStore();
  const sounds = useMemo(() => createSoundEffects(), []);

  useEffect(() => {
    sounds.gameEnd();
  }, [sounds]);

  if (!matchState || matchState.phase !== 'match_complete') {
    return null;
  }

  const winners = matchState.players.filter((player) =>
    matchState.winnerIds.includes(player.id),
  );
  const reachedTarget = matchState.players.some(
    (player) => player.totalScore >= matchState.targetPointsToWin,
  );
  const winnerNames = winners.map((player) => player.name).join(', ');
  const isTie = winners.length > 1;
  const isFlash = matchState.targetPointsToWin >= Number.MAX_SAFE_INTEGER;
  const eyebrow = isTie
    ? 'Égalité parfaite'
    : reachedTarget
      ? 'Objectif atteint'
      : isFlash
        ? 'Mode Flash terminé'
        : 'Parcours terminé';
  const headline = isTie
    ? 'Match nul !'
    : winners.length === 1
      ? `Bravo ${winners[0]?.name} !`
      : 'Partie terminée';
  const subline = isTie
    ? `${winnerNames} terminent à égalité.`
    : reachedTarget
      ? `${winnerNames} atteint la barre des ${matchState.targetPointsToWin} points.`
      : isFlash
        ? 'Toutes les cartes ont été jouées.'
        : 'Le parcours est terminé. Voici le résultat.';

  return (
    <main>
      <section className='editor-card game-shell match-outro-shell'>
        <div className='match-outro-card'>
          <div className='match-outro-burst' aria-hidden='true'>
            <svg viewBox='0 0 24 24' width='52' height='52'>
              <path
                d='M7 3h10l-1 6a4 4 0 11-8 0L7 3z'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.6'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M5 5H3a3 3 0 003 3M19 5h2a3 3 0 01-3 3'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.6'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M9 21h6M12 15v6'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.6'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
          <p className='match-outro-eyebrow'>{eyebrow}</p>
          <h1 className='match-outro-headline'>{headline}</h1>
          <p className='match-outro-subline'>{subline}</p>
          {!isTie && winners.length === 1 ? (
            <div className='match-outro-score'>
              <span className='match-outro-score-value'>{winners[0]?.totalScore}</span>
              <span className='match-outro-score-label'>points</span>
            </div>
          ) : null}
          <div className='match-outro-actions'>
            <button
              type='button'
              className='primary-button match-outro-cta'
              onClick={() => {
                sounds.click();
                proceedToFinalRanking();
              }}
            >
              Voir le classement
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};
