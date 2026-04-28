import { useAppStore } from '../../store';
import { confirmDialog } from '../../confirmModal';
import { createSoundEffects } from '../../soundEffects';
import { useMemo } from 'react';
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

  return (
    <ul className='cards-grid'>
      {cards.map((card) => (
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
  );
};
