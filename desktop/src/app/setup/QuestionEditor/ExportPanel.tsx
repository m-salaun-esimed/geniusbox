import { useAppStore } from '../../store';
import { QUESTION_TYPE_COLOR, QUESTION_TYPE_LABELS } from '../../questionTypeColors';

type Card = ReturnType<typeof useAppStore.getState>['cards'][number];

type ExportPanelProps = {
  cards: Card[];
  selectedExportCardIds: string[];
  toggleExportCard: (cardId: string) => void;
  onToggleAll: () => void;
  onDownload: () => void;
  onClose: () => void;
};

export const ExportPanel = ({
  cards,
  selectedExportCardIds,
  toggleExportCard,
  onToggleAll,
  onDownload,
  onClose,
}: ExportPanelProps) => {
  const allSelected = cards.length > 0 && cards.length === selectedExportCardIds.length;
  return (
    <div className='panel'>
      <h4>Page Export JSON</h4>
      <p className='counter-text'>
        Coche les cartes à exporter, puis télécharge le JSON généré pour le partager/importer
        ailleurs.
      </p>
      <div className='inline-actions'>
        <button type='button' onClick={onToggleAll}>
          {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
        </button>
      </div>
      <ul className='question-list'>
        {cards.map((card) => (
          <li
            key={`export_${card.id}`}
            className={
              selectedExportCardIds.includes(card.id)
                ? 'card-item has-type-stripe is-active'
                : 'card-item has-type-stripe'
            }
            style={{ ['--type-color' as string]: QUESTION_TYPE_COLOR[card.type].hex }}
            onClick={() => toggleExportCard(card.id)}
          >
            <div className='card-item-content'>
              <strong>{card.title}</strong>
              <span className='type-badge' title={QUESTION_TYPE_LABELS[card.type]}>
                <span className='type-badge-dot' aria-hidden='true' />
                {QUESTION_TYPE_LABELS[card.type]}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className='inline-actions'>
        <button type='button' className='primary-button' onClick={onDownload}>
          Télécharger
        </button>
        <button type='button' onClick={onClose}>
          Retour
        </button>
      </div>
    </div>
  );
};
