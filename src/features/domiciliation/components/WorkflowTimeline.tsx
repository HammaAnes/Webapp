import React from "react";
import { CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { STATUT_CONFIG, WORKFLOW_STEPS } from "../constants";
import type { DomiciliationStatut } from "../types";

interface Props {
  statut: DomiciliationStatut;
  size?: "sm" | "md";
}

export default function WorkflowTimeline({ statut, size = "md" }: Props) {
  const isTerminal = statut === "refusee" || statut === "resiliee";
  const isComplement = statut === "en_attente_complements";
  const currentCfg = STATUT_CONFIG[statut];
  const currentStep = currentCfg?.step ?? -1;

  const nodeSize = size === "sm" ? "w-6 h-6" : "w-9 h-9";
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const dotSize = size === "sm" ? "w-2 h-2" : "w-3 h-3";
  const labelSize = size === "sm" ? "text-[10px]" : "text-xs";

  if (isTerminal) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${currentCfg.bg}`}>
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
    );
  }

  return (
    <div className="w-full">
      {isComplement && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-xs font-medium text-amber-700">
            En attente de compléments — des informations supplémentaires sont demandées
          </span>
        </div>
      )}
      <div className="flex items-center w-full overflow-x-auto pb-1">
        {WORKFLOW_STEPS.map((step, idx) => {
          const stepCfg = STATUT_CONFIG[step.key];
          const isDone = currentStep > stepCfg.step && !isComplement
            ? true
            : isComplement
            ? stepCfg.step < 0
            : currentStep > stepCfg.step;
          const isCurrent =
            step.key === statut ||
            (isComplement && step.key === "dossier_preparatoire");
          const isLast = idx === WORKFLOW_STEPS.length - 1;

          let circleClass = "bg-white border-gray-200";
          if (isCurrent) circleClass = "bg-amber-500 border-amber-500 shadow-sm shadow-amber-200";
          else if (isDone) circleClass = "bg-emerald-500 border-emerald-500";

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-[70px]">
                <div className={`${nodeSize} rounded-full flex items-center justify-center border-2 transition-all ${circleClass}`}>
                  {isDone && !isCurrent ? (
                    <CheckCircle className={`${iconSize} text-white`} />
                  ) : isCurrent ? (
                    <div className={`${dotSize} bg-white rounded-full`} />
                  ) : (
                    <div className={`${dotSize} bg-gray-200 rounded-full`} />
                  )}
                </div>
                <span className={`${labelSize} font-medium text-center leading-tight whitespace-nowrap ${
                  isCurrent ? "text-amber-700" : isDone ? "text-emerald-700" : "text-gray-400"
                }`}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className={`flex-1 h-0.5 mx-1 mb-5 transition-all ${
                  isDone && !isComplement ? "bg-emerald-400" : "bg-gray-200"
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
