import {
  QUESTION_TYPE_COLOR,
  QUESTION_TYPE_DESCRIPTIONS,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_ORDER,
} from '../questionTypeColors';

type TypeLegendModalProps = {
  onClose: () => void;
};

export const TypeLegendModal = ({ onClose }: TypeLegendModalProps) => {
  return (
    <div className='modal-backdrop' onClick={onClose}>
      <div
        className='modal-card modal-card--framed'
        onClick={(event) => event.stopPropagation()}
      >
        <header className='modal-header'>
          <div className='modal-header-text'>
            <h3>Légende des couleurs</h3>
            <p className='modal-subtitle'>
              Chaque type de question a une couleur dédiée pour identifier les cartes au coup d'œil.
            </p>
          </div>
          <button type='button' className='modal-close' aria-label='Fermer' onClick={onClose}>
            ×
          </button>
        </header>
        <div className='modal-body'>
          <ul className='legend-modal-list'>
            {QUESTION_TYPE_ORDER.map((type) => {
              const color = QUESTION_TYPE_COLOR[type];
              return (
                <li
                  key={`legend_${type}`}
                  className='legend-modal-item'
                  style={{ ['--type-color' as string]: color.hex }}
                >
                  <span className='legend-modal-swatch' aria-hidden='true' />
                  <div className='legend-modal-text'>
                    <span className='legend-modal-label'>{QUESTION_TYPE_LABELS[type]}</span>
                    <span className='legend-modal-description'>
                      {QUESTION_TYPE_DESCRIPTIONS[type]} — couleur {color.label.toLowerCase()}.
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <footer className='modal-footer'>
          <button type='button' className='primary-button' onClick={onClose}>
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
};
