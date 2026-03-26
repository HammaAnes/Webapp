import React, { useEffect } from "react";
import { X, Building2, User, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { differenceInDays } from "date-fns";
import type { DemandeDomiciliation } from "../../../domiciliation/domain/types";
import StatutBadge from "./StatutBadge";
import DossierCompleteness from "./DossierCompleteness";
import { getDisplayName, getSituationLabel, getTypeLabel } from "../utils";
import { SOCIETE_DOCS, AUTO_ENTREPRENEUR_DOCS } from "../constants";

interface Props {
  demande: DemandeDomiciliation | null;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

function formatDate(d: Date | string | undefined | null): string {
  if (!d) return "—";
  try {
    return format(new Date(d as string), "d MMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
}

export default function QuickPreviewPanel({ demande, onClose, onNavigate }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const allDocs = demande
    ? (demande.typeStructure === "auto_entrepreneur" ? AUTO_ENTREPRENEUR_DOCS : SOCIETE_DOCS)
    : [];

  const daysLeft = demande?.dateFinContrat
    ? differenceInDays(new Date(demande.dateFinContrat as string), new Date())
    : null;

  return (
    <AnimatePresence>
      {demande && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          <motion.div
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-2.5 min-w-0">
                {demande.typeStructure === "societe" ? (
                  <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
                ) : (
                  <User className="w-5 h-5 text-amber-600 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {getDisplayName(demande)}
                  </p>
                  <p className="text-xs text-gray-500">{getTypeLabel(demande.typeStructure)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <StatutBadge statut={demande.statut} size="sm" />
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/60 rounded-lg transition-colors text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <section>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Résumé</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Situation</span>
                    <span className="text-gray-800 font-medium">{getSituationLabel(demande.situationAdministrative)}</span>
                  </div>
                  {demande.formeJuridique && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Forme juridique</span>
                      <span className="text-gray-800 font-medium">{demande.formeJuridique}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bureau</span>
                    <span className={demande.numeroBureau ? "text-amber-700 font-semibold" : "text-gray-400"}>
                      {demande.numeroBureau ? `N°${demande.numeroBureau}` : "Non attribué"}
                    </span>
                  </div>
                  {demande.montantMensuel && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mensualité</span>
                      <span className="text-emerald-700 font-semibold">
                        {demande.montantMensuel.toLocaleString("fr-DZ")} DA/mois
                      </span>
                    </div>
                  )}
                  {demande.dateDebutContrat && demande.dateFinContrat && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Contrat</span>
                      <span className="text-gray-800 text-xs">
                        {formatDate(demande.dateDebutContrat)} → {formatDate(demande.dateFinContrat)}
                      </span>
                    </div>
                  )}
                  {daysLeft !== null && daysLeft >= 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expire dans</span>
                      <span className={`font-medium text-xs ${daysLeft <= 7 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-gray-700"}`}>
                        {daysLeft} jours
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Créé le</span>
                    <span className="text-gray-700 text-xs">{formatDate(demande.dateCreation)}</span>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Représentant</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-800 font-medium">
                    {demande.representantLegal?.prenom} {demande.representantLegal?.nom}
                  </p>
                  {demande.representantLegal?.telephone && (
                    <p className="text-gray-500 text-xs">{demande.representantLegal.telephone}</p>
                  )}
                  {demande.representantLegal?.email && (
                    <p className="text-gray-500 text-xs truncate">{demande.representantLegal.email}</p>
                  )}
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Documents ({allDocs.filter((d) => d.required).length} requis)
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {allDocs.filter((d) => d.required).map((doc) => (
                    <div key={doc.type} className="flex items-center gap-1.5 text-xs">
                      <CheckCircle className="w-3 h-3 text-gray-300 flex-shrink-0" />
                      <span className="text-gray-600 truncate">{doc.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <DossierCompleteness demande={demande} compact />
              </section>

              {demande.commentaireAdmin && (
                <section>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Note admin</h4>
                  <p className="text-xs text-gray-600 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                    {demande.commentaireAdmin}
                  </p>
                </section>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => onNavigate(demande.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir le dossier complet
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
