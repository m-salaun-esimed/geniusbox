import { useMemo } from 'react';
import { useAppStore } from '../store';
import { createSoundEffects } from '../soundEffects';

export const GameModeSection = () => {
  const { gameMode, setGameMode } = useAppStore();
  const sounds = useMemo(() => createSoundEffects(), []);
  return (
    <div className='panel'>
      <h2>Mode de jeu</h2>
      <p className='counter-text'>
        Choisis comment se déroule la partie. Le mode peut être changé tant que la partie n'est pas
        lancée.
      </p>
      <div className='launch-grid'>
        <button
          type='button'
          className={gameMode === 'flash' ? 'card-item is-active' : 'card-item'}
          onClick={() => {
            sounds.click();
            setGameMode('flash');
          }}
        >
          <div className='card-item-content'>
            <strong className='card-item-title'>Mode Flash</strong>
            <span className='card-item-description'>
              Une seule carte. La partie se termine quand toutes les propositions sont révélées — le
              joueur avec le plus de points gagne.
            </span>
          </div>
        </button>
        <button
          type='button'
          className={gameMode === 'parcours' ? 'card-item is-active' : 'card-item'}
          onClick={() => {
            sounds.click();
            setGameMode('parcours');
          }}
        >
          <div className='card-item-content'>
            <strong className='card-item-title'>Mode Parcours</strong>
            <span className='card-item-description'>
              Plusieurs cartes enchaînées. Premier joueur à atteindre l'objectif de points (ou
              meilleur score à la fin du parcours).
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
