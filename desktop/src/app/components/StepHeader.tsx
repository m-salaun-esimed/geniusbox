import { STEPS } from '../constants';

type StepHeaderProps = {
  currentStep: number;
  setCurrentStep: (step: number) => void;
};

export const StepHeader = ({ currentStep, setCurrentStep }: StepHeaderProps) => {
  return (
    <div className='stepper'>
      {STEPS.map((stepName, index) => (
        <button
          key={stepName}
          type='button'
          className={currentStep === index ? 'step-pill is-active' : 'step-pill'}
          onClick={() => setCurrentStep(index)}
        >
          <span>{index + 1}</span>
          {stepName}
        </button>
      ))}
    </div>
  );
};
