import { useMemo, useState } from 'react';
import { useAppStore } from '../store';
import { createSoundEffects } from '../soundEffects';
import { confirmDialog } from '../confirmModal';
import { QUESTION_TYPE_COLOR, QUESTION_TYPE_LABELS } from '../questionTypeColors';

export const MatchOrderSection = () => {
  const {
    cards,
    savedPaths,
    selectedCardIdsForMatch,
    addCardToMatchSelection,
    removeCardFromMatchSelection,
    moveSelectedCardInMatch,
    setCardSelectionForMatch,
    createPathFromSelection,
    updatePathFromSelection,
    deletePath,
  } = useAppStore();
  const [matchMessage, setMatchMessage] = useState('');
  const [pathName, setPathName] = useState('');
  const [pathCategory, setPathCategory] = useState('');
  const [selectedPathId, setSelectedPathId] = useState<string>('');
  const [pathModalMode, setPathModalMode] = useState<'none' | 'create' | 'edit' | 'view'>('none');
  const [pathModalError, setPathModalError] = useState('');
  const sounds = useMemo(() => createSoundEffects(), []);
  const selectedCards = selectedCardIdsForMatch
    .map((selectedId) => cards.find((card) => card.id === selectedId))
    .filter((card): card is (typeof cards)[number] => Boolean(card));
  const availableCards = cards.filter((card) => !selectedCardIdsForMatch.includes(card.id));

  const loadPath = (pathId: string) => {
    const path = savedPaths.find((item) => item.id === pathId);
    if (!path) {
      return;
    }
    setSelectedPathId(path.id);
    setPathName(path.name);
    setPathCategory(path.category);
    setCardSelectionForMatch(path.cardIds);
  };

  const closePathModal = () => {
    setPathModalMode('none');
    setPathModalError('');
  };

  const openCreatePathModal = () => {
    setSelectedPathId('');
    setPathName('');
    setPathCategory('');
    setCardSelectionForMatch([]);
    setPathModalError('');
    setPathModalMode('create');
    sounds.openModal();
  };

  const openViewPathModal = (pathId: string) => {
    const path = savedPaths.find((item) => item.id === pathId);
    if (!path) {
      setMatchMessage('Parcours introuvable.');
      sounds.wrong();
      return;
    }
    loadPath(path.id);
    setPathModalError('');
    setPathModalMode('view');
    sounds.openModal();
  };

  const savePathFromModal = () => {
    if (pathModalMode === 'create') {
      const error = createPathFromSelection(pathName, pathCategory);
      if (error) {
        setPathModalError(error);
        sounds.wrong();
        return;
      }
      setMatchMessage('Parcours créé.');
      closePathModal();
      sounds.correct();
      return;
    }

    if (pathModalMode === 'edit') {
      if (!selectedPathId) {
        setPathModalError('Sélectionne un parcours à mettre à jour.');
        sounds.wrong();
        return;
      }
      const error = updatePathFromSelection(selectedPathId, pathName, pathCategory);
      if (error) {
        setPathModalError(error);
        sounds.wrong();
        return;
      }
      setMatchMessage('Parcours mis à jour.');
      closePathModal();
      sounds.correct();
    }
  };

  const deleteSelectedPathFromModal = async () => {
    if (!selectedPathId) {
      setPathModalError('Sélectionne un parcours à supprimer.');
      sounds.wrong();
      return;
    }
    const targetName = savedPaths.find((p) => p.id === selectedPathId)?.name ?? 'ce parcours';
    sounds.openModal();
    const confirmed = await confirmDialog({
      title: 'Supprimer ce parcours ?',
      message: `« ${targetName} » sera retiré de tes parcours sauvegardés.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    deletePath(selectedPathId);
    setSelectedPathId('');
    setPathName('');
    setPathCategory('');
    setCardSelectionForMatch([]);
    setMatchMessage('Parcours supprimé.');
    closePathModal();
    sounds.wrong();
  };

  return (
    <div className='panel'>
      <h2>Parcours</h2>
      <p className='counter-text'>
        Choisis un parcours pour la partie, ou ouvre une modale pour le créer/modifier.
      </p>
      <div className='inline-actions'>
        <button type='button' className='primary-button' onClick={openCreatePathModal}>
          Créer un parcours
        </button>
      </div>
      <ul className='question-list'>
        {savedPaths.map((path) => (
          <li
            key={path.id}
            className={selectedPathId === path.id ? 'card-item is-active' : 'card-item'}
            role='button'
            tabIndex={0}
            onClick={() => {
              sounds.click();
              loadPath(path.id);
              setMatchMessage(`Parcours sélectionné: ${path.name}.`);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                sounds.click();
                loadPath(path.id);
                setMatchMessage(`Parcours sélectionné: ${path.name}.`);
              }
            }}
          >
            <div className='card-item-content'>
              <strong>{path.name}</strong>
              <span>
                {path.category} · {path.cardIds.length} carte(s)
              </span>
            </div>
            <div className='inline-actions'>
              <button
                type='button'
                onClick={(event) => {
                  event.stopPropagation();
                  sounds.click();
                  openViewPathModal(path.id);
                }}
              >
                Voir
              </button>
              <button
                type='button'
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedPathId(path.id);
                  setPathName(path.name);
                  setPathCategory(path.category);
                  setCardSelectionForMatch(path.cardIds);
                  setPathModalError('');
                  setPathModalMode('edit');
                  sounds.openModal();
                }}
              >
                Modifier
              </button>
              <button
                type='button'
                className='danger-button'
                onClick={async (event) => {
                  event.stopPropagation();
                  sounds.openModal();
                  const confirmed = await confirmDialog({
                    title: 'Supprimer ce parcours ?',
                    message: `« ${path.name} » sera retiré de tes parcours sauvegardés.`,
                    confirmLabel: 'Supprimer',
                    danger: true,
                  });
                  if (!confirmed) {
                    return;
                  }
                  deletePath(path.id);
                  if (selectedPathId === path.id) {
                    setSelectedPathId('');
                    setPathName('');
                    setPathCategory('');
                    setCardSelectionForMatch([]);
                  }
                  setMatchMessage('Parcours supprimé.');
                  sounds.wrong();
                }}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
      {matchMessage ? <p className='status-message'>{matchMessage}</p> : null}
      {pathModalMode !== 'none' ? (
        <div className='modal-backdrop' onClick={closePathModal}>
          <div className='modal-card' onClick={(event) => event.stopPropagation()}>
            <h3>
              {pathModalMode === 'create'
                ? 'Créer un parcours'
                : pathModalMode === 'edit'
                  ? 'Modifier le parcours'
                  : 'Voir le parcours'}
            </h3>
            {pathModalError ? <div className='modal-alert'>{pathModalError}</div> : null}
            <label htmlFor='path-name-input'>Nom du parcours</label>
            <input
              id='path-name-input'
              value={pathName}
              placeholder='Ex: Histoire rapide'
              readOnly={pathModalMode === 'view'}
              onChange={(event) => setPathName(event.target.value)}
            />
            <label htmlFor='path-category-input'>Catégorie générale</label>
            <input
              id='path-category-input'
              value={pathCategory}
              placeholder='Ex: Culture générale'
              readOnly={pathModalMode === 'view'}
              onChange={(event) => setPathCategory(event.target.value)}
            />
            <div className='launch-grid'>
              {pathModalMode !== 'view' ? (
                <div>
                  <h4>Cartes disponibles</h4>
                  <ul className='compact-list'>
                    {availableCards.map((card) => (
                      <li key={`available_${card.id}`}>
                        <span
                          className='compact-card-label'
                          title={QUESTION_TYPE_LABELS[card.type]}
                        >
                          <span
                            className='type-badge-dot'
                            aria-hidden='true'
                            style={{
                              ['--type-color' as string]: QUESTION_TYPE_COLOR[card.type].hex,
                            }}
                          />
                          {card.title}
                        </span>
                        <button
                          type='button'
                          onClick={() => {
                            addCardToMatchSelection(card.id);
                            sounds.click();
                          }}
                        >
                          Ajouter
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div>
                <h4>Cartes du parcours</h4>
                <ul className='compact-list'>
                  {selectedCards.map((card, index) => (
                    <li key={`selected_${card.id}`}>
                      <span
                        className='compact-card-label'
                        title={QUESTION_TYPE_LABELS[card.type]}
                      >
                        <span
                          className='type-badge-dot'
                          aria-hidden='true'
                          style={{
                            ['--type-color' as string]: QUESTION_TYPE_COLOR[card.type].hex,
                          }}
                        />
                        {index + 1}. {card.title}
                      </span>
                      {pathModalMode !== 'view' ? (
                        <div className='inline-actions'>
                          <button
                            type='button'
                            onClick={() => moveSelectedCardInMatch(card.id, 'up')}
                          >
                            ↑
                          </button>
                          <button
                            type='button'
                            onClick={() => moveSelectedCardInMatch(card.id, 'down')}
                          >
                            ↓
                          </button>
                          <button
                            type='button'
                            onClick={() => removeCardFromMatchSelection(card.id)}
                          >
                            Retirer
                          </button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className='modal-actions'>
              {pathModalMode === 'edit' ? (
                <button
                  type='button'
                  className='danger-button'
                  onClick={deleteSelectedPathFromModal}
                >
                  Supprimer
                </button>
              ) : null}
              <button type='button' onClick={closePathModal}>
                {pathModalMode === 'view' ? 'Fermer' : 'Annuler'}
              </button>
              {pathModalMode !== 'view' ? (
                <button type='button' className='primary-button' onClick={savePathFromModal}>
                  {pathModalMode === 'create' ? 'Créer le parcours' : 'Enregistrer'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
