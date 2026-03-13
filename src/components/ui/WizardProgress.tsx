import React from 'react';
import { Check } from 'lucide-react';

interface WizardStep {
  label: string;
  description?: string;
}

interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
  completedSteps?: number[];
}

const WizardProgress: React.FC<WizardProgressProps> = ({
  steps,
  currentStep,
  completedSteps = [],
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = index === currentStep;
          const isPast = index < currentStep;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    font-semibold text-sm transition-all duration-200
                    ${isCompleted || isPast
                      ? 'bg-accent text-white'
                      : isCurrent
                      ? 'bg-accent text-white ring-4 ring-accent ring-opacity-30'
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`
                      text-sm font-medium
                      ${isCurrent ? 'text-accent' : 'text-gray-600'}
                    `}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 mt-0 mb-12
                    transition-colors duration-200
                    ${isPast || isCompleted ? 'bg-accent' : 'bg-gray-200'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-accent h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default WizardProgress;
