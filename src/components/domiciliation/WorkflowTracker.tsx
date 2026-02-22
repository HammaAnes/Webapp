import React from "react";
import { CheckCircle, Clock, Scale, FileCheck, FileText, PlayCircle, XCircle, Ban, AlertTriangle } from "lucide-react";
import Card from "../ui/Card";

const STEPS = [
  {
    key: "dossier_preparatoire",
    label: "Dossier préparatoire",
    description: "Dossier en cours d'examen",
    icon: Clock,
    color: "amber",
  },
  {
    key: "en_attente_signature",
    label: "Signature notariale",
    description: "Rendez-vous chez le notaire",
    icon: Scale,
    color: "sky",
  },
  {
    key: "domiciliation_creee",
    label: "Domiciliation créée",
    description: "Juridiquement créée",
    icon: FileCheck,
    color: "teal",
  },
  {
    key: "en_attente_complements",
    label: "Complétion documents",
    description: "Compléter les informations",
    icon: FileText,
    color: "orange",
  },
  {
    key: "active",
    label: "Active",
    description: "Pleinement opérationnelle",
    icon: PlayCircle,
    color: "emerald",
  },
];

const STEP_ORDER: Record<string, number> = {
  dossier_preparatoire: 0,
  en_attente_signature: 1,
  domiciliation_creee: 2,
  en_attente_complements: 3,
  active: 4,
};

const TERMINAL_STATES: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; description: string }> = {
  refusee: { label: "Demande refusée", icon: XCircle, color: "red", description: "Votre demande a été refusée" },
  resiliee: { label: "Domiciliation résiliée", icon: Ban, color: "red", description: "Votre domiciliation a été résiliée" },
  expiree: { label: "Contrat expiré", icon: AlertTriangle, color: "amber", description: "Votre contrat a expiré" },
};

interface WorkflowTrackerProps {
  statut: string;
  lastActiveStep?: string;
}

const WorkflowTracker: React.FC<WorkflowTrackerProps> = ({ statut }) => {
  const isTerminal = statut in TERMINAL_STATES;
  const terminalInfo = TERMINAL_STATES[statut];

  const currentIdx = isTerminal
    ? (statut === "refusee" ? 0 : statut === "expiree" ? 4 : 4)
    : STEP_ORDER[statut];

  if (currentIdx === undefined && !isTerminal) return null;

  return (
    <Card className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-900 text-lg">Progression du dossier</h3>
        {isTerminal && terminalInfo && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            terminalInfo.color === "red" ? "bg-red-100 text-red-700 border border-red-200" : "bg-amber-100 text-amber-700 border border-amber-200"
          }`}>
            <terminalInfo.icon className="w-3.5 h-3.5" />
            {terminalInfo.label}
          </span>
        )}
      </div>

      <div className="hidden md:flex items-start justify-between relative">
        {STEPS.map((step, index) => {
          let isCompleted = false;
          let isActive = false;
          let isCancelled = false;

          if (isTerminal) {
            if (statut === "refusee") {
              isCancelled = index === 0;
            } else {
              isCompleted = index <= currentIdx;
              isCancelled = index === currentIdx;
            }
          } else {
            isCompleted = index < currentIdx;
            isActive = index === currentIdx;
          }

          const StepIcon = step.icon;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center flex-1 min-w-0 relative z-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 ${
                    isCancelled
                      ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-200"
                      : isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200"
                        : isActive
                          ? "bg-gradient-to-br from-amber-500 to-orange-500 border-amber-500 text-white shadow-lg shadow-amber-200"
                          : isTerminal
                            ? "bg-gray-100 border-gray-200 text-gray-300"
                            : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  {isCancelled ? (
                    <XCircle className="w-6 h-6" />
                  ) : isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-3 text-center font-semibold leading-tight px-1 ${
                    isCancelled
                      ? "text-red-700"
                      : isActive
                        ? "text-amber-700"
                        : isCompleted
                          ? "text-emerald-700"
                          : isTerminal
                            ? "text-gray-300"
                            : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
                <span
                  className={`text-[10px] mt-1 text-center leading-tight px-1 ${
                    isCancelled
                      ? "text-red-600"
                      : isActive
                        ? "text-amber-600"
                        : isCompleted
                          ? "text-emerald-600"
                          : isTerminal
                            ? "text-gray-200"
                            : "text-gray-300"
                  }`}
                >
                  {step.description}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className="flex-1 flex items-center pt-6 min-w-[16px]">
                  <div
                    className={`h-1 w-full rounded-full ${
                      isCancelled
                        ? "bg-red-300"
                        : index < currentIdx && !isTerminal
                          ? "bg-emerald-400"
                          : isTerminal && isCompleted && !isCancelled
                            ? "bg-gray-300"
                            : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="md:hidden space-y-3">
        {STEPS.map((step, index) => {
          let isCompleted = false;
          let isActive = false;
          let isCancelled = false;
          let isFuture = false;

          if (isTerminal) {
            if (statut === "refusee") {
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

          const StepIcon = step.icon;

          return (
            <div key={step.key} className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isCancelled
                      ? "bg-red-500 border-red-500 text-white"
                      : isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : isActive
                          ? "bg-gradient-to-br from-amber-500 to-orange-500 border-amber-500 text-white"
                          : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  {isCancelled ? (
                    <XCircle className="w-5 h-5" />
                  ) : isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-0.5 h-4 mt-1 ${
                      isCompleted ? "bg-emerald-400" : isCancelled ? "bg-red-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
              <div className={`flex-1 ${isFuture && isTerminal ? "opacity-30" : isFuture ? "opacity-40" : ""}`}>
                <p
                  className={`text-sm font-semibold ${
                    isCancelled
                      ? "text-red-700"
                      : isActive
                        ? "text-amber-700"
                        : isCompleted
                          ? "text-emerald-700"
                          : "text-gray-500"
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-xs ${
                    isCancelled
                      ? "text-red-600"
                      : isActive
                        ? "text-amber-600"
                        : isCompleted
                          ? "text-emerald-600"
                          : "text-gray-400"
                  }`}
                >
                  {step.description}
                </p>
              </div>
              {isActive && (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-300">
                  En cours
                </span>
              )}
              {isCompleted && !isCancelled && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-300">
                  Fait
                </span>
              )}
              {isCancelled && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-300">
                  Arrêté
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default WorkflowTracker;
