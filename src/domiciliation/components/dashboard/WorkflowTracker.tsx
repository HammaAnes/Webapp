import React from 'react';
import {
  CheckCircle, Clock, Scale, FileCheck, PlayCircle,
  XCircle, Ban, AlertTriangle,
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import {
  WORKFLOW_STEPS,
  getStepOrder,
  getProgressPercent,
  isTerminal as checkTerminal,
} from '../../domain/stateMachine';
import type { DomiciliationStatut } from '../../domain/types';

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dossier_preparatoire: Clock,
  en_attente_signature: Scale,
  domiciliation_creee: FileCheck,
  active: PlayCircle,
  expiree: AlertTriangle,
};

const TERMINAL_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; isRed: boolean; description: string }> = {
  refusee: { label: 'Demande refusée', icon: XCircle, isRed: true, description: 'Votre demande a été refusée. Consultez le motif et soumettez une nouvelle demande.' },
  resiliee: { label: 'Domiciliation résiliée', icon: Ban, isRed: true, description: 'Votre domiciliation a été résiliée.' },
  expiree: { label: 'Contrat expiré', icon: AlertTriangle, isRed: false, description: 'Votre contrat a expiré. Renouvelez votre domiciliation pour continuer.' },
};

interface WorkflowTrackerProps {
  statut: DomiciliationStatut;
}

export default function WorkflowTracker({ statut }: WorkflowTrackerProps) {
  const terminal = checkTerminal(statut);
  const terminalMeta = TERMINAL_META[statut];
  const currentIdx = getStepOrder(statut);
  const progressPct = terminal
    ? (statut === 'refusee' ? 5 : statut === 'expiree' ? 95 : 100)
    : getProgressPercent(statut);

  const isActionRequired = statut === 'en_attente_complements';

  return (
    <Card className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-900 text-base">Progression du dossier</h3>
        <div className="flex items-center gap-2">
          {terminal && terminalMeta ? (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              terminalMeta.isRed ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}>
              <terminalMeta.icon className="w-3.5 h-3.5" />
              {terminalMeta.label}
            </span>
          ) : (
            <span className={`text-sm font-bold ${statut === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {progressPct}%
            </span>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              terminal && terminalMeta?.isRed
                ? 'bg-red-400'
                : statut === 'active'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : isActionRequired
                    ? 'bg-gradient-to-r from-orange-400 to-amber-500'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {terminal && terminalMeta && (
          <p className={`text-sm mt-2 ${terminalMeta.isRed ? 'text-red-600' : 'text-amber-700'}`}>
            {terminalMeta.description}
          </p>
        )}
        {isActionRequired && !terminal && (
          <p className="text-sm mt-2 text-orange-600 font-medium">
            Action requise : votre dossier nécessite des compléments d'information.
          </p>
        )}
      </div>

      <div className="hidden md:flex items-start justify-between relative">
        {WORKFLOW_STEPS.map((step, index) => {
          let isCompleted = false;
          let isActive = false;
          let isCancelled = false;

          if (terminal) {
            if (statut === 'refusee') {
              isCancelled = index === 0;
            } else {
              isCompleted = index <= currentIdx;
              isCancelled = index === currentIdx;
            }
          } else {
            isCompleted = index < currentIdx;
            isActive = index === currentIdx;
          }

          const StepIcon = STEP_ICONS[step.key] || Clock;
          const actionRequired = isActive && statut === 'en_attente_complements';

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center flex-1 min-w-0 relative z-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 ${
                  isCancelled
                    ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-200'
                    : isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200'
                      : actionRequired
                        ? 'bg-gradient-to-br from-orange-500 to-amber-500 border-orange-500 text-white shadow-lg shadow-orange-200'
                        : isActive
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-500 text-white shadow-lg shadow-amber-200'
                          : terminal
                            ? 'bg-gray-100 border-gray-200 text-gray-300'
                            : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                  {isCancelled ? (
                    <XCircle className="w-6 h-6" />
                  ) : isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs mt-3 text-center font-semibold leading-tight px-1 ${
                  isCancelled ? 'text-red-700'
                    : actionRequired ? 'text-orange-700'
                    : isActive ? 'text-amber-700'
                    : isCompleted ? 'text-emerald-700'
                    : terminal ? 'text-gray-300'
                    : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
                <span className={`text-[10px] mt-0.5 text-center leading-tight px-1 ${
                  isCancelled ? 'text-red-500'
                    : actionRequired ? 'text-orange-500'
                    : isActive ? 'text-amber-500'
                    : isCompleted ? 'text-emerald-500'
                    : terminal ? 'text-gray-200'
                    : 'text-gray-300'
                }`}>
                  {isActive ? step.detail : isCompleted && !terminal ? 'Complété' : step.description}
                </span>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className="flex-1 flex items-center pt-6 min-w-[16px]">
                  <div className={`h-1 w-full rounded-full ${
                    isCancelled ? 'bg-red-300'
                      : index < currentIdx && !terminal ? 'bg-emerald-400'
                      : terminal && isCompleted && !isCancelled ? 'bg-gray-300'
                      : 'bg-gray-200'
                  }`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="md:hidden space-y-3">
        {WORKFLOW_STEPS.map((step, index) => {
          let isCompleted = false;
          let isActive = false;
          let isCancelled = false;
          let isFuture = false;

          if (terminal) {
            if (statut === 'refusee') {
              isCancelled = index === 0;
              isFuture = index > 0;
            } else {
              isCompleted = index < currentIdx;
              isCancelled = index === currentIdx;
              isFuture = index > currentIdx;
            }
          } else {
            isCompleted = index < currentIdx;
            isActive = index === currentIdx;
            isFuture = index > currentIdx;
          }

          const StepIcon = STEP_ICONS[step.key] || Clock;
          const actionRequired = isActive && statut === 'en_attente_complements';

          return (
            <div key={step.key} className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isCancelled ? 'bg-red-500 border-red-500 text-white'
                    : isCompleted ? 'bg-emerald-500 border-emerald-500 text-white'
                    : actionRequired ? 'bg-gradient-to-br from-orange-500 to-amber-500 border-orange-500 text-white'
                    : isActive ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-500 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                  {isCancelled ? <XCircle className="w-5 h-5" />
                    : isCompleted ? <CheckCircle className="w-5 h-5" />
                    : <StepIcon className="w-4 h-4" />}
                </div>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div className={`w-0.5 h-4 mt-1 ${
                    isCompleted ? 'bg-emerald-400' : isCancelled ? 'bg-red-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
              <div className={`flex-1 ${isFuture && terminal ? 'opacity-30' : isFuture ? 'opacity-40' : ''}`}>
                <p className={`text-sm font-semibold ${
                  isCancelled ? 'text-red-700'
                    : actionRequired ? 'text-orange-700'
                    : isActive ? 'text-amber-700'
                    : isCompleted ? 'text-emerald-700'
                    : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
                <p className={`text-xs ${
                  isCancelled ? 'text-red-600'
                    : actionRequired ? 'text-orange-600'
                    : isActive ? 'text-amber-600'
                    : isCompleted ? 'text-emerald-600'
                    : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
              </div>
              {isActive && !actionRequired && (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-300">En cours</span>
              )}
              {actionRequired && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full border border-orange-300">Action requise</span>
              )}
              {isCompleted && !isCancelled && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-300">Fait</span>
              )}
              {isCancelled && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-300">Arrêté</span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
