import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Clock,
  CreditCard,
  Users,
  CheckCircle,
  XCircle,
  Timer,
  FileText,
  Calendar,
  Banknote,
  LogIn,
  LogOut,
} from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { formatDate, formatTime, formatCurrency } from "../../utils/formatters";
import {
  getReservationStatutColor,
  getReservationStatutLabel,
} from "../../constants";
import type { Reservation } from "../../types";
import EncaisserModal from "./EncaisserModal";
import { apiClient } from "../../lib/api-client";
import toast from "react-hot-toast";

interface ReservationDrawerProps {
  reservation: Reservation | null;
  onClose: () => void;
  onStatusChange: (id: string, statut: string) => void;
  onEncaissementDone?: () => void;
  onCheckinDone?: () => void;
  onCheckoutDone?: () => void;
}

export default function ReservationDrawer({
  reservation,
  onClose,
  onStatusChange,
  onEncaissementDone,
  onCheckinDone,
  onCheckoutDone,
}: ReservationDrawerProps) {
  const [showEncaisser, setShowEncaisser] = useState(false);
  const [localCheckinId, setLocalCheckinId] = useState<string | null>(null);
  const [localHeureArrivee, setLocalHeureArrivee] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [localMontantPaye, setLocalMontantPaye] = useState<number | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<{
    prixCalcule: number;
    detailCalcul: string;
    dureeMinutes: number;
  } | null>(null);

  // Reset local state when the reservation changes
  useEffect(() => {
    setLocalCheckinId(null);
    setLocalHeureArrivee(null);
    setLocalMontantPaye(null);
    setCheckoutResult(null);
  }, [reservation?.id]);

  if (!reservation) return null;

  const res = reservation;
  const client = res.utilisateur ?? res.contact ?? null;
  const clientName = client
    ? `${client.prenom || ""} ${client.nom || ""}`.trim() || "Client"
    : "Client";
  const clientEmail = res.utilisateur?.email ?? res.contact?.email ?? "";
  const initials = client
    ? `${(client.prenom || "")[0] ?? ""}${(client.nom || "")[0] ?? ""}`.toUpperCase() || "??"
    : "??";

  // Effective checkin data: prefer local state (just checked in) over stored data
  const effectiveCheckinId = localCheckinId || res.checkinId || null;
  const effectiveHeureArrivee = localHeureArrivee || res.heureArriveeReelle || null;

  const isEnCours = res.statut === "en_cours" || localCheckinId !== null;
  const effectiveMontantPaye = localMontantPaye ?? (res.montantPaye ?? 0);
  const resteAPayer = res.montantTotal - effectiveMontantPaye;
  const estPaye = resteAPayer <= 0 && res.montantTotal > 0;

  const handleCheckin = async () => {
    setCheckingIn(true);
    try {
      const result = await apiClient.createCheckin({ reservation_id: res.id });
      if (result.success) {
        const data = result.data as { id: string; heure_arrivee_reelle: string; retard_minutes: number };
        setLocalCheckinId(data.id);
        setLocalHeureArrivee(data.heure_arrivee_reelle);
        if (data.retard_minutes > 0) {
          toast.success(`Check-in enregistré · Retard : ${data.retard_minutes} min`);
        } else {
          toast.success("Check-in enregistré");
        }
        onCheckinDone?.();
      } else {
        toast.error((result as { message?: string }).message || "Erreur lors du check-in");
      }
    } catch {
      toast.error("Erreur serveur");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckout = async () => {
    if (!effectiveCheckinId) {
      toast.error("Aucun check-in actif trouvé");
      return;
    }
    setCheckingOut(true);
    try {
      const result = await apiClient.checkout(effectiveCheckinId);
      if (result.success) {
        const d = result.data as {
          prix_calcule?: number;
          detail_calcul?: string;
          duree_minutes?: number;
        };
        if (d?.prix_calcule !== undefined) {
          setCheckoutResult({
            prixCalcule:   d.prix_calcule,
            detailCalcul:  d.detail_calcul ?? "",
            dureeMinutes:  d.duree_minutes ?? 0,
          });
          const h = Math.floor((d.duree_minutes ?? 0) / 60);
          const m = Math.round((d.duree_minutes ?? 0) % 60);
          const dureeStr = h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}` : `${m}min`;
          toast.success(`Check-out · ${dureeStr} → ${d.prix_calcule?.toLocaleString("fr-FR")} DA`);
        } else {
          toast.success("Check-out enregistré");
        }
        onCheckoutDone?.();
        setShowEncaisser(true);
      } else {
        toast.error((result as { message?: string }).message || "Erreur lors du check-out");
      }
    } catch {
      toast.error("Erreur serveur");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {res && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Détail réservation</h3>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <div className="flex items-center justify-between">
                <Badge variant={getReservationStatutColor(isEnCours ? "en_cours" : res.statut)} size="lg">
                  {getReservationStatutLabel(isEnCours ? "en_cours" : res.statut)}
                </Badge>
                {res.montantTotal > 0 && (
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(res.montantTotal)}
                  </span>
                )}
              </div>

              {/* Heure d'arrivée réelle — visible dès le check-in jusqu'au check-out */}
              {isEnCours && effectiveHeureArrivee && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <LogIn className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Arrivée réelle</p>
                    <p className="text-base font-bold text-blue-900">{formatTime(effectiveHeureArrivee)}</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-sm font-bold text-gray-600">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{clientName}</p>
                    <p className="text-xs text-gray-500">{clientEmail}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{res.espace?.nom || "Espace"}</p>
                    <p className="text-xs text-gray-500">
                      <Users className="w-3 h-3 inline mr-0.5" />
                      {res.participants || 1} participant{(res.participants || 1) > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Début</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(res.dateDebut)}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{formatTime(res.dateDebut)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fin</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(res.dateFin)}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{formatTime(res.dateFin)}</p>
                </div>
              </div>

              {res.modePaiement && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Paiement</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{res.modePaiement}</p>
                  </div>
                </div>
              )}

              {res.notes && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</span>
                  </div>
                  <p className="text-sm text-gray-700">{res.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 px-6 py-4 space-y-2">
              {/* Encaisser — visible pour terminee (paiement différé), uniquement si pas encore payé */}
              {res.statut === "terminee" && !showEncaisser && !estPaye && resteAPayer > 0 && (
                <Button
                  className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setShowEncaisser(true)}
                >
                  <Banknote className="w-4 h-4" />
                  Encaisser {resteAPayer > 0 ? `· ${formatCurrency(resteAPayer)}` : ""}
                </Button>
              )}
              {/* Badge payé */}
              {estPaye && (
                <div className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle className="w-4 h-4" />
                  Paiement reçu · {formatCurrency(effectiveMontantPaye)}
                </div>
              )}

              {/* Confirmer / Refuser */}
              {res.statut === "en_attente" && (
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    className="flex-1 gap-1.5"
                    onClick={() => onStatusChange(res.id, "confirmee")}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirmer
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1 gap-1.5"
                    onClick={() => onStatusChange(res.id, "annulee")}
                  >
                    <XCircle className="w-4 h-4" />
                    Refuser
                  </Button>
                </div>
              )}

              {/* Check-in — uniquement si confirmée et pas encore checké */}
              {res.statut === "confirmee" && !localCheckinId && (
                <Button
                  className="w-full gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
                  onClick={handleCheckin}
                  loading={checkingIn}
                >
                  <LogIn className="w-4 h-4" />
                  Check-in
                </Button>
              )}

                      {/* Check-out + Encaisser — si en cours */}
              {(isEnCours && res.statut !== "terminee") && (
                <Button
                  className="w-full gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handleCheckout}
                  loading={checkingOut}
                >
                  <LogOut className="w-4 h-4" />
                  Check-out · Encaisser
                </Button>
              )}

              {/* Annuler */}
              {res.statut !== "annulee" && res.statut !== "terminee" && (
                <button
                  onClick={() => onStatusChange(res.id, "annulee")}
                  className="w-full py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-center"
                >
                  Annuler la réservation
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* Modal encaissement — s'ouvre automatiquement après checkout */}
      {showEncaisser && (
        <EncaisserModal
          data={{
            reservationId:   res!.id,
            typeTransaction: "reservation",
            // Prix calculé depuis checkin/checkout réels, sinon prix de la réservation
            montantSuggere:  checkoutResult?.prixCalcule ?? res!.montantTotal ?? 0,
            montantCalcule:  checkoutResult?.prixCalcule ?? res!.montantTotal ?? 0,
            detailCalcul:    checkoutResult?.detailCalcul,
            dureeMinutes:    checkoutResult?.dureeMinutes,
            label: `${res!.espace?.nom || "Location"} – ${clientName}`,
          }}
          onClose={() => setShowEncaisser(false)}
          onSuccess={(numeroRecu) => {
            toast.success(`Encaissement enregistré · Reçu ${numeroRecu}`);
            setShowEncaisser(false);
            setLocalMontantPaye(checkoutResult?.prixCalcule ?? res?.montantTotal ?? 0);
            setCheckoutResult(null);
            onEncaissementDone?.();
          }}
        />
      )}
    </AnimatePresence>
  );
}
