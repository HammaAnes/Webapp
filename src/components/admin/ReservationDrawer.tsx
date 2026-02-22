import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  MapPin,
  Clock,
  CreditCard,
  Users,
  CheckCircle,
  XCircle,
  Timer,
  FileText,
  Calendar,
} from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { formatDate, formatTime, formatCurrency } from "../../utils/formatters";
import {
  getReservationStatutColor,
  getReservationStatutLabel,
  type ReservationStatut,
} from "../../constants";
import type { Reservation } from "../../types";

interface ReservationDrawerProps {
  reservation: Reservation | null;
  onClose: () => void;
  onStatusChange: (id: string, statut: string) => void;
}

export default function ReservationDrawer({
  reservation,
  onClose,
  onStatusChange,
}: ReservationDrawerProps) {
  if (!reservation) return null;

  const res = reservation;
  const clientName = `${res.utilisateur?.prenom || ""} ${res.utilisateur?.nom || ""}`.trim() || "Client";
  const initials = `${(res.utilisateur?.prenom || "?")[0]}${(res.utilisateur?.nom || "?")[0]}`.toUpperCase();

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
              <h3 className="text-lg font-semibold text-gray-900">Detail reservation</h3>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <div className="flex items-center justify-between">
                <Badge variant={getReservationStatutColor(res.statut)} size="lg">
                  {getReservationStatutLabel(res.statut)}
                </Badge>
                {res.montantTotal > 0 && (
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(res.montantTotal)}
                  </span>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-sm font-bold text-gray-600">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{clientName}</p>
                    <p className="text-xs text-gray-500">{res.utilisateur?.email || ""}</p>
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
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Debut</span>
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
              {res.statut === "confirmee" && (
                <Button
                  className="w-full gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
                  onClick={() => onStatusChange(res.id, "en_cours")}
                >
                  <Timer className="w-4 h-4" />
                  Marquer en cours
                </Button>
              )}
              {(res.statut === "en_cours" || res.statut === "confirmee") && (
                <Button
                  variant="outline"
                  className="w-full gap-1.5"
                  onClick={() => onStatusChange(res.id, "terminee")}
                >
                  <CheckCircle className="w-4 h-4" />
                  Marquer terminee
                </Button>
              )}
              {res.statut !== "annulee" && res.statut !== "terminee" && (
                <button
                  onClick={() => onStatusChange(res.id, "annulee")}
                  className="w-full py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-center"
                >
                  Annuler la reservation
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
