import { useState } from 'react';
import { createPortal } from 'react-dom';
import { QuestionCard, QuestionType } from '../../../game-engine/types';
import { validateCardDetailed } from '../../../storage/questionPacks';
import { QUESTION_TYPE_COLOR, QUESTION_TYPE_LABELS } from '../../questionTypeColors';

const formatAnswer = (type: QuestionType, value: string): string => {
  if (type === 'true_false') {
    return value === 'true' ? 'Vrai' : value === 'false' ? 'Faux' : value;
  }
  if (type === 'ranking') {
    return `Position ${value}`;
  }
  if (type === 'free_color') {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return value;
};

const AI_PROMPT = `Tu es un assistant qui transforme la photo d'une carte de quiz  en un objet JSON strictement importable.

Tu reçois UNE image. Tu DOIS retourner UNIQUEMENT un objet JSON (pas de tableau, pas de markdown, pas de texte autour, pas de bloc \`\`\`json).

SCHÉMA STRICT (un seul objet) :
{
  "title": "Titre exact de la carte",
  "type": "true_false" | "ranking" | "choice" | "free_text" | "free_number" | "free_color",
  "choices": ["valeur 1", "valeur 2"],          // UNIQUEMENT si type=choice (2 ou 3 valeurs), sinon ne pas inclure ce champ
  "propositions": [
    { "id": "p_1", "text": "Texte de la proposition 1", "correctAnswer": "..." },
    { "id": "p_2", "text": "Texte de la proposition 2", "correctAnswer": "..." }
    // ... continuer jusqu'à exactement 10 propositions, ni plus ni moins
  ]
}

RÈGLES PAR TYPE (correctAnswer doit respecter strictement le format) :
- type=true_false  → correctAnswer = "true" ou "false"
- type=ranking     → correctAnswer = un entier en chaîne, "1" à "10"
- type=choice      → fournir "choices" (2 ou 3 valeurs) ; chaque correctAnswer DOIT être copié exactement depuis "choices"
- type=free_text   → correctAnswer = la réponse textuelle attendue (court, sans accent superflu)
- type=free_number → correctAnswer = un nombre en chaîne (point ou virgule décimale acceptés)
- type=free_color  → correctAnswer parmi : rouge, bleu, vert, jaune, orange, violet, rose, noir, blanc, gris

CONTRAINTES ABSOLUES :
- Toujours EXACTEMENT 10 propositions.
- Pas de commentaires JSON, pas de //, pas de ...
- Pas de texte avant ni après le JSON.
- Ne traduis pas, ne reformule pas : recopie le texte de la carte tel qu'il apparaît.

CAS IMAGE INUTILISABLE :
Si l'image est floue, ne contient pas une carte, est ambiguë, ou ne te permet pas de remplir 10 propositions de façon fiable, NE PAS INVENTER.
Retourne uniquement cet objet, sans rien d'autre :
{ "error": "motif court en français expliquant pourquoi tu ne peux pas extraire la carte" }
`;

type Verdict =
  | { kind: 'idle' }
  | { kind: 'valid'; card: QuestionCard }
  | { kind: 'invalid'; errors: string[] }
  | { kind: 'ai_refused'; reason: string }
  | { kind: 'parse_error'; message: string };

type AiImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: QuestionCard) => string | null;
  onCopyPrompt: (prompt: string) => void;
};

export const AiImportModal = ({ isOpen, onClose, onSave, onCopyPrompt }: AiImportModalProps) => {
  const [jsonText, setJsonText] = useState('');
  const [verdict, setVerdict] = useState<Verdict>({ kind: 'idle' });
  const [saveError, setSaveError] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setJsonText('');
    setVerdict({ kind: 'idle' });
    setSaveError('');
    onClose();
  };

  const handleVerify = () => {
    setSaveError('');
    const trimmed = jsonText.trim();
    if (!trimmed) {
      setVerdict({
        kind: 'parse_error',
        message: "Colle le JSON renvoyé par l'IA dans la zone ci-dessus.",
      });
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'JSON invalide.';
      setVerdict({ kind: 'parse_error', message });
      return;
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      'error' in parsed &&
      typeof (parsed as { error: unknown }).error === 'string'
    ) {
      setVerdict({ kind: 'ai_refused', reason: (parsed as { error: string }).error });
      return;
    }
    const result = validateCardDetailed(parsed);
    if (result.valid) {
      setVerdict({ kind: 'valid', card: result.card });
    } else {
      setVerdict({ kind: 'invalid', errors: result.errors });
    }
  };

  const handleSave = () => {
    if (verdict.kind !== 'valid') {
      return;
    }
    const error = onSave(verdict.card);
    if (error) {
      setSaveError(error);
      return;
    }
    setJsonText('');
    setVerdict({ kind: 'idle' });
    setSaveError('');
  };

  const canSave = verdict.kind === 'valid';

  return createPortal(
    <div className='modal-backdrop' onClick={handleClose}>
      <div className='modal-card modal-card--framed' onClick={(event) => event.stopPropagation()}>
        <header className='modal-header'>
          <div className='modal-header-text'>
            <h3>Créer une carte avec l'IA</h3>
            <p className='modal-subtitle'>
              Génère le JSON d'une carte à partir d'une photo en t'appuyant sur une IA externe.
            </p>
          </div>
          <button type='button' className='modal-close' aria-label='Fermer' onClick={handleClose}>
            ×
          </button>
        </header>
        <div className='modal-body'>
          <section className='ai-import-section'>
            <h4>Mode d'emploi</h4>
            <ol className='ai-import-steps'>
              <li>Ouvre une IA multimodale (Claude, Gemini, ChatGPT…).</li>
              <li>Copie le prompt ci-dessous et colle-le dans la conversation.</li>
              <li>Joins la photo de la carte dans le même message.</li>
              <li>Lance la génération.</li>
              <li>Copie le JSON renvoyé par l'IA (uniquement le JSON).</li>
              <li>Colle-le dans la zone « JSON de l'IA », vérifie, puis enregistre.</li>
            </ol>
          </section>

          <section className='ai-import-section'>
            <div className='ai-import-section-header'>
              <h4>Prompt à copier</h4>
              <button
                type='button'
                className='primary-button'
                onClick={() => onCopyPrompt(AI_PROMPT)}
              >
                Copier le prompt
              </button>
            </div>
            <textarea rows={10} readOnly value={AI_PROMPT} />
          </section>

          <section className='ai-import-section'>
            <div className='ai-import-section-header'>
              <h4>JSON de l'IA</h4>
              <button type='button' onClick={handleVerify}>
                Vérifier le JSON
              </button>
            </div>
            <textarea
              rows={10}
              placeholder="Colle ici le JSON renvoyé par l'IA (objet unique)."
              value={jsonText}
              onChange={(event) => {
                setJsonText(event.target.value);
                if (verdict.kind !== 'idle') {
                  setVerdict({ kind: 'idle' });
                }
                if (saveError) {
                  setSaveError('');
                }
              }}
            />
          </section>

          {verdict.kind === 'valid' ? (
            <section className='ai-import-section ai-import-preview'>
              <div className='ai-import-section-header'>
                <h4>Aperçu de la carte</h4>
                <span className='modal-alert--success-pill'>JSON valide</span>
              </div>
              <p className='counter-text'>
                Vérifie le titre, le type et chaque réponse avant d'enregistrer.
              </p>
              <div
                className='card-tile has-type-stripe ai-import-preview-tile'
                style={{ ['--type-color' as string]: QUESTION_TYPE_COLOR[verdict.card.type].hex }}
              >
                <div className='card-tile-header'>
                  <strong>{verdict.card.title}</strong>
                  <span className='type-badge' title={QUESTION_TYPE_LABELS[verdict.card.type]}>
                    <span className='type-badge-dot' aria-hidden='true' />
                    {QUESTION_TYPE_LABELS[verdict.card.type]}
                  </span>
                </div>
                {verdict.card.choices ? (
                  <p className='counter-text ai-import-preview-choices'>
                    Choix possibles : {verdict.card.choices.join(' • ')}
                  </p>
                ) : null}
                <ol className='ai-import-preview-list'>
                  {verdict.card.propositions.map((proposition, index) => (
                    <li key={proposition.id}>
                      <span className='ai-import-preview-text'>
                        <span className='ai-import-preview-index'>{index + 1}.</span>
                        {proposition.text}
                      </span>
                      <span className='ai-import-preview-answer'>
                        {formatAnswer(verdict.card.type, proposition.correctAnswer)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          ) : null}
          {verdict.kind === 'invalid' ? (
            <div className='modal-alert'>
              <strong>JSON invalide. Corrige ces points avant d'enregistrer :</strong>
              <ul>
                {verdict.errors.map((error, index) => (
                  <li key={`ai_err_${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {verdict.kind === 'parse_error' ? (
            <div className='modal-alert'>
              <strong>JSON impossible à analyser :</strong> {verdict.message}
            </div>
          ) : null}
          {verdict.kind === 'ai_refused' ? (
            <div className='modal-alert'>
              <strong>L'IA n'a pas pu lire la carte :</strong> {verdict.reason}
              <p className='counter-text'>
                Reprends une photo plus nette ou mieux cadrée puis recommence.
              </p>
            </div>
          ) : null}
          {saveError ? <div className='modal-alert'>{saveError}</div> : null}
        </div>
        <footer className='modal-footer'>
          <button type='button' onClick={handleClose}>
            Annuler
          </button>
          <button type='button' className='primary-button' onClick={handleSave} disabled={!canSave}>
            Enregistrer la carte
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
};
