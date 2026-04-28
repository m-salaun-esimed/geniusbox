import { useAppStore } from '../store';
import { STEPS } from '../constants';

type StepHeaderProps = {
  currentStep: number;
  setCurrentStep: (step: number) => void;
};

export const StepHeader = ({ currentStep, setCurrentStep }: StepHeaderProps) => {
  const gameMode = useAppStore((state) => state.gameMode);
  const lastStepIndex = STEPS.length - 1;
  const visibleSteps = STEPS.map((stepName, index) => ({ stepName, index })).filter(
    ({ index }) => index !== lastStepIndex || gameMode !== null,
  );
  const labelForIndex = (index: number, defaultLabel: string) => {
    if (index !== lastStepIndex) {
      return defaultLabel;
    }
    return gameMode === 'flash' ? 'Carte' : 'Parcours';
  };
  return (
    <div className='stepper'>
      {visibleSteps.map(({ stepName, index }) => (
        <button
          key={stepName}
          type='button'
          className={currentStep === index ? 'step-pill is-active' : 'step-pill'}
          onClick={() => setCurrentStep(index)}
        >
          <span>{index + 1}</span>
          {labelForIndex(index, stepName)}
        </button>
      ))}
    </div>
  );
};
