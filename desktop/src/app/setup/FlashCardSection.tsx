import { useMemo, useState } from 'react';
import { useAppStore } from '../store';
import { createSoundEffects } from '../soundEffects';
import { QUESTION_TYPE_COLOR, QUESTION_TYPE_LABELS } from '../questionTypeColors';

export const FlashCardSection = () => {
  const { cards, selectedCardIdsForMatch, setCardSelectionForMatch } = useAppStore();
  const sounds = useMemo(() => createSoundEffects(), []);
  const [cardSearch, setCardSearch] = useState('');
  const selectedCardId = selectedCardIdsForMatch[0] ?? null;

  const normalizedQuery = cardSearch.trim().toLowerCase();
  const filteredCards = normalizedQuery
    ? cards.filter((card) =>
        `${card.title} ${QUESTION_TYPE_LABELS[card.type]}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : cards;

  return (
    <div className='panel flash-panel'>
      <header className='flash-hero'>
        <div className='flash-hero-text'>
          <h2>Choix de la carte</h2>
          <p className='counter-text'>
            Sélectionne la carte unique pour cette partie Flash. La partie s'arrête à la fin de la
            carte.
          </p>
        </div>
        {selectedCardId ? (
          <span className='flash-selected-pill' aria-hidden='true'>
            ✓ Carte choisie
          </span>
        ) : null}
      </header>

      {cards.length === 0 ? (
        <div className='flash-empty'>
          <div className='flash-empty-glyph' aria-hidden='true'>
            <span />
          </div>
          <h3>Aucune carte disponible</h3>
          <p>Reviens à l'étape « Cartes » pour en créer une avant de lancer une partie Flash.</p>
        </div>
      ) : (
        <>
          <div className='parcours-search flash-search'>
            <svg
              className='parcours-search-icon'
              aria-hidden='true'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <circle cx='11' cy='11' r='6.5' />
              <line x1='20' y1='20' x2='16' y2='16' />
            </svg>
            <input
              type='search'
              className='parcours-search-input'
              value={cardSearch}
              onChange={(event) => setCardSearch(event.target.value)}
              placeholder='Rechercher une carte...'
              aria-label='Rechercher une carte'
            />
            {cardSearch ? (
              <button
                type='button'
                className='parcours-search-clear'
                aria-label='Effacer la recherche'
                onClick={() => setCardSearch('')}
              >
                ×
              </button>
            ) : null}
          </div>

          {filteredCards.length === 0 ? (
            <div className='flash-no-results'>Aucune carte ne correspond à « {cardSearch} ».</div>
          ) : (
            <ul className='flash-grid'>
              {filteredCards.map((card) => {
                const isActive = selectedCardId === card.id;
                return (
                  <li
                    key={card.id}
                    className={isActive ? 'flash-tile is-active' : 'flash-tile'}
                    style={{ ['--type-color' as string]: QUESTION_TYPE_COLOR[card.type].hex }}
                    role='button'
                    tabIndex={0}
                    aria-pressed={isActive}
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
                    <div className='flash-tile-top'>
                      <span className='flash-tile-type' title={QUESTION_TYPE_LABELS[card.type]}>
                        <span className='type-badge-dot' aria-hidden='true' />
                        {QUESTION_TYPE_LABELS[card.type]}
                      </span>
                      <span
                        className={
                          isActive ? 'flash-check is-active' : 'flash-check'
                        }
                        aria-hidden='true'
                      >
                        {isActive ? '✓' : ''}
                      </span>
                    </div>
                    <h3 className='flash-tile-title'>{card.title}</h3>
                    <div className='flash-tile-meta'>
                      <span className='parcours-meta-chip'>
                        <strong>{card.propositions.length}</strong>
                        {card.propositions.length > 1 ? 'propositions' : 'proposition'}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
};
