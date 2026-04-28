import { useAppStore } from '../../store';
import { confirmDialog } from '../../confirmModal';
import { createSoundEffects } from '../../soundEffects';
import { useMemo, useState } from 'react';
import { QUESTION_TYPE_COLOR, QUESTION_TYPE_LABELS } from '../../questionTypeColors';

type Card = ReturnType<typeof useAppStore.getState>['cards'][number];

type CardsGridProps = {
  cards: Card[];
  selectedCardId: string | null;
  onOpen: (cardId: string) => void;
  onDeleted: (cardId: string) => void;
};

export const CardsGrid = ({ cards, selectedCardId, onOpen, onDeleted }: CardsGridProps) => {
  const { deleteCard } = useAppStore();
  const sounds = useMemo(() => createSoundEffects(), []);
  const [cardSearch, setCardSearch] = useState('');

  const normalizedQuery = cardSearch.trim().toLowerCase();
  const filteredCards = normalizedQuery
    ? cards.filter((card) =>
        `${card.title} ${QUESTION_TYPE_LABELS[card.type]}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : cards;

  return (
    <>
      <div className='parcours-search parcours-search--list'>
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
        <div className='parcours-pane-empty'>
          {cards.length === 0
            ? 'Aucune carte dans le catalogue.'
            : `Aucune carte ne correspond à « ${cardSearch} ».`}
        </div>
      ) : (
        <ul className='cards-grid'>
          {filteredCards.map((card) => (
        <li
          key={card.id}
          className={
            selectedCardId === card.id
              ? 'card-tile has-type-stripe is-active'
              : 'card-tile has-type-stripe'
          }
          style={{ ['--type-color' as string]: QUESTION_TYPE_COLOR[card.type].hex }}
          role='button'
          tabIndex={0}
          onClick={() => {
            sounds.click();
            onOpen(card.id);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              sounds.click();
              onOpen(card.id);
            }
          }}
        >
          <div className='card-tile-header'>
            <strong>{card.title}</strong>
            <span className='type-badge' title={QUESTION_TYPE_LABELS[card.type]}>
              <span className='type-badge-dot' aria-hidden='true' />
              {QUESTION_TYPE_LABELS[card.type]}
            </span>
          </div>
          <div className='card-tile-propositions'>
            <p className='counter-text'>Propositions ({card.propositions.length})</p>
            <ul>
              {card.propositions.map((proposition, index) => (
                <li key={proposition.id}>
                  {index + 1}. {proposition.text}
                </li>
              ))}
            </ul>
          </div>
          <div className='card-tile-actions'>
            <button
              type='button'
              className='danger-button'
              onClick={async (event) => {
                event.stopPropagation();
                sounds.openModal();
                const confirmed = await confirmDialog({
                  title: 'Supprimer cette carte ?',
                  message: `« ${card.title} » sera retirée définitivement du catalogue.`,
                  confirmLabel: 'Supprimer',
                  danger: true,
                });
                if (!confirmed) {
                  return;
                }
                onDeleted(card.id);
                sounds.wrong();
                deleteCard(card.id);
              }}
            >
              Supprimer
            </button>
          </div>
        </li>
      ))}
        </ul>
      )}
    </>
  );
};
