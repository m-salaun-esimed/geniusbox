import templatePack from '../../../data/questions/template-pack.json';
import { downloadJsonFile } from '../../utils/downloadJsonFile';

type ImportFlow = 'none' | 'json_ready';

type ImportPanelProps = {
  importText: string;
  setImportText: (value: string) => void;
  importFlow: ImportFlow;
  setImportFlow: (value: ImportFlow) => void;
  onImport: () => void;
  onOpenAiModal: () => void;
  onTemplateDownloaded: () => void;
  onClose: () => void;
};

export const ImportPanel = ({
  importText,
  setImportText,
  importFlow,
  setImportFlow,
  onImport,
  onOpenAiModal,
  onTemplateDownloaded,
  onClose,
}: ImportPanelProps) => {
  return (
    <div className='panel'>
      <h4>Page Import JSON</h4>
      {importFlow === 'none' ? (
        <>
          <p className='counter-text'>Choisis comment tu veux importer des cartes.</p>
          <div className='choice-row'>
            <button
              type='button'
              className='primary-button'
              onClick={() => setImportFlow('json_ready')}
            >
              J'ai déjà un JSON prêt à importer
            </button>
            <button type='button' onClick={onOpenAiModal}>
              J'ai une photo de carte et je veux générer le JSON
            </button>
          </div>
          <div className='secondary-actions'>
            <button
              type='button'
              onClick={() => {
                downloadJsonFile(templatePack, 'smart10-template.json');
                onTemplateDownloaded();
              }}
            >
              Télécharger un modèle JSON
            </button>
          </div>
        </>
      ) : null}
      {importFlow === 'json_ready' ? (
        <>
          <p className='counter-text'>
            Colle un tableau JSON de cartes puis importe. Les cartes importées sont AJOUTÉES, jamais
            remplacées.
          </p>
          <textarea
            rows={10}
            placeholder='Colle ici un tableau JSON de cartes à importer.'
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
          />
          <div className='inline-actions'>
            <button type='button' className='primary-button' onClick={onImport}>
              Importer (ajout)
            </button>
          </div>
        </>
      ) : null}
      <div className='secondary-actions'>
        {importFlow !== 'none' ? (
          <button type='button' onClick={() => setImportFlow('none')}>
            Retour au choix
          </button>
        ) : null}
        <button type='button' onClick={onClose}>
          Retour
        </button>
      </div>
    </div>
  );
};
