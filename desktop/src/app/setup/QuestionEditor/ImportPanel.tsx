import templatePack from '../../../data/questions/template-pack.json';
import { downloadJsonFile } from '../../utils/downloadJsonFile';

const AI_PROMPT = `Tu es un assistant qui transforme une carte GeniusBox en JSON strictement importable.
Analyse la photo et retourne uniquement un JSON valide (sans markdown) au format suivant:
[
  {
    "id": "card_custom_1",
    "title": "Titre de la carte",
    "type": "true_false | ranking | choice | free_text | free_number | free_color",
    "choices": ["choix 1", "choix 2"],
    "propositions": [
      { "id": "p_1", "text": "Proposition 1", "correctAnswer": "..." },
      { "id": "p_2", "text": "Proposition 2", "correctAnswer": "..." }
      // continuer jusqu'à 10 propositions
    ]
  }
]

Règles:
- Toujours 10 propositions.
- type=true_false => correctAnswer = "true" ou "false"
- type=ranking => correctAnswer = "1" à "10"
- type=choice => fournir "choices" (2 ou 3 valeurs) et chaque correctAnswer doit être une de ces valeurs
- type=free_text => correctAnswer texte libre.
- type=free_number => correctAnswer doit être un nombre (point ou virgule).
- type=free_color => correctAnswer parmi: rouge, bleu, vert, jaune, orange, violet, rose, noir, blanc, gris.
`;

type ImportFlow = 'none' | 'json_ready' | 'from_photo';

type ImportPanelProps = {
  importText: string;
  setImportText: (value: string) => void;
  importFlow: ImportFlow;
  setImportFlow: (value: ImportFlow) => void;
  onImport: () => void;
  onCopyAiPrompt: (prompt: string) => void;
  onTemplateDownloaded: () => void;
  onClose: () => void;
};

export const ImportPanel = ({
  importText,
  setImportText,
  importFlow,
  setImportFlow,
  onImport,
  onCopyAiPrompt,
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
            <button type='button' onClick={() => setImportFlow('from_photo')}>
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
      {importFlow === 'from_photo' ? (
        <>
          <p className='counter-text'>
            Prends une photo nette de la carte IRL, envoie-la à une IA, puis colle le JSON renvoyé
            ici pour l'import.
          </p>
          <textarea rows={12} readOnly value={AI_PROMPT} />
          <div className='inline-actions'>
            <button
              type='button'
              className='primary-button'
              onClick={() => onCopyAiPrompt(AI_PROMPT)}
            >
              Copier le prompt IA
            </button>
          </div>
          <textarea
            rows={10}
            placeholder="Colle ici le JSON retourné par l'IA."
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
          />
          <div className='inline-actions'>
            <button type='button' className='primary-button' onClick={onImport}>
              Importer le JSON IA (ajout)
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
