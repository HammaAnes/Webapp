import React from 'react';
import {
  HelpCircle, Building, User, Briefcase, FileText, Shield, CheckCircle,
} from 'lucide-react';
import type { WizardStepConfig } from '../../hooks/useDomiciliationWizard';

const ICON_MAP: Record<string, React.ElementType> = {
  HelpCircle, Building, User, Briefcase, FileText, Shield, CheckCircle,
};

interface Props {
  currentStep: number;
  steps: WizardStepConfig[];
}

export default function StepIndicator({ currentStep, steps }: Props) {
  return (
    <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const Icon = ICON_MAP[step.icon] ?? HelpCircle;
        const isActive = currentStep >= step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center min-w-[50px]">
              <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className={`text-[9px] md:text-xs mt-1.5 font-medium ${
                isActive ? 'text-amber-600' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 md:mx-2 rounded-full min-w-[12px] ${
                currentStep > step.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
