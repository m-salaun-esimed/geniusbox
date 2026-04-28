import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type ConfirmDialogOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type Resolver = (value: boolean) => void;
type Subscriber = (options: ConfirmDialogOptions, resolve: Resolver) => void;

let subscriber: Subscriber | null = null;

export const confirmDialog = (options: ConfirmDialogOptions): Promise<boolean> =>
  new Promise((resolve) => {
    if (!subscriber) {
      resolve(false);
      return;
    }
    subscriber(options, resolve);
  });

export const ConfirmDialogHost = () => {
  const [state, setState] = useState<{
    options: ConfirmDialogOptions;
    resolve: Resolver;
  } | null>(null);

  useEffect(() => {
    subscriber = (options, resolve) => setState({ options, resolve });
    return () => {
      subscriber = null;
    };
  }, []);

  useEffect(() => {
    if (!state) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        state.resolve(false);
        setState(null);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        state.resolve(true);
        setState(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state]);

  if (!state) {
    return null;
  }

  const { options, resolve } = state;
  const handle = (value: boolean) => {
    setState(null);
    resolve(value);
  };

  return createPortal(
    <div className='modal-backdrop' onClick={() => handle(false)}>
      <div
        className='modal-card decision-modal confirm-modal'
        role='alertdialog'
        aria-modal='true'
        onClick={(event) => event.stopPropagation()}
      >
        <h3>{options.title}</h3>
        {options.message ? <p className='confirm-modal-message'>{options.message}</p> : null}
        <div className='modal-actions'>
          <button type='button' onClick={() => handle(false)} autoFocus>
            {options.cancelLabel ?? 'Annuler'}
          </button>
          <button
            type='button'
            className={options.danger ? 'danger-button' : 'primary-button'}
            onClick={() => handle(true)}
          >
            {options.confirmLabel ?? 'Confirmer'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
