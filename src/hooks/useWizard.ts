import { useState, useCallback } from 'react';

interface UseWizardOptions {
  totalSteps: number;
  initialStep?: number;
  onStepChange?: (step: number) => void;
}

interface UseWizardReturn {
  currentStep: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
  canGoNext: boolean;
  canGoBack: boolean;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
}

export function useWizard({
  totalSteps,
  initialStep = 0,
  onStepChange,
}: UseWizardOptions): UseWizardReturn {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const canGoNext = !isLastStep;
  const canGoBack = !isFirstStep;

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
        onStepChange?.(step);
      }
    },
    [totalSteps, onStepChange]
  );

  const nextStep = useCallback(() => {
    if (canGoNext) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, canGoNext, goToStep]);

  const previousStep = useCallback(() => {
    if (canGoBack) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, canGoBack, goToStep]);

  const reset = useCallback(() => {
    goToStep(initialStep);
  }, [initialStep, goToStep]);

  return {
    currentStep,
    isFirstStep,
    isLastStep,
    progress,
    canGoNext,
    canGoBack,
    goToStep,
    nextStep,
    previousStep,
    reset,
  };
}
