import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Banknote, CreditCard, Receipt, Smartphone, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import { apiClient } from "../../lib/api-client";
import { formatCurrency } from "../../utils/formatters";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EncaisserData {
  reservationId?: string;
  domiciliationId?: string;
  abonnementUtilisateurId?: string;
  typeTransaction: "reservation" | "domiciliation" | "abonnement" | "impression" | "boisson" | "autre";
  montantSuggere: number;
  montantCalcule?: number;   // prix auto-calculé depuis checkin/checkout (immuable pour référence)
  detailCalcul?: string;     // ex: "2.5h × 200 DA/h"
  dureeMinutes?: number;     // durée réelle en minutes
  label?: string;
}

interface Props {
  data: EncaisserData;
  onClose: () => void;
  onSuccess: (numeroRecu: string) => void;
}

// ─── Modes de paiement ───────────────────────────────────────────────────────

const MODES = [
  { value: "cash",     label: "Espèces",  Icon: Banknote   },
  { value: "tpe",      label: "TPE",      Icon: CreditCard },
  { value: "virement", label: "Virement", Icon: Smartphone },
  { value: "cheque",   label: "Chèque",   Icon: Receipt    },
] as const;

type ModePaiement = typeof MODES[number]["value"];

// ─── Helper durée ─────────────────────────────────────────────────────────────

function formatDuree(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function EncaisserModal({ data, onClose, onSuccess }: Props) {
  const [montant, setMontant]     = useState(data.montantSuggere > 0 ? String(data.montantSuggere) : "");
  const [mode, setMode]           = useState<ModePaiement>("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [numeroRecu, setNumeroRecu] = useState("");

  const montantNum    = parseFloat(montant.replace(",", ".")) || 0;
  const montantCalcule = data.montantCalcule ?? data.montantSuggere;
  const montantAjuste  = montantNum > 0 && montantCalcule > 0 && montantNum !== montantCalcule;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (montantNum <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }

    // Note obligatoire côté client si montant modifié
    if (montantAjuste && notes.trim() === "") {
      toast.error("Une justification est requise lorsque le montant est modifié");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        type_transaction:          data.typeTransaction,
        montant:                   montantNum,
        montant_ajuste:            montantAjuste,
        mode_paiement:             mode,
        reference_paiement:        reference.trim() || undefined,
        notes:                     notes.trim() || undefined,
        reservation_id:            data.reservationId || undefined,
        domiciliation_id:          data.domiciliationId || undefined,
        abonnement_utilisateur_id: data.abonnementUtilisateurId || undefined,
      };

      const res = await apiClient.createTransactionCaisse(payload);

      if (res.success) {
        const num = (res.data as { numero_recu?: string })?.numero_recu || "";
        setNumeroRecu(num);
        setDone(true);
        onSuccess(num);
      } else {
        toast.error((res as { error?: string }).error || "Erreur lors de l'encaissement");
      }
    } catch {
      toast.error("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: "spring", damping: 30, stiffness: 350 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Encaisser</h2>
              {data.label && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{data.label}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contenu */}
          {done ? (
            /* ── Confirmation ── */
            <div className="px-6 py-10 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-gray-900 mb-1">
                {formatCurrency(montantNum)} encaissés
              </p>
              {numeroRecu && (
                <p className="text-sm text-gray-500 mb-1">
                  Reçu n° <span className="font-mono font-semibold text-gray-700">{numeroRecu}</span>
                </p>
              )}
              {montantAjuste && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 inline-block mt-1">
                  Tarif ajusté (calculé : {formatCurrency(montantCalcule)})
                </p>
              )}
              <p className="text-xs text-gray-400 mt-3 mb-6">Mode : {MODES.find((m) => m.value === mode)?.label}</p>
              <Button variant="secondary" onClick={onClose} className="w-full">
                Fermer
              </Button>
            </div>
          ) : (
            /* ── Formulaire ── */
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

              {/* Bandeau durée réelle (si checkout) */}
              {data.dureeMinutes !== undefined && data.dureeMinutes > 0 && (
                <div className="flex items-center gap-3 bg-sky-50 rounded-xl px-4 py-3">
                  <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-sky-700">
                      Durée réelle · {formatDuree(data.dureeMinutes)}
                    </p>
                    {data.detailCalcul && (
                      <p className="text-xs text-sky-500 mt-0.5">{data.detailCalcul}</p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-sky-800 shrink-0">
                    {formatCurrency(montantCalcule)}
                  </span>
                </div>
              )}

              {/* Montant */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Montant facturé (DA)
                  </label>
                  {montantAjuste && (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      Tarif modifié
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    placeholder="0"
                    className={`w-full px-4 py-3 text-2xl font-bold text-gray-900 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      montantAjuste
                        ? "border-amber-300 focus:ring-amber-400 bg-amber-50"
                        : "border-gray-200 focus:ring-emerald-500"
                    }`}
                    required
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">DA</span>
                </div>

                {/* Bouton restaurer prix calculé */}
                {montantAjuste && montantCalcule > 0 && (
                  <button
                    type="button"
                    onClick={() => setMontant(String(montantCalcule))}
                    className="mt-1.5 text-xs text-emerald-600 hover:underline"
                  >
                    ← Revenir au prix calculé ({formatCurrency(montantCalcule)})
                  </button>
                )}
              </div>

              {/* Mode de paiement */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Mode de paiement
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {MODES.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all ${
                        mode === value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Référence (optionnel) */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Référence <span className="text-gray-400 font-normal normal-case">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="N° chèque, réf. virement…"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Justification — obligatoire si montant modifié */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  {montantAjuste ? (
                    <span className="flex items-center gap-1.5">
                      Justification
                      <span className="text-red-500 font-bold">*</span>
                      <span className="text-amber-600 font-normal normal-case">(obligatoire — tarif modifié)</span>
                    </span>
                  ) : (
                    <span>Notes <span className="text-gray-400 font-normal normal-case">(optionnel)</span></span>
                  )}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    montantAjuste
                      ? "Ex : Client a fait 3h effectives, tarif ajusté à 600 DA…"
                      : "Remarque…"
                  }
                  rows={montantAjuste ? 3 : 2}
                  required={montantAjuste}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-colors ${
                    montantAjuste && notes.trim() === ""
                      ? "border-amber-300 focus:ring-amber-400 bg-amber-50"
                      : "border-gray-200 focus:ring-emerald-500"
                  }`}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="success"
                className="w-full py-3 text-base font-semibold"
                loading={loading}
                disabled={montantNum <= 0 || (montantAjuste && notes.trim() === "")}
              >
                Encaisser {montantNum > 0 ? formatCurrency(montantNum) : ""}
              </Button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
