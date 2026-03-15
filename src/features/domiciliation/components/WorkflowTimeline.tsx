import React from "react";
import { CheckCircle, Circle, AlertTriangle } from "lucide-react";
import { STATUT_CONFIG, WORKFLOW_STEPS } from "../constants";
import type { DomiciliationStatut } from "../types";

interface Props {
  statut: DomiciliationStatut;
}

export default function WorkflowTimeline({ statut }: Props) {
  const isTerminal = statut === "refusee" || statut === "resiliee";
  const currentCfg = STATUT_CONFIG[statut];
  const currentStep = currentCfg?.step ?? -1;

  return (
    <div className="w-full">
      {isTerminal ? (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${currentCfg.bg}`}
        >
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${currentCfg.color}`} />
          <div>
            <p className={`text-sm font-semibold ${currentCfg.color}`}>{currentCfg.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {statut === "refusee"
                ? "Cette demande a été refusée et ne peut plus évoluer."
                : "Cette domiciliation a été résiliée."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center w-full overflow-x-auto pb-1">
          {WORKFLOW_STEPS.map((step, idx) => {
            const stepCfg = STATUT_CONFIG[step.key];
            const isDone = currentStep > stepCfg.step;
            const isCurrent =
              step.key === statut ||
              (statut === "en_attente_complements" && step.key === "dossier_preparatoire");
            const isLast = idx === WORKFLOW_STEPS.length - 1;

            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-[80px]">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCurrent
                        ? "bg-amber-500 border-amber-500 shadow-md shadow-amber-200"
                        : isDone
                        ? "bg-emerald-500 border-emerald-500"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : isCurrent ? (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium text-center leading-tight whitespace-nowrap ${
                      isCurrent
                        ? "text-amber-700"
                        : isDone
                        ? "text-emerald-700"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                  {statut === "en_attente_complements" && step.key === "dossier_preparatoire" && (
                    <span className="text-xs text-amber-600 font-medium whitespace-nowrap">
                      + Compléments
                    </span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`flex-1 h-0.5 mx-1 mb-5 transition-all ${
                      isDone ? "bg-emerald-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
