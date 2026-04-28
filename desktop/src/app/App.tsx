import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from './store';
import { createSoundEffects } from './soundEffects';
import { STEPS } from './constants';
import { StepHeader } from './components/StepHeader';
import { PlayersSection } from './setup/PlayersSection';
import { GameModeSection } from './setup/GameModeSection';
import { FlashCardSection } from './setup/FlashCardSection';
import { MatchOrderSection } from './setup/MatchOrderSection';
import { QuestionEditor } from './setup/QuestionEditor';
import { InRoundView } from './game/InRoundView';
import { RoundSummaryView } from './game/RoundSummaryView';
import { FinishedView } from './game/FinishedView';

export const App = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupError, setSetupError] = useState('');
  const [endMatchConfirmOpen, setEndMatchConfirmOpen] = useState(false);
  const { matchState, gameMode, startMatch, terminateMatch } = useAppStore();
  const sounds = useMemo(() => createSoundEffects(), []);
  const previousPhaseRef = useRef<string | null>(null);

  useEffect(() => {
    const phase = matchState?.phase ?? null;
    const previous = previousPhaseRef.current;
    if (phase && phase !== previous) {
      if (phase === 'round_summary') {
        sounds.roundEnd();
      }
      if (phase === 'finished') {
        sounds.gameEnd();
      }
    }
    previousPhaseRef.current = phase;
  }, [matchState?.phase, sounds]);

  const confirmEndMatch = () => {
    sounds.openModal();
    setEndMatchConfirmOpen(true);
  };

  const cancelEndMatch = () => {
    sounds.navigate();
    setEndMatchConfirmOpen(false);
  };

  const acceptEndMatch = () => {
    sounds.click();
    setEndMatchConfirmOpen(false);
    terminateMatch();
  };

  const endMatchProps = {
    onConfirmEndMatch: confirmEndMatch,
    endMatchConfirmOpen,
    onCancelEndMatch: cancelEndMatch,
    onAcceptEndMatch: acceptEndMatch,
  };

  if (matchState?.phase === 'in_round') {
    return <InRoundView {...endMatchProps} />;
  }

  if (matchState?.phase === 'round_summary') {
    return <RoundSummaryView {...endMatchProps} />;
  }

  if (matchState?.phase === 'finished') {
    return <FinishedView onAcceptEndMatch={acceptEndMatch} />;
  }

  return (
    <main className='setup-main'>
      <section className='editor-card setup-shell'>
        <div className='setup-fixed-top'>
          <header className='editor-header'>
            <h1>GeniusBox</h1>
            <p>Configuration de partie puis lancement.</p>
          </header>
          <StepHeader currentStep={currentStep} setCurrentStep={setCurrentStep} />
        </div>
        <div className='setup-scroll'>
          <div className='editor-grid'>
            {currentStep === 0 ? <PlayersSection /> : null}
            {currentStep === 2 ? <GameModeSection /> : null}
            {currentStep === 2 && gameMode === 'flash' ? <FlashCardSection /> : null}
            {currentStep === 2 && gameMode === 'parcours' ? <MatchOrderSection /> : null}
            <QuestionEditor currentStep={currentStep} />
          </div>
        </div>
        <div className='wizard-actions'>
          {setupError ? <p className='status-message status-error'>{setupError}</p> : null}
          <button
            type='button'
            disabled={currentStep === 0}
            onClick={() => {
              sounds.navigate();
              setSetupError('');
              setCurrentStep((prev) => prev - 1);
            }}
          >
            Étape précédente
          </button>
          <button
            type='button'
            className='primary-button'
            onClick={() => {
              if (currentStep === 2 && gameMode === null) {
                sounds.wrong();
                setSetupError('Choisis un mode de jeu pour continuer.');
                return;
              }
              if (currentStep === STEPS.length - 1) {
                const error = startMatch();
                if (error) {
                  sounds.wrong();
                  setSetupError(error);
                  return;
                }
                sounds.navigate();
                setSetupError('');
                return;
              }
              sounds.navigate();
              setSetupError('');
              setCurrentStep((prev) => prev + 1);
            }}
          >
            {currentStep === STEPS.length - 1 ? 'Lancer la partie' : 'Étape suivante'}
          </button>
        </div>
      </section>
    </main>
  );
};
