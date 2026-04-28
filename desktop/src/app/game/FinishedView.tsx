import { useAppStore } from '../store';

type FinishedViewProps = {
  onAcceptEndMatch: () => void;
};

const PODIUM_ORDER = [1, 0, 2] as const;

const PODIUM_META: Record<
  number,
  { rankLabel: string; medalClass: string; tierLabel: string }
> = {
  0: { rankLabel: '1', medalClass: 'gold', tierLabel: 'Champion' },
  1: { rankLabel: '2', medalClass: 'silver', tierLabel: 'Second' },
  2: { rankLabel: '3', medalClass: 'bronze', tierLabel: 'Troisième' },
};

const SPARKLE_POSITIONS = [
  { top: '12%', left: '8%', delay: '0s', size: 6 },
  { top: '22%', left: '88%', delay: '0.7s', size: 8 },
  { top: '46%', left: '4%', delay: '1.4s', size: 5 },
  { top: '70%', left: '92%', delay: '0.3s', size: 7 },
  { top: '82%', left: '14%', delay: '1.1s', size: 6 },
  { top: '8%', left: '52%', delay: '1.8s', size: 5 },
  { top: '58%', left: '70%', delay: '0.5s', size: 6 },
  { top: '38%', left: '32%', delay: '2.1s', size: 4 },
];

export const FinishedView = ({ onAcceptEndMatch }: FinishedViewProps) => {
  const matchState = useAppStore((state) => state.matchState);

  if (!matchState || matchState.phase !== 'finished') {
    return null;
  }

  const winners = matchState.players.filter((player) => matchState.winnerIds.includes(player.id));
  const rankedPlayers = matchState.players
    .slice()
    .sort((first, second) => second.totalScore - first.totalScore);

  const isTie = winners.length > 1;
  const podiumPlayers = rankedPlayers.slice(0, 3);
  const otherPlayers = rankedPlayers.slice(3);
  const champion = rankedPlayers[0];

  return (
    <main className='final-ranking'>
      <div className='final-ranking-sparkles' aria-hidden='true'>
        {SPARKLE_POSITIONS.map((sparkle, index) => (
          <span
            key={index}
            className='final-sparkle'
            style={{
              top: sparkle.top,
              left: sparkle.left,
              width: sparkle.size,
              height: sparkle.size,
              animationDelay: sparkle.delay,
            }}
          />
        ))}
      </div>

      <section className='final-ranking-shell'>
        <header className='final-hero'>
          <div className='final-hero-crown' aria-hidden='true'>
            <svg viewBox='0 0 64 48' width='72' height='54'>
              <defs>
                <linearGradient id='crownGradient' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='#ffe9a8' />
                  <stop offset='55%' stopColor='#f6c453' />
                  <stop offset='100%' stopColor='#b97f1c' />
                </linearGradient>
              </defs>
              <path
                d='M6 16 L18 30 L32 8 L46 30 L58 16 L54 40 H10 Z'
                fill='url(#crownGradient)'
                stroke='#7c5210'
                strokeWidth='1.4'
                strokeLinejoin='round'
              />
              <circle cx='6' cy='16' r='3.2' fill='#ffe9a8' stroke='#7c5210' strokeWidth='1' />
              <circle cx='32' cy='8' r='3.4' fill='#ffe9a8' stroke='#7c5210' strokeWidth='1' />
              <circle cx='58' cy='16' r='3.2' fill='#ffe9a8' stroke='#7c5210' strokeWidth='1' />
              <circle cx='22' cy='34' r='1.6' fill='#ffe9a8' />
              <circle cx='32' cy='32' r='1.6' fill='#ffe9a8' />
              <circle cx='42' cy='34' r='1.6' fill='#ffe9a8' />
            </svg>
          </div>
          <p className='final-hero-eyebrow'>Classement final</p>
          <h1 className='final-hero-title'>
            {isTie ? 'Égalité au sommet' : champion ? `${champion.name} l'emporte` : 'Partie terminée'}
          </h1>
          {!isTie && champion ? (
            <p className='final-hero-subline'>
              <span className='final-hero-score'>{champion.totalScore}</span>
              <span className='final-hero-score-label'>points</span>
            </p>
          ) : (
            <p className='final-hero-subline final-hero-subline-tie'>
              {winners.map((player) => player.name).join(' · ')}
            </p>
          )}
        </header>

        {podiumPlayers.length > 0 ? (
          <div className='podium-stage'>
            {PODIUM_ORDER.map((rank) => {
              const player = podiumPlayers[rank];
              if (!player) {
                return <div key={`empty-${rank}`} className='podium-slot podium-slot-empty' />;
              }
              const meta = PODIUM_META[rank]!;
              return (
                <div
                  key={player.id}
                  className={`podium-slot podium-slot-${meta.medalClass}`}
                  style={{ animationDelay: `${0.15 + rank * 0.12}s` }}
                >
                  <div className='podium-avatar' aria-hidden='true'>
                    <span className='podium-avatar-initial'>
                      {player.name.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                    <span className={`podium-medal podium-medal-${meta.medalClass}`}>
                      {meta.rankLabel}
                    </span>
                  </div>
                  <p className='podium-name' title={player.name}>
                    {player.name}
                  </p>
                  <p className='podium-tier'>{meta.tierLabel}</p>
                  <div className={`podium-block podium-block-${meta.medalClass}`}>
                    <span className='podium-block-score'>{player.totalScore}</span>
                    <span className='podium-block-label'>pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {otherPlayers.length > 0 ? (
          <ul className='final-others-list'>
            {otherPlayers.map((player, index) => (
              <li key={player.id} className='final-others-item'>
                <span className='final-others-rank'>{index + 4}</span>
                <span className='final-others-name'>{player.name}</span>
                <span className='final-others-score'>
                  <strong>{player.totalScore}</strong>
                  <span className='final-others-score-label'>pts</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className='final-ranking-actions'>
          <button type='button' className='primary-button final-ranking-cta' onClick={onAcceptEndMatch}>
            Terminer la partie
          </button>
        </div>
      </section>
    </main>
  );
};
