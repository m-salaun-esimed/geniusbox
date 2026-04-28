import { useAppStore } from '../store';
import { EndMatchConfirmModal } from '../components/EndMatchConfirmModal';

type FinishedViewProps = {
  onConfirmEndMatch: () => void;
  endMatchConfirmOpen: boolean;
  onCancelEndMatch: () => void;
  onAcceptEndMatch: () => void;
};

export const FinishedView = ({
  onConfirmEndMatch,
  endMatchConfirmOpen,
  onCancelEndMatch,
  onAcceptEndMatch,
}: FinishedViewProps) => {
  const matchState = useAppStore((state) => state.matchState);

  if (!matchState || matchState.phase !== 'finished') {
    return null;
  }

  const winners = matchState.players.filter((player) => matchState.winnerIds.includes(player.id));
  const rankedPlayers = matchState.players
    .slice()
    .sort((first, second) => second.totalScore - first.totalScore);

  return (
    <main>
      <section className='editor-card game-shell'>
        <header className='editor-header'>
          <h1>Classement final — GeniusBox</h1>
          <p>
            Gagnant{winners.length > 1 ? 's' : ''}:{' '}
            {winners.map((player) => player.name).join(', ')}
          </p>
        </header>
        <div className='panel'>
          <ul className='score-list podium-list'>
            {rankedPlayers.map((player, index) => (
              <li
                key={player.id}
                className={
                  index === 0
                    ? 'podium-item podium-gold'
                    : index === 1
                      ? 'podium-item podium-silver'
                      : index === 2
                        ? 'podium-item podium-bronze'
                        : 'podium-item'
                }
              >
                <span>
                  {index + 1}. {player.name}
                </span>
                <strong>{player.totalScore}</strong>
              </li>
            ))}
          </ul>
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
