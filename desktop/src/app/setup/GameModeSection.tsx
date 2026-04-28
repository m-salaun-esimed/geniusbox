import { useMemo } from 'react';
import { useAppStore } from '../store';
import { createSoundEffects } from '../soundEffects';

const SUDDEN_DEATH_PRESETS = [15, 30, 45, 60];

export const GameModeSection = () => {
  const {
    gameMode,
    setGameMode,
    suddenDeath,
    suddenDeathDuration,
    setSuddenDeath,
    setSuddenDeathDuration,
  } = useAppStore();
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
      {gameMode ? (
        <>
          <hr className='section-separator' />
          <h3>Mort subite (option)</h3>
          <p className='counter-text'>
            Le timer démarre automatiquement à chaque tour. Pas de réponse à temps = élimination
            pour la carte.
          </p>
          <button
            type='button'
            className={suddenDeath ? 'card-item is-active' : 'card-item'}
            onClick={() => {
              sounds.click();
              setSuddenDeath(!suddenDeath);
            }}
          >
            <div className='card-item-content'>
              <strong className='card-item-title'>
                {suddenDeath ? 'Mort subite : activée' : 'Mort subite : désactivée'}
              </strong>
              <span className='card-item-description'>
                {suddenDeath
                  ? `Chaque joueur dispose de ${suddenDeathDuration} secondes par tour.`
                  : 'Active pour imposer un temps limité par tour.'}
              </span>
            </div>
          </button>
          {suddenDeath ? (
            <>
              <h4>Durée par tour</h4>
              <div className='target-points-panel'>
                <p className='counter-text'>Durée actuelle</p>
                <div className='target-points-value'>{suddenDeathDuration} secondes</div>
              </div>
              <div className='points-selector target-points-selector'>
                {SUDDEN_DEATH_PRESETS.map((value) => (
                  <button
                    key={`sd_preset_${value}`}
                    type='button'
                    className={
                      suddenDeathDuration === value ? 'points-button is-active' : 'points-button'
                    }
                    onClick={() => {
                      sounds.click();
                      setSuddenDeathDuration(value);
                    }}
                  >
                    {value}s
                  </button>
                ))}
              </div>
              <label htmlFor='sudden-death-duration-input'>Valeur personnalisée (5–120s)</label>
              <input
                id='sudden-death-duration-input'
                type='number'
                min={5}
                max={120}
                value={suddenDeathDuration}
                onChange={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10);
                  if (Number.isNaN(parsed)) {
                    return;
                  }
                  setSuddenDeathDuration(parsed);
                }}
                placeholder='Ex: 25'
              />
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
