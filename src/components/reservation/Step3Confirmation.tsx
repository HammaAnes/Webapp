import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Calendar, Clock, Users, Tag, FileText, CheckCircle, X, Loader2 } from "lucide-react";
import { formatPrice } from "../../utils/formatters";
import type { ReservationFlowActions, ReservationFlowState } from "../../hooks/useReservationFlow";
import Button from "../ui/Button";

function getSpaceImage(nom: string, type: string): string {
  const lower = (nom + " " + type).toLowerCase();
  if (lower.includes("salle") || lower.includes("reunion")) return "/salle-reunion.jpeg";
  if (lower.includes("open") || lower.includes("cowork")) return "/espace-coworking.jpeg";
  if (lower.includes("atlas")) return "/booth-atlas.jpeg";
  if (lower.includes("aures") || lower.includes("aurès")) return "/booth-aures.jpeg";
  if (lower.includes("hoggar")) return "/booth-hoggar.jpeg";
  return "/espace-coworking.jpeg";
}

interface Step3ConfirmationProps {
  state: ReservationFlowState;
  actions: ReservationFlowActions;
  editMode?: boolean;
}

const Step3Confirmation: React.FC<Step3ConfirmationProps> = ({ state, actions, editMode }) => {
  const {
    selectedEspace,
    dateDebut,
    dateFin,
    participants,
    notes,
    promoCode,
    promoApplied,
    promoReduction,
    promoError,
    pricing,
    isValidatingPromo,
    isSubmitting,
  } = state;

  if (!selectedEspace || !dateDebut || !dateFin || !pricing) return null;

  const image = getSpaceImage(selectedEspace.nom, selectedEspace.type);
  const isSameDay = dateDebut.toDateString() === dateFin.toDateString();

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Confirmation de réservation</h3>
        <p className="text-sm text-gray-500">Vérifiez les détails avant de confirmer</p>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200">
        <div className="relative h-32">
          <img src={image} alt={selectedEspace.nom} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-white font-semibold">{selectedEspace.nom}</p>
            <p className="text-white/70 text-sm flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Mohammadia Mall, Alger
            </p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isSameDay
                  ? format(dateDebut, "EEEE d MMMM yyyy", { locale: fr })
                  : `${format(dateDebut, "d MMM yyyy", { locale: fr })} → ${format(dateFin, "d MMM yyyy", { locale: fr })}`}
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {format(dateDebut, "HH:mm")} – {format(dateFin, "HH:mm")}
              </p>
            </div>
          </div>

          {selectedEspace.type === "open_space" && (
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-gray-400 shrink-0" />
              <p className="text-sm text-gray-900">
                {participants} participant{participants > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          <FileText className="w-3.5 h-3.5 inline mr-1" />
          Notes (optionnel)
        </label>
        <textarea
          value={notes}
          onChange={(e) => actions.setNotes(e.target.value)}
          rows={3}
          placeholder="Équipements particuliers, configuration souhaitée..."
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {!editMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Tag className="w-3.5 h-3.5 inline mr-1" />
            Code promo (optionnel)
          </label>
          {promoApplied ? (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">
                  {promoCode} — -{formatPrice(promoReduction)}
                </span>
              </div>
              <button
                type="button"
                onClick={actions.removePromo}
                className="text-emerald-600 hover:text-emerald-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => actions.setPromoCode(e.target.value.toUpperCase())}
                placeholder="CODE PROMO"
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                  promoError ? "border-red-300 bg-red-50" : "border-gray-200"
                }`}
                onKeyDown={(e) => e.key === "Enter" && actions.validatePromo()}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={actions.validatePromo}
                disabled={!promoCode.trim() || isValidatingPromo}
                loading={isValidatingPromo}
                className="px-4"
              >
                Appliquer
              </Button>
            </div>
          )}
          {promoError && (
            <p className="mt-1.5 text-xs text-red-600">{promoError}</p>
          )}
        </div>
      )}

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Sous-total</span>
          <span>{formatPrice(pricing.baseAmount)}</span>
        </div>
        {pricing.reduction > 0 && (
          <div className="flex justify-between text-sm text-emerald-700">
            <span>Réduction</span>
            <span>-{formatPrice(pricing.reduction)}</span>
          </div>
        )}
        <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span className="text-xl text-primary">{formatPrice(pricing.total)}</span>
        </div>
        <p className="text-xs text-gray-400 text-center">Paiement à l'arrivée en espèces ou virement</p>
      </div>

      <Button
        type="button"
        onClick={async () => { await actions.submit(); }}
        disabled={isSubmitting}
        loading={isSubmitting}
        className="w-full"
        size="lg"
      >
        {editMode ? "Modifier la réservation" : "Confirmer la réservation"}
      </Button>
    </div>
  );
};

export default Step3Confirmation;
