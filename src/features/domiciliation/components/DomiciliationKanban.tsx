import React from "react";
import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";
import { Building2, User, CheckCircle, Scale, PlayCircle, XCircle, AlertCircle } from "lucide-react";
import type { DemandeDomiciliation } from "../types";
import { getDisplayName } from "../utils";

interface Props {
  demandes: DemandeDomiciliation[];
  onAction: (demande: DemandeDomiciliation, action: string) => void;
}

const KANBAN_COLUMNS = [
  {
    key: "preparatoire",
    label: "Préparatoire",
    statuts: ["dossier_preparatoire", "en_attente_complements"],
    color: "border-amber-300 bg-amber-50",
    headerColor: "bg-amber-100 text-amber-800",
    primaryAction: { key: "valider", label: "Valider", icon: CheckCircle, color: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  },
  {
    key: "signature",
    label: "Att. Signature",
    statuts: ["en_attente_signature"],
    color: "border-sky-300 bg-sky-50",
    headerColor: "bg-sky-100 text-sky-800",
    primaryAction: { key: "signer", label: "Signer", icon: Scale, color: "bg-sky-500 hover:bg-sky-600 text-white" },
  },
  {
    key: "creee",
    label: "Créée",
    statuts: ["domiciliation_creee"],
    color: "border-blue-300 bg-blue-50",
    headerColor: "bg-blue-100 text-blue-800",
    primaryAction: { key: "activer", label: "Activer", icon: PlayCircle, color: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  },
  {
    key: "active",
    label: "Active",
    statuts: ["active"],
    color: "border-emerald-300 bg-emerald-50",
    headerColor: "bg-emerald-100 text-emerald-800",
    primaryAction: null,
  },
  {
    key: "termine",
    label: "Terminé",
    statuts: ["refusee", "resiliee", "expiree"],
    color: "border-gray-300 bg-gray-50",
    headerColor: "bg-gray-100 text-gray-600",
    primaryAction: null,
  },
] as const;

function AgeBadge({ dateCreation }: { dateCreation: Date | string }) {
  const days = differenceInDays(new Date(), new Date(dateCreation as string));
  if (days < 7) return <span className="text-xs text-emerald-600 font-medium">{days}j</span>;
  if (days < 30) return <span className="text-xs text-amber-600 font-medium">{days}j</span>;
  return <span className="text-xs text-red-600 font-medium">{days}j</span>;
}

function KanbanCard({
  demande,
  primaryAction,
  onClick,
  onAction,
}: {
  demande: DemandeDomiciliation;
  primaryAction: typeof KANBAN_COLUMNS[0]["primaryAction"];
  onClick: () => void;
  onAction: (action: string) => void;
}) {
  const daysLeft = demande.dateFinContrat
    ? differenceInDays(new Date(demande.dateFinContrat as string), new Date())
    : null;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {demande.typeStructure === "auto_entrepreneur" ? (
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
          ) : (
            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
          <p className="font-semibold text-gray-900 text-sm truncate">{getDisplayName(demande)}</p>
        </div>
        <AgeBadge dateCreation={demande.dateCreation} />
      </div>

      <p className="text-xs text-gray-500 mb-2.5 truncate">
        {demande.representantLegal?.prenom} {demande.representantLegal?.nom}
      </p>

      {demande.numeroBureau && (
        <p className="text-xs font-medium text-amber-700 mb-1">Bureau N°{demande.numeroBureau}</p>
      )}
      {demande.montantMensuel && (
        <p className="text-xs text-emerald-700 mb-1">
          {demande.montantMensuel.toLocaleString("fr-DZ")} DA/mois
        </p>
      )}
      {daysLeft !== null && daysLeft <= 60 && daysLeft >= 0 && (
        <p className={`text-xs font-medium mb-2 ${daysLeft <= 7 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-gray-500"}`}>
          Expire dans {daysLeft}j
        </p>
      )}

      {demande.statut === "en_attente_complements" && (
        <span className="inline-block text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full mb-2">
          Compléments demandés
        </span>
      )}

      {primaryAction && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction(primaryAction.key);
          }}
          className={`w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${primaryAction.color}`}
        >
          <primaryAction.icon className="w-3.5 h-3.5" />
          {primaryAction.label}
        </button>
      )}
    </div>
  );
}

export default function DomiciliationKanban({ demandes, onAction }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {KANBAN_COLUMNS.map((col) => {
        const colDemandes = demandes.filter((d) => col.statuts.includes(d.statut as (typeof col.statuts)[number]));

        return (
          <div key={col.key} className="flex-shrink-0 w-64">
            <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 ${col.headerColor}`}>
              <span className="font-semibold text-sm">{col.label}</span>
              <span className="text-xs font-bold bg-white/60 rounded-full px-2 py-0.5">
                {colDemandes.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {colDemandes.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  Aucun dossier
                </div>
              ) : (
                colDemandes.map((d) => (
                  <KanbanCard
                    key={d.id}
                    demande={d}
                    primaryAction={col.primaryAction}
                    onClick={() => navigate(`/app/admin/domiciliations/${d.id}`)}
                    onAction={(action) => onAction(d, action)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
