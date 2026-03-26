import React from "react";
import type { DemandeDomiciliation } from "../../../domiciliation/domain/types";
import type { DocumentRecord } from "../../../domiciliation/domain/types";
import { getRequiredDocSlots } from "../utils";

interface Props {
  demande: DemandeDomiciliation;
  docs?: DocumentRecord[];
  compact?: boolean;
}

interface CompletionItem {
  label: string;
  done: boolean;
}

function getCompletionItems(demande: DemandeDomiciliation, docs: DocumentRecord[]): CompletionItem[] {
  const isSociete = demande.typeStructure === "societe";
  const isAE = demande.typeStructure === "auto_entrepreneur";
  const isDejaCreee = demande.situationAdministrative === "deja_creee";

  const items: CompletionItem[] = [
    {
      label: "Représentant (nom & prénom)",
      done: Boolean(demande.representantLegal?.nom?.trim() && demande.representantLegal?.prenom?.trim()),
    },
    {
      label: "Représentant (téléphone & email)",
      done: Boolean(demande.representantLegal?.telephone?.trim() && demande.representantLegal?.email?.trim()),
    },
  ];

  if (isSociete) {
    items.push({ label: "Raison sociale", done: Boolean(demande.raisonSociale?.trim()) });
    items.push({ label: "Forme juridique", done: Boolean(demande.formeJuridique?.trim()) });
  }

  if (isSociete && isDejaCreee) {
    items.push({ label: "NIF", done: Boolean(demande.nif?.trim()) });
    items.push({ label: "NIS", done: Boolean(demande.nis?.trim()) });
    items.push({ label: "Registre de commerce", done: Boolean(demande.registreCommerce?.trim()) });
    items.push({ label: "Article d'imposition", done: Boolean(demande.articleImposition?.trim()) });
  }

  if (isAE && isDejaCreee) {
    items.push({ label: "N° auto-entrepreneur", done: Boolean(demande.numeroAutoEntrepreneur?.trim()) });
  }

  if (demande.numeroBureau) {
    items.push({ label: `Bureau N°${demande.numeroBureau} attribué`, done: true });
  } else {
    items.push({ label: "Bureau attribué", done: false });
  }

  if (demande.dateDebutContrat && demande.dateFinContrat && demande.montantMensuel) {
    items.push({ label: "Contrat renseigné", done: true });
  } else {
    items.push({ label: "Contrat renseigné", done: false });
  }

  const requiredSlots = getRequiredDocSlots(
    demande.situationAdministrative,
    demande.typeStructure
  ).filter((s) => s.required);

  const uploadedTypes = docs.filter((d) => d.status === "valide").map((d) => d.documentType);

  const docsDone = requiredSlots.filter((s) => uploadedTypes.includes(s.type)).length;
  items.push({
    label: `Documents requis (${docsDone}/${requiredSlots.length})`,
    done: requiredSlots.length > 0 && docsDone === requiredSlots.length,
  });

  return items;
}

export default function DossierCompleteness({ demande, docs = [], compact = false }: Props) {
  const items = getCompletionItems(demande, docs);
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const barColor = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  const textColor = pct >= 70 ? "text-emerald-700" : pct >= 40 ? "text-amber-700" : "text-red-700";
  const tagClass = pct >= 70
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : pct >= 40
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-red-50 text-red-700 border-red-200";
  const missing = items.filter((i) => !i.done);

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Complétude</span>
          <span className={`text-xs font-bold ${textColor}`}>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {missing.length > 0 && (
          <p className="text-[10px] text-gray-400">
            Manque: {missing.slice(0, 3).map((m) => m.label).join(", ")}
            {missing.length > 3 ? ` +${missing.length - 3}` : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Complétude du dossier</span>
        <span className={`text-lg font-bold ${textColor}`}>{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{done}/{total} éléments renseignés</p>
      {missing.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">Éléments manquants :</p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((item) => (
              <span
                key={item.label}
                className={`text-xs px-2 py-0.5 rounded-full border ${tagClass}`}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
