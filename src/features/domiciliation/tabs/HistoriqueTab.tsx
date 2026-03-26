import React from "react";
import { Info } from "lucide-react";
import ActionHistoryLog from "../components/ActionHistoryLog";
import type { DemandeDomiciliation } from "../../../domiciliation/domain/types";

interface Props {
  demande: DemandeDomiciliation;
}

export default function HistoriqueTab({ demande }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center shadow-sm">
          <Info className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Historique des actions</h3>
          <p className="text-xs text-gray-500">Chronologie des événements sur ce dossier</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
        <ActionHistoryLog demande={demande} />
      </div>

      <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          L'historique est reconstruit depuis les données disponibles. Une table d'audit dédiée sera ajoutée prochainement pour un suivi plus détaillé.
        </p>
      </div>
    </div>
  );
}
