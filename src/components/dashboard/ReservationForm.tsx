import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Step1EspaceSelector from "../reservation/Step1EspaceSelector";
import Step2DateTimePicker from "../reservation/Step2DateTimePicker";
import Step3Confirmation from "../reservation/Step3Confirmation";
import { useReservationFlow } from "../../hooks/useReservationFlow";
import type { Espace } from "../../types";

interface ReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEspace?: Espace | (Partial<Espace> & { id: string; nom: string; type: string });
  editMode?: boolean;
  reservationId?: string;
  initialData?: {
    dateDebut: Date;
    dateFin: Date;
    participants: number;
    notes: string;
  };
}

const STEPS = [
  { label: "Espace" },
  { label: "Date & Heure" },
  { label: "Confirmation" },
];

const StepIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <div className="flex items-center gap-2 py-4 px-5 border-b border-gray-100 bg-gray-50">
    {STEPS.map((s, i) => {
      const stepNum = i + 1;
      const isDone = stepNum < currentStep;
      const isActive = stepNum === currentStep;
      return (
        <React.Fragment key={s.label}>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isDone
                  ? "bg-emerald-500 text-white"
                  : isActive
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {isDone ? <Check className="w-3 h-3" /> : stepNum}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${
                isActive ? "text-gray-900" : isDone ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 rounded-full ${isDone ? "bg-emerald-300" : "bg-gray-200"}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const ReservationForm: React.FC<ReservationFormProps> = ({
  isOpen,
  onClose,
  selectedEspace,
  editMode = false,
  reservationId,
  initialData,
}) => {
  const normalizedEspace = selectedEspace
    ? ({
        id: selectedEspace.id,
        nom: selectedEspace.nom,
        type: selectedEspace.type as Espace["type"],
        capacite: (selectedEspace as Espace).capacite ?? 1,
        prixHeure: (selectedEspace as Espace).prixHeure ?? 0,
        prixDemiJournee: (selectedEspace as Espace).prixDemiJournee ?? 0,
        prixJour: (selectedEspace as Espace).prixJour ?? (selectedEspace as { prix_jour?: number }).prix_jour ?? 0,
        prixSemaine: (selectedEspace as Espace).prixSemaine ?? 0,
        prixMois: (selectedEspace as Espace).prixMois,
        disponible: (selectedEspace as Espace).disponible ?? true,
        description: (selectedEspace as Espace).description ?? "",
        equipements: (selectedEspace as Espace).equipements ?? [],
        createdAt: (selectedEspace as Espace).createdAt ?? new Date(),
        updatedAt: (selectedEspace as Espace).updatedAt ?? new Date(),
      } satisfies Espace)
    : undefined;

  const { state, actions } = useReservationFlow({
    editMode,
    reservationId,
    initialEspace: normalizedEspace,
    initialData,
    onSuccess: onClose,
  });

  const handleClose = () => {
    actions.reset();
    onClose();
  };

  const canGoPrev = state.step > (editMode ? 2 : 1);

  const handlePrev = () => {
    if (canGoPrev) {
      actions.goToStep((state.step - 1) as 1 | 2 | 3);
    }
  };

  const handleNext = () => {
    if (state.step < 3 && actions.canGoNext) {
      actions.goToStep((state.step + 1) as 2 | 3);
    }
  };

  const showFooter = state.step < 3;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editMode ? "Modifier la réservation" : "Nouvelle réservation"}
      size="lg"
    >
      <div className="-mx-4 -mt-2">
        {!editMode && <StepIndicator currentStep={state.step} />}

        <div className="px-5 py-4 overflow-y-auto max-h-[65vh]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={state.step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
            >
              {state.step === 1 && (
                <Step1EspaceSelector state={state} actions={actions} />
              )}
              {state.step === 2 && (
                <Step2DateTimePicker state={state} actions={actions} />
              )}
              {state.step === 3 && (
                <Step3Confirmation state={state} actions={actions} editMode={editMode} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {showFooter && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
            {state.step === 2 && state.pricing && (
              <div className="text-sm font-medium text-gray-700">
                Estimation :{" "}
                <span className="font-bold text-gray-900">
                  {state.pricing.total.toLocaleString("fr-FR")} DA
                </span>
              </div>
            )}
            {!(state.step === 2 && state.pricing) && <div />}

            <div className="flex items-center gap-2">
              {canGoPrev && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Retour
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleNext}
                disabled={!actions.canGoNext}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continuer
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReservationForm;
