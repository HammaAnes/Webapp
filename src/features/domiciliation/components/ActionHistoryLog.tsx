import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, Clock, FileText, PlayCircle, XCircle, Ban, RefreshCw, AlertCircle } from "lucide-react";
import type { DemandeDomiciliation } from "../../../domiciliation/domain/types";

interface HistoryEntry {
  date: Date;
  label: string;
  detail?: string;
  icon: React.ElementType;
  color: string;
}

function buildHistory(demande: DemandeDomiciliation): HistoryEntry[] {
  const entries: HistoryEntry[] = [];

  if (demande.dateCreation) {
    entries.push({
      date: new Date(demande.dateCreation as string),
      label: "Dossier créé",
      detail: demande.representantLegal
        ? `Pour ${demande.representantLegal.prenom} ${demande.representantLegal.nom}`
        : undefined,
      icon: Clock,
      color: "text-gray-500",
    });
  }

  if (
    demande.statut !== "dossier_preparatoire" &&
    demande.statut !== "refusee" &&
    demande.updatedAt &&
    demande.updatedAt !== demande.dateCreation
  ) {
    if (["en_attente_signature", "en_attente_complements", "domiciliation_creee", "active", "expiree", "resiliee"].includes(demande.statut)) {
      const statusEntry: Record<string, { label: string; icon: React.ElementType; color: string }> = {
        en_attente_complements: { label: "Compléments demandés", icon: FileText, color: "text-amber-600" },
        en_attente_signature: { label: "Dossier validé", icon: CheckCircle, color: "text-sky-600" },
        domiciliation_creee: { label: "Signature notariale enregistrée", icon: FileText, color: "text-blue-600" },
        active: { label: "Domiciliation activée", icon: PlayCircle, color: "text-emerald-600" },
        expiree: { label: "Domiciliation expirée", icon: AlertCircle, color: "text-gray-500" },
        resiliee: { label: "Domiciliation résiliée", icon: Ban, color: "text-red-600" },
      };

      const se = statusEntry[demande.statut];
      if (se) {
        const detail: string[] = [];
        if (demande.statut === "active" || demande.statut === "domiciliation_creee") {
          if (demande.numeroBureau) detail.push(`Bureau N°${demande.numeroBureau} attribué`);
          if (demande.montantMensuel) detail.push(`${demande.montantMensuel.toLocaleString("fr-DZ")} DA/mois`);
          if (demande.referenceContratNotarie) detail.push(`Réf: ${demande.referenceContratNotarie}`);
        }
        if (demande.commentaireAdmin) detail.push(demande.commentaireAdmin);

        entries.push({
          date: new Date(demande.updatedAt as string),
          label: se.label,
          detail: detail.join(" · ") || undefined,
          icon: se.icon,
          color: se.color,
        });
      }
    }
  }

  if (demande.statut === "refusee") {
    entries.push({
      date: new Date(demande.updatedAt as string),
      label: "Demande refusée",
      detail: demande.commentaireAdmin || undefined,
      icon: XCircle,
      color: "text-red-600",
    });
  }

  if (
    demande.statut === "active" &&
    demande.dateDebutContrat &&
    demande.dateFinContrat
  ) {
    entries.push({
      date: new Date(demande.dateDebutContrat as string),
      label: "Début de contrat",
      detail: demande.dateFinContrat
        ? `Fin prévue le ${format(new Date(demande.dateFinContrat as string), "d MMMM yyyy", { locale: fr })}`
        : undefined,
      icon: RefreshCw,
      color: "text-emerald-600",
    });
  }

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}

interface Props {
  demande: DemandeDomiciliation;
  compact?: boolean;
}

export default function ActionHistoryLog({ demande, compact = false }: Props) {
  const entries = buildHistory(demande);

  if (entries.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-400">
        Aucun historique disponible
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, idx) => {
        const Icon = entry.icon;
        const isLast = idx === entries.length - 1;

        return (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-gray-50 border border-gray-200 flex-shrink-0 ${entry.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
            </div>
            <div className={`pb-4 ${isLast ? "" : ""}`}>
              <p className="text-sm font-medium text-gray-800">{entry.label}</p>
              {!compact && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {format(entry.date, "d MMM yyyy à HH:mm", { locale: fr })}
                </p>
              )}
              {compact && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {format(entry.date, "d MMM yyyy", { locale: fr })}
                </p>
              )}
              {entry.detail && (
                <p className="text-xs text-gray-400 mt-0.5 italic">{entry.detail}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
