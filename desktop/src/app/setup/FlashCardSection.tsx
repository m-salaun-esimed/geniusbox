import { useMemo } from 'react';
import { useAppStore } from '../store';
import { createSoundEffects } from '../soundEffects';
import { QUESTION_TYPE_COLOR, QUESTION_TYPE_LABELS } from '../questionTypeColors';

export const FlashCardSection = () => {
  const { cards, selectedCardIdsForMatch, setCardSelectionForMatch } = useAppStore();
  const sounds = useMemo(() => createSoundEffects(), []);
  const selectedCardId = selectedCardIdsForMatch[0] ?? null;
  return (
    <div className='panel'>
      <h2>Choix de la carte</h2>
      <p className='counter-text'>
        Sélectionne la carte unique pour cette partie Flash. La partie s'arrête à la fin de la
        carte.
      </p>
      {cards.length === 0 ? (
        <p className='status-message'>
          Aucune carte disponible. Reviens à l'étape « Cartes » pour en créer une.
        </p>
      ) : (
        <ul className='question-list'>
          {cards.map((card) => (
            <li
              key={card.id}
              className={
                selectedCardId === card.id
                  ? 'card-item has-type-stripe is-active'
                  : 'card-item has-type-stripe'
              }
              style={{ ['--type-color' as string]: QUESTION_TYPE_COLOR[card.type].hex }}
              role='button'
              tabIndex={0}
              onClick={() => {
                sounds.click();
                setCardSelectionForMatch([card.id]);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  sounds.click();
                  setCardSelectionForMatch([card.id]);
                }
              }}
            >
              <div className='card-item-content'>
                <strong>{card.title}</strong>
                <span className='type-badge' title={QUESTION_TYPE_LABELS[card.type]}>
                  <span className='type-badge-dot' aria-hidden='true' />
                  {QUESTION_TYPE_LABELS[card.type]} · {card.propositions.length} propositions
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
