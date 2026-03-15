import React from 'react';
import { CheckCircle, Circle, XCircle, Clock, AlertCircle } from 'lucide-react';
import type { DomiciliationStatut } from '../../domain/types';
import {
  WORKFLOW_STEPS,
  getStepOrder,
  getProgressPercent,
  isTerminal,
  getStatutMeta,
} from '../../domain/stateMachine';

interface WorkflowTrackerProps {
  statut: DomiciliationStatut;
}

const WorkflowTracker: React.FC<WorkflowTrackerProps> = ({ statut }) => {
  const meta = getStatutMeta(statut);
  const terminal = isTerminal(statut);
  const currentOrder = getStepOrder(statut);
  const progressPercent = getProgressPercent(statut);

  if (terminal) {
    const isRefused = statut === 'refusee';
    const isResidue = statut === 'resiliee';
    return (
      <div className={`rounded-xl border-2 p-5 ${meta.bg} ${meta.border}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isRefused || isResidue ? 'bg-red-100' : 'bg-gray-100'}`}>
            <XCircle className={`w-6 h-6 ${isRefused || isResidue ? 'text-red-600' : 'text-gray-500'}`} />
          </div>
          <div>
            <p className={`font-semibold text-base ${meta.color}`}>{meta.label}</p>
            <p className={`text-sm mt-1 ${meta.color} opacity-80`}>{meta.description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border ${meta.bg} ${meta.border} p-4`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
          <span className="text-xs text-gray-500">{progressPercent}%</span>
        </div>
        <div className="w-full bg-white/60 rounded-full h-2">
          <div
            className={`h-2 rounded-full bg-gradient-to-r ${meta.gradient} transition-all duration-500`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="hidden md:flex items-center w-full">
        {WORKFLOW_STEPS.map((step, index) => {
          const isCompleted = currentOrder > step.order;
          const isCurrent = step.key === statut || (statut === 'en_attente_complements' && step.order === 1);
          const isUpcoming = currentOrder < step.order && !isCurrent;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isCurrent
                      ? `bg-gradient-to-br ${meta.gradient} border-transparent text-white shadow-md`
                      : 'bg-white border-gray-200 text-gray-300'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>
                <div className="mt-2 text-center w-20">
                  <p className={`text-xs font-medium leading-tight ${isCompleted ? 'text-emerald-700' : isCurrent ? meta.color : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                </div>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${isCompleted ? 'bg-emerald-400' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="md:hidden space-y-2">
        {WORKFLOW_STEPS.map((step) => {
          const isCompleted = currentOrder > step.order;
          const isCurrent = step.key === statut || (statut === 'en_attente_complements' && step.order === 1);

          return (
            <div key={step.key} className={`flex items-start gap-3 p-3 rounded-lg border ${isCurrent ? `${meta.bg} ${meta.border}` : isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-gradient-to-br ' + meta.gradient : 'bg-gray-200'}`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4 text-white" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isCompleted ? 'text-emerald-700' : isCurrent ? meta.color : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {isCurrent && <p className="text-xs text-gray-500 mt-0.5">{step.detail}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {statut === 'en_attente_complements' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800">Action requise</p>
            <p className="text-xs text-orange-700 mt-1">Des compléments ont été demandés. Consultez la section "Compléments requis" ci-dessous.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowTracker;
