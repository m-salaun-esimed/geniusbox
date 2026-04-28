import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [cardSearch, setCardSearch] = useState('');
  const [pathSearch, setPathSearch] = useState('');
  const sounds = useMemo(() => createSoundEffects(), []);

  const normalizedPathQuery = pathSearch.trim().toLowerCase();
  const filteredSavedPaths = normalizedPathQuery
    ? savedPaths.filter((path) =>
        `${path.name} ${path.category}`.toLowerCase().includes(normalizedPathQuery),
      )
    : savedPaths;

  const selectedCards = selectedCardIdsForMatch
    .map((selectedId) => cards.find((card) => card.id === selectedId))
    .filter((card): card is (typeof cards)[number] => Boolean(card));
  const availableCards = cards.filter((card) => !selectedCardIdsForMatch.includes(card.id));
  const normalizedQuery = cardSearch.trim().toLowerCase();
  const filteredAvailableCards = normalizedQuery
    ? availableCards.filter((card) =>
        `${card.title} ${QUESTION_TYPE_LABELS[card.type]}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : availableCards;

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
    setCardSearch('');
  };

  const openCreatePathModal = () => {
    setSelectedPathId('');
    setPathName('');
    setPathCategory('');
    setCardSelectionForMatch([]);
    setPathModalError('');
    setCardSearch('');
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
    setCardSearch('');
    setPathModalMode('view');
    sounds.openModal();
  };

  const openEditPathModal = (pathId: string) => {
    const path = savedPaths.find((item) => item.id === pathId);
    if (!path) {
      return;
    }
    setSelectedPathId(path.id);
    setPathName(path.name);
    setPathCategory(path.category);
    setCardSelectionForMatch(path.cardIds);
    setPathModalError('');
    setCardSearch('');
    setPathModalMode('edit');
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

  const modalTitle =
    pathModalMode === 'create'
      ? 'Nouveau parcours'
      : pathModalMode === 'edit'
        ? 'Modifier le parcours'
        : 'Aperçu du parcours';

  const modalSubtitle =
    pathModalMode === 'create'
      ? 'Donne un nom à ton parcours, puis enchaîne tes cartes dans l’ordre.'
      : pathModalMode === 'edit'
        ? 'Réorganise les cartes ou modifie le titre et la catégorie.'
        : 'Visualisation seule — utilise « Modifier » pour ajuster ce parcours.';

  return (
    <div className='panel parcours-panel'>
      <header className='parcours-hero'>
        <div className='parcours-hero-text'>
          <h2>Parcours</h2>
          <p className='counter-text'>
            Compose un enchaînement de cartes. Sélectionne un parcours existant pour la partie, ou
            crées-en un nouveau.
          </p>
        </div>
        <button
          type='button'
          className='primary-button parcours-create-cta'
          onClick={openCreatePathModal}
        >
          <span className='parcours-create-cta-icon' aria-hidden='true'>
            +
          </span>
          Nouveau parcours
        </button>
      </header>

      {savedPaths.length === 0 ? (
        <div className='parcours-empty'>
          <div className='parcours-empty-glyph' aria-hidden='true'>
            <span />
            <span />
            <span />
          </div>
          <h3>Aucun parcours pour l’instant</h3>
          <p>Compose ta première suite de cartes pour démarrer une partie en mode parcours.</p>
          <button
            type='button'
            className='primary-button parcours-empty-cta'
            onClick={openCreatePathModal}
          >
            Créer mon premier parcours
          </button>
        </div>
      ) : (
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
              value={pathSearch}
              onChange={(event) => setPathSearch(event.target.value)}
              placeholder='Rechercher un parcours par nom ou catégorie...'
              aria-label='Rechercher un parcours'
            />
            {pathSearch ? (
              <button
                type='button'
                className='parcours-search-clear'
                aria-label='Effacer la recherche'
                onClick={() => setPathSearch('')}
              >
                ×
              </button>
            ) : null}
          </div>
          {filteredSavedPaths.length === 0 ? (
            <div className='parcours-pane-empty'>
              Aucun parcours ne correspond à « {pathSearch} ».
            </div>
          ) : (
            <ul className='parcours-grid'>
              {filteredSavedPaths.map((path) => {
            const pathCards = path.cardIds
              .map((id) => cards.find((card) => card.id === id))
              .filter((card): card is (typeof cards)[number] => Boolean(card));
            const uniqueTypes = Array.from(new Set(pathCards.map((card) => card.type)));
            const isActive = selectedPathId === path.id;
            return (
              <li
                key={path.id}
                className={isActive ? 'parcours-tile is-active' : 'parcours-tile'}
                role='button'
                tabIndex={0}
                onClick={() => {
                  sounds.click();
                  loadPath(path.id);
                  setMatchMessage(`Parcours sélectionné : ${path.name}.`);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    sounds.click();
                    loadPath(path.id);
                    setMatchMessage(`Parcours sélectionné : ${path.name}.`);
                  }
                }}
              >
                <div className='parcours-tile-top'>
                  <div className='parcours-tile-name'>
                    <strong>{path.name}</strong>
                    {path.category ? (
                      <span className='parcours-tile-category'>{path.category}</span>
                    ) : (
                      <span className='parcours-tile-category parcours-tile-category--muted'>
                        Sans catégorie
                      </span>
                    )}
                  </div>
                  <span
                    className={
                      isActive
                        ? 'parcours-status-pill is-active'
                        : 'parcours-status-pill'
                    }
                    aria-hidden='true'
                  >
                    {isActive ? '✓ Choisi' : 'Sélectionner'}
                  </span>
                </div>

                <div className='parcours-tile-fingerprint' aria-hidden='true'>
                  {pathCards.length === 0 ? (
                    <span className='parcours-fingerprint-empty'>Parcours vide</span>
                  ) : (
                    pathCards.slice(0, 16).map((card, index) => (
                      <span
                        key={`fp_${path.id}_${index}`}
                        className='parcours-fingerprint-dot'
                        style={{
                          ['--type-color' as string]: QUESTION_TYPE_COLOR[card.type].hex,
                        }}
                      />
                    ))
                  )}
                  {pathCards.length > 16 ? (
                    <span className='parcours-fingerprint-more'>+{pathCards.length - 16}</span>
                  ) : null}
                </div>

                <div className='parcours-tile-meta'>
                  <span className='parcours-meta-chip'>
                    <strong>{path.cardIds.length}</strong>
                    {path.cardIds.length > 1 ? 'cartes' : 'carte'}
                  </span>
                  <span className='parcours-meta-chip'>
                    <strong>{uniqueTypes.length}</strong>
                    {uniqueTypes.length > 1 ? 'types' : 'type'}
                  </span>
                </div>

                <div className='parcours-tile-actions'>
                  <button
                    type='button'
                    className='parcours-tile-button'
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
                    className='parcours-tile-button'
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditPathModal(path.id);
                    }}
                  >
                    Modifier
                  </button>
                  <button
                    type='button'
                    className='parcours-tile-button parcours-tile-button--danger'
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
            );
          })}
            </ul>
          )}
        </>
      )}

      {matchMessage ? <p className='status-message'>{matchMessage}</p> : null}

      {pathModalMode !== 'none'
        ? createPortal(
            <div className='modal-backdrop' onClick={closePathModal}>
          <div
            className='modal-card modal-card--framed parcours-modal'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='modal-header'>
              <div className='modal-header-text'>
                <h3>{modalTitle}</h3>
                <p className='modal-subtitle'>{modalSubtitle}</p>
              </div>
              <button
                type='button'
                className='modal-close'
                aria-label='Fermer'
                onClick={closePathModal}
              >
                ×
              </button>
            </div>

            <div className='modal-body'>
              {pathModalError ? <div className='modal-alert'>{pathModalError}</div> : null}

              <div className='parcours-form-grid'>
                <div>
                  <label htmlFor='path-name-input'>Nom du parcours</label>
                  <input
                    id='path-name-input'
                    value={pathName}
                    placeholder='Ex : Histoire rapide'
                    readOnly={pathModalMode === 'view'}
                    onChange={(event) => setPathName(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor='path-category-input'>Catégorie générale</label>
                  <input
                    id='path-category-input'
                    value={pathCategory}
                    placeholder='Ex : Culture générale'
                    readOnly={pathModalMode === 'view'}
                    onChange={(event) => setPathCategory(event.target.value)}
                  />
                </div>
              </div>

              <div
                className={
                  pathModalMode === 'view'
                    ? 'parcours-builder is-view'
                    : 'parcours-builder'
                }
              >
                {pathModalMode !== 'view' ? (
                  <section className='parcours-builder-pane'>
                    <header className='parcours-builder-pane-header'>
                      <h4>Cartes disponibles</h4>
                      <span className='parcours-pane-count'>{availableCards.length}</span>
                    </header>
                    <div className='parcours-search'>
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
                    {availableCards.length === 0 ? (
                      <div className='parcours-pane-empty'>
                        Toutes les cartes sont déjà dans ce parcours.
                      </div>
                    ) : filteredAvailableCards.length === 0 ? (
                      <div className='parcours-pane-empty'>
                        Aucune carte ne correspond à « {cardSearch} ».
                      </div>
                    ) : (
                      <ul className='parcours-builder-list'>
                        {filteredAvailableCards.map((card) => (
                          <li key={`available_${card.id}`} className='parcours-builder-row'>
                            <span
                              className='type-badge-dot'
                              aria-hidden='true'
                              style={{
                                ['--type-color' as string]:
                                  QUESTION_TYPE_COLOR[card.type].hex,
                              }}
                            />
                            <span
                              className='parcours-builder-title'
                              title={QUESTION_TYPE_LABELS[card.type]}
                            >
                              {card.title}
                            </span>
                            <button
                              type='button'
                              className='parcours-add-button'
                              aria-label={`Ajouter ${card.title}`}
                              onClick={() => {
                                addCardToMatchSelection(card.id);
                                sounds.click();
                              }}
                            >
                              +
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ) : null}

                <section className='parcours-builder-pane parcours-builder-pane--selected'>
                  <header className='parcours-builder-pane-header'>
                    <h4>
                      {pathModalMode === 'view' ? 'Cartes du parcours' : 'Ordre du parcours'}
                    </h4>
                    <span className='parcours-pane-count parcours-pane-count--accent'>
                      {selectedCards.length}
                    </span>
                  </header>
                  {selectedCards.length === 0 ? (
                    <div className='parcours-pane-empty'>
                      {pathModalMode === 'view'
                        ? 'Ce parcours ne contient aucune carte.'
                        : 'Ajoute des cartes depuis la colonne de gauche pour composer le parcours.'}
                    </div>
                  ) : (
                    <ol className='parcours-order-list'>
                      {selectedCards.map((card, index) => (
                        <li key={`selected_${card.id}`} className='parcours-order-row'>
                          <span
                            className='parcours-order-pill'
                            style={{
                              ['--type-color' as string]:
                                QUESTION_TYPE_COLOR[card.type].hex,
                            }}
                          >
                            {index + 1}
                          </span>
                          <div className='parcours-order-text'>
                            <span
                              className='parcours-order-title'
                              title={QUESTION_TYPE_LABELS[card.type]}
                            >
                              {card.title}
                            </span>
                            <span className='parcours-order-type'>
                              {QUESTION_TYPE_LABELS[card.type]}
                            </span>
                          </div>
                          {pathModalMode !== 'view' ? (
                            <div className='parcours-order-actions'>
                              <button
                                type='button'
                                className='parcours-icon-button'
                                aria-label='Monter'
                                disabled={index === 0}
                                onClick={() => moveSelectedCardInMatch(card.id, 'up')}
                              >
                                ↑
                              </button>
                              <button
                                type='button'
                                className='parcours-icon-button'
                                aria-label='Descendre'
                                disabled={index === selectedCards.length - 1}
                                onClick={() => moveSelectedCardInMatch(card.id, 'down')}
                              >
                                ↓
                              </button>
                              <button
                                type='button'
                                className='parcours-icon-button parcours-icon-button--danger'
                                aria-label='Retirer'
                                onClick={() => removeCardFromMatchSelection(card.id)}
                              >
                                ×
                              </button>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>
            </div>

            <div className='modal-footer'>
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
        </div>,
            document.body,
          )
        : null}
    </div>
  );
};
