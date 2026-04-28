import { createPortal } from 'react-dom';

type EndMatchConfirmModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const EndMatchConfirmModal = ({ open, onCancel, onConfirm }: EndMatchConfirmModalProps) => {
  if (!open) {
    return null;
  }
  return createPortal(
    <div className='modal-backdrop' onClick={onCancel}>
      <div
        className='modal-card decision-modal'
        onClick={(event) => event.stopPropagation()}
      >
        <h3>Terminer la partie ?</h3>
        <p>
          La partie en cours sera arrêtée. Vous retournerez au setup avec les informations
          déjà remplies.
        </p>
        <div className='modal-actions'>
          <button type='button' onClick={onCancel}>
            Annuler
          </button>
          <button type='button' className='danger-button' onClick={onConfirm}>
            Terminer la partie
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
