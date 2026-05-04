import { useMemo, useState } from 'react';
import { useAppStore } from '../../store';
import { createSoundEffects } from '../../soundEffects';
import { QuestionType } from '../../../game-engine/types';
import { TypeLegendModal } from '../../components/TypeLegendModal';
import { DEFAULT_CHOICES, EMPTY_PROPOSITIONS, MIN_CHOICES } from '../../constants';
import { AiImportModal } from './AiImportModal';
import { CardEditorModal } from './CardEditorModal';
import { CardsGrid } from './CardsGrid';
import { ExportPanel } from './ExportPanel';
import { ImportPanel } from './ImportPanel';

type QuestionEditorProps = {
  currentStep: number;
};

export const QuestionEditor = ({ currentStep }: QuestionEditorProps) => {
  const { cards, addCard, updateCard, exportCards, importCards } = useAppStore();
  const sounds = useMemo(() => createSoundEffects(), []);
  const [title, setTitle] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('true_false');
  const [choices, setChoices] = useState<string[]>(DEFAULT_CHOICES);
  const [propositions, setPropositions] = useState(EMPTY_PROPOSITIONS('true_false'));
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');
  const [ioMode, setIoMode] = useState<'none' | 'export' | 'import'>('none');
  const [importFlow, setImportFlow] = useState<'none' | 'json_ready'>('none');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedExportCardIds, setSelectedExportCardIds] = useState<string[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [importError, setImportError] = useState('');
  const [isCardsMenuOpen, setIsCardsMenuOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const cardCountLabel = useMemo(() => `${cards.length} carte(s)`, [cards.length]);

  if (currentStep !== 1) {
    return null;
  }

  const toggleExportCard = (cardId: string) => {
    setSelectedExportCardIds((previous) =>
      previous.includes(cardId) ? previous.filter((id) => id !== cardId) : [...previous, cardId],
    );
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(successMessage);
      sounds.correct();
    } catch (_error) {
      setMessage('Impossible de copier automatiquement. Copie manuellement le texte affiché.');
      sounds.wrong();
    }
  };

  const choicesForSubmit = questionType === 'choice' ? choices : undefined;

  const handleCreate = () => {
    let error: string | null = null;
    try {
      error = addCard(title, questionType, propositions, choicesForSubmit);
    } catch (caughtError) {
      error = caughtError instanceof Error ? caughtError.message : 'Impossible de créer la carte.';
    }
    if (error) {
      setModalError(error);
      sounds.wrong();
      return;
    }
    setIsCreateModalOpen(false);
    setModalError('');
    setMessage('Carte créée avec succès.');
    setTitle('');
    setQuestionType('true_false');
    setChoices(DEFAULT_CHOICES);
    setPropositions(EMPTY_PROPOSITIONS('true_false'));
    sounds.correct();
  };

  const openEditModal = (cardId: string) => {
    const card = cards.find((item) => item.id === cardId);
    if (!card) return;
    setSelectedCardId(cardId);
    setTitle(card.title);
    setQuestionType(card.type);
    setChoices(card.choices && card.choices.length >= MIN_CHOICES ? [...card.choices] : DEFAULT_CHOICES);
    setPropositions(
      card.propositions.map((item) => ({
        text: item.text,
        correctAnswer: item.correctAnswer,
      })),
    );
    setModalError('');
    setIsEditModalOpen(true);
    sounds.openModal();
  };

  const handleUpdate = () => {
    if (!selectedCardId) {
      return;
    }
    const error = updateCard(selectedCardId, title, questionType, propositions, choicesForSubmit);
    if (error) {
      setModalError(error);
      sounds.wrong();
      return;
    }
    setIsEditModalOpen(false);
    setModalError('');
    setMessage('Carte modifiée avec succès.');
    sounds.correct();
  };

  const openCreateModal = () => {
    setTitle('');
    setQuestionType('true_false');
    setChoices(DEFAULT_CHOICES);
    setPropositions(EMPTY_PROPOSITIONS('true_false'));
    setModalError('');
    setIsCreateModalOpen(true);
    sounds.openModal();
  };

  const handleDownloadExport = () => {
    const exportable = cards.filter((card) => selectedExportCardIds.includes(card.id));
    if (exportable.length === 0) {
      setImportError('Sélectionne au moins une carte avant de télécharger.');
      sounds.wrong();
      return;
    }
    const payload = exportCards(exportable);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart10-cartes-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setImportError('');
    setMessage(`${exportable.length} carte(s) téléchargée(s) en JSON.`);
    setIoMode('none');
    sounds.navigate();
  };

  const handleImport = () => {
    const ok = importCards(importText);
    setMessage(ok ? 'Import réussi: cartes ajoutées à la base existante.' : '');
    setImportError(ok ? '' : 'JSON invalide : vérifie le format avant de réessayer.');
    if (ok) {
      sounds.correct();
    } else {
      sounds.wrong();
    }
  };

  return (
    <div className='panel'>
      <div className='cards-section-header'>
        <div>
          <h2>Cartes disponibles</h2>
          <p className='counter-text'>Base actuelle: {cardCountLabel}</p>
        </div>
        <div className='inline-actions'>
          <button
            type='button'
            className='icon-circle-button is-secondary'
            aria-label='Légende des couleurs'
            title='Légende des couleurs'
            onClick={() => {
              sounds.openModal();
              setIsLegendOpen(true);
            }}
          >
            ?
          </button>
          <button
            type='button'
            className='icon-circle-button'
            aria-label='Menu des cartes'
            title='Menu des cartes'
            onClick={() => setIsCardsMenuOpen((previous) => !previous)}
          >
            ≡
          </button>
          <button
            type='button'
            className='icon-circle-button'
            aria-label='Ajouter une carte'
            title='Ajouter une carte'
            onClick={openCreateModal}
          >
            +
          </button>
        </div>
      </div>
      {isCardsMenuOpen ? (
        <div className='cards-menu-popover'>
          <button
            type='button'
            className='primary-button'
            onClick={() => {
              setIoMode('export');
              setSelectedExportCardIds(cards.map((card) => card.id));
              setMessage('Mode export activé.');
              setIsCardsMenuOpen(false);
              sounds.navigate();
            }}
          >
            Exporter des cartes
          </button>
          <button
            type='button'
            onClick={() => {
              setIoMode('import');
              setImportFlow('none');
              setMessage('Mode import activé.');
              setIsCardsMenuOpen(false);
              sounds.navigate();
            }}
          >
            Importer des cartes
          </button>
        </div>
      ) : null}
      {message ? <p className='status-message'>{message}</p> : null}
      {importError ? <p className='status-message status-error'>{importError}</p> : null}

      <hr className='section-separator' />
      {ioMode === 'export' ? (
        <ExportPanel
          cards={cards}
          selectedExportCardIds={selectedExportCardIds}
          toggleExportCard={toggleExportCard}
          onToggleAll={() => {
            if (selectedExportCardIds.length === cards.length) {
              setSelectedExportCardIds([]);
            } else {
              setSelectedExportCardIds(cards.map((c) => c.id));
            }
            sounds.navigate();
          }}
          onDownload={handleDownloadExport}
          onClose={() => {
            setIoMode('none');
            sounds.navigate();
          }}
        />
      ) : null}
      {ioMode === 'import' ? (
        <ImportPanel
          importText={importText}
          setImportText={setImportText}
          importFlow={importFlow}
          setImportFlow={(flow) => {
            setImportFlow(flow);
            if (flow === 'json_ready') {
              setMessage('Mode import direct JSON.');
            }
            sounds.navigate();
          }}
          onImport={handleImport}
          onOpenAiModal={() => {
            setIsAiModalOpen(true);
            setMessage('Mode IA : génère le JSON depuis une photo.');
            sounds.openModal();
          }}
          onTemplateDownloaded={() => {
            setMessage(
              'Modèle JSON téléchargé (1 exemple par type). Ouvre le fichier pour voir le format attendu.',
            );
            sounds.navigate();
          }}
          onClose={() => {
            setIoMode('none');
            setImportFlow('none');
            sounds.navigate();
          }}
        />
      ) : null}

      <h3>Tableau des cartes</h3>
      <CardsGrid
        cards={cards}
        selectedCardId={selectedCardId}
        onOpen={openEditModal}
        onDeleted={(cardId) => {
          if (selectedCardId === cardId) {
            setSelectedCardId(null);
          }
        }}
      />

      <CardEditorModal
        mode='create'
        isOpen={isCreateModalOpen}
        modalError={modalError}
        title={title}
        setTitle={setTitle}
        questionType={questionType}
        setQuestionType={setQuestionType}
        choices={choices}
        setChoices={setChoices}
        propositions={propositions}
        setPropositions={setPropositions}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
      <CardEditorModal
        mode='edit'
        isOpen={isEditModalOpen}
        modalError={modalError}
        title={title}
        setTitle={setTitle}
        questionType={questionType}
        setQuestionType={setQuestionType}
        choices={choices}
        setChoices={setChoices}
        propositions={propositions}
        setPropositions={setPropositions}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdate}
      />
      <AiImportModal
        isOpen={isAiModalOpen}
        onClose={() => {
          setIsAiModalOpen(false);
          sounds.navigate();
        }}
        onCopyPrompt={(prompt) => copyToClipboard(prompt, 'Prompt IA copié.')}
        onSave={(card) => {
          const error = addCard(card.title, card.type, card.propositions, card.choices);
          if (error) {
            sounds.wrong();
            return error;
          }
          setIsAiModalOpen(false);
          setMessage('Carte créée via IA.');
          sounds.correct();
          return null;
        }}
      />
      {isLegendOpen ? <TypeLegendModal onClose={() => setIsLegendOpen(false)} /> : null}
    </div>
  );
};
