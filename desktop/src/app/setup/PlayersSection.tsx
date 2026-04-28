import { useMemo } from 'react';
import { useAppStore } from '../store';
import { createSoundEffects } from '../soundEffects';

export const PlayersSection = () => {
  const {
    setupPlayers,
    setPlayerName,
    addPlayer,
    removePlayer,
    targetPointsToWin,
    setTargetPointsToWin,
  } = useAppStore();
  const sounds = useMemo(() => createSoundEffects(), []);

  return (
    <div className='panel'>
      <h2>Joueurs</h2>
      <p className='counter-text'>
        Configure les prénoms des joueurs et les paramètres de partie. (Max 10 joueurs)
      </p>
      <div className='players-list'>
        {setupPlayers.map((playerName, index) => (
          <div key={`player_${index}`} className='player-row no-gm-row'>
            <input
              value={playerName}
              placeholder={`Joueur ${index + 1}`}
              onChange={(event) => setPlayerName(index, event.target.value)}
            />
            <button type='button' className='danger-button' onClick={() => removePlayer(index)}>
              Retirer
            </button>
          </div>
        ))}
      </div>
      <button
        type='button'
        onClick={() => {
          sounds.click();
          addPlayer();
        }}
      >
        Ajouter un joueur
      </button>

      <hr className='section-separator' />
      <h3>Points à atteindre pour gagner</h3>
      <div className='target-points-panel'>
        <p className='counter-text'>Objectif actuel</p>
        <div className='target-points-value'>{targetPointsToWin} points</div>
      </div>
      <div className='points-selector target-points-selector'>
        {[10, 15, 20, 25, 30, 40, 50].map((value) => (
          <button
            key={`points_${value}`}
            type='button'
            className={targetPointsToWin === value ? 'points-button is-active' : 'points-button'}
            onClick={() => {
              sounds.click();
              setTargetPointsToWin(value);
            }}
          >
            {value}
          </button>
        ))}
      </div>
      <label htmlFor='target-points-input'>Valeur personnalisée</label>
      <input
        id='target-points-input'
        type='number'
        min={1}
        value={targetPointsToWin}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (Number.isNaN(parsed)) {
            return;
          }
          setTargetPointsToWin(parsed);
        }}
        placeholder='Ex: 30'
      />
    </div>
  );
};
