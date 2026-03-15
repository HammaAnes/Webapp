import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import StepIndicator from './StepIndicator';
import {
  Step1Situation,
  Step2Structure,
  Step3Dirigeant,
  Step4Entreprise,
  Step5Documents,
  Step6CGU,
  Step7Options,
  Step8Summary,
  type StepProps,
} from './WizardSteps';
import { useWizard, WIZARD_STEP_COUNT } from '../../hooks/useWizard';
import type { User } from '../../../types';
import type { WizardFormData, UploadedDocument } from '../../domain/types';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSubmit: (formData: WizardFormData, documents: UploadedDocument[]) => Promise<void>;
}

const stepComponents = [
  Step1Situation,
  Step2Structure,
  Step3Dirigeant,
  Step4Entreprise,
  Step5Documents,
  Step6CGU,
  Step7Options,
  Step8Summary,
];

const WizardModal: React.FC<WizardModalProps> = ({ isOpen, onClose, user, onSubmit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wizard = useWizard(user, onSubmit);
  const {
    currentStep,
    formData,
    uploadedDocuments,
    errors,
    isSubmitting,
    casMetier,
    isFirstStep,
    isLastStep,
    canProceed,
    requiredDocs,
    goNext,
    goBack,
    setSituation,
    setTypeStructure,
    updateDirigeant,
    updateEntreprise,
    setCguAcceptees,
    updateOptions,
    setDateDebutSouhaitee,
    addDocument,
    removeDocument,
    getUploadedDoc,
    submit,
  } = wizard;

  const CurrentStepComponent = stepComponents[currentStep - 1];

  const stepProps: StepProps = {
    formData,
    errors,
    uploadedDocuments,
    requiredDocs,
    casMetier,
    onSituationChange: setSituation,
    onTypeStructureChange: setTypeStructure,
    onDirigeantChange: updateDirigeant,
    onEntrepriseChange: updateEntreprise,
    onCguChange: setCguAcceptees,
    onOptionsChange: updateOptions,
    onDateDebutChange: setDateDebutSouhaitee,
    onAddDocument: addDocument,
    onRemoveDocument: removeDocument,
    getUploadedDoc,
    fileInputRef,
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" className="p-0">
      <div className="flex flex-col h-full max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Demande de domiciliation</h2>
            <p className="text-xs text-gray-500">Étape {currentStep} sur {WIZARD_STEP_COUNT}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <StepIndicator currentStep={currentStep} />

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {CurrentStepComponent && <CurrentStepComponent {...stepProps} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={isFirstStep || isSubmitting}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Précédent
          </Button>

          {isLastStep ? (
            <Button
              variant="primary"
              onClick={submit}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer ma demande
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={goNext}
              disabled={!canProceed || isSubmitting}
              className="flex items-center gap-2"
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default WizardModal;
