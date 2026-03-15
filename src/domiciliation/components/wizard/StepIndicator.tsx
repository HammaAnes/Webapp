import React from 'react';
import {
  HelpCircle,
  Building,
  User,
  Briefcase,
  FileText,
  Scale,
  Package,
  FileCheck,
  Check,
} from 'lucide-react';
import { WIZARD_STEPS } from '../../hooks/useWizard';

const ICON_MAP: Record<string, React.ElementType> = {
  HelpCircle,
  Building,
  User,
  Briefcase,
  FileText,
  Scale,
  Package,
  FileCheck,
};

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
      <div className="flex items-center justify-between overflow-x-auto gap-1">
        {WIZARD_STEPS.map((step, index) => {
          const Icon = ICON_MAP[step.icon] || HelpCircle;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isUpcoming = currentStep < step.id;

          return (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-200'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium hidden sm:block ${
                    isCurrent ? 'text-amber-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-4 mx-1 rounded transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
