import React, { useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
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
  Step7Summary,
} from './WizardSteps';
import { useDomiciliationWizard as useWizard, WIZARD_STEPS, WIZARD_STEP_COUNT } from '../../hooks/useDomiciliationWizard';
import { useDraft } from '../../hooks/useDraft';
import { isValidFile } from '../../domain/validators';
import type { User } from '../../../types';
import type { WizardFormData, UploadedDocument } from '../../domain/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSubmit: (formData: WizardFormData, docs: UploadedDocument[]) => Promise<void>;
}

export default function WizardModal({ isOpen, onClose, user, onSubmit }: Props) {
  const draft = useDraft(user.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDocTypeRef = useRef<string>('');

  const savedDraft = draft.load();

  const wizard = useWizard(
    user,
    onSubmit,
    savedDraft?.step ?? 1,
    savedDraft?.formData
  );

  useEffect(() => {
    if (isOpen && draft.hasDraft()) {
      toast.success('Brouillon restauré');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (wizard.currentStep > 1) {
      draft.save({ formData: wizard.formData, step: wizard.currentStep });
    }
  }, [wizard.formData, wizard.currentStep, isOpen]);

  const handleClose = () => {
    if (wizard.currentStep > 1) {
      draft.save({ formData: wizard.formData, step: wizard.currentStep });
      toast.success('Brouillon sauvegardé');
    }
    onClose();
  };

  const handleFileUpload = (docType: string) => {
    pendingDocTypeRef.current = docType;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isValidFile(file)) {
      toast.error('Fichier invalide. PDF, JPEG ou PNG, max 5 Mo');
      e.target.value = '';
      return;
    }
    const docType = pendingDocTypeRef.current;
    wizard.addDocument({ id: `${docType}-${Date.now()}`, name: file.name, type: docType, file });
    toast.success(`"${file.name}" ajouté`);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await wizard.submit();
    draft.clear();
    wizard.reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Demande de Domiciliation">
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />

        <StepIndicator currentStep={wizard.currentStep} steps={WIZARD_STEPS} />

        <AnimatePresence mode="wait">
          {wizard.currentStep === 1 && (
            <Step1Situation
              situation={wizard.formData.situation}
              onSelect={wizard.setSituation}
            />
          )}
          {wizard.currentStep === 2 && (
            <Step2Structure
              situation={wizard.formData.situation}
              typeStructure={wizard.formData.typeStructure}
              onSelect={wizard.setTypeStructure}
            />
          )}
          {wizard.currentStep === 3 && (
            <Step3Dirigeant
              dirigeant={wizard.formData.dirigeant}
              dateDebutSouhaitee={wizard.formData.dateDebutSouhaitee}
              errors={wizard.errors}
              onUpdate={wizard.updateDirigeant}
              setDateDebutSouhaitee={wizard.setDateDebutSouhaitee}
            />
          )}
          {wizard.currentStep === 4 && wizard.formData.situation && wizard.formData.typeStructure && (
            <Step4Entreprise
              situation={wizard.formData.situation}
              typeStructure={wizard.formData.typeStructure}
              entreprise={wizard.formData.entreprise}
              errors={wizard.errors}
              onChange={wizard.updateEntreprise}
            />
          )}
          {wizard.currentStep === 5 && wizard.formData.situation && wizard.formData.typeStructure && (
            <Step5Documents
              situation={wizard.formData.situation}
              typeStructure={wizard.formData.typeStructure}
              uploadedDocuments={wizard.uploadedDocuments}
              onUpload={handleFileUpload}
              onRemove={wizard.removeDocument}
              getUploadedDoc={wizard.getUploadedDoc}
            />
          )}
          {wizard.currentStep === 6 && (
            <Step6CGU
              cguAcceptees={wizard.formData.cguAcceptees}
              onToggle={wizard.setCguAcceptees}
            />
          )}
          {wizard.currentStep === 7 && wizard.formData.situation && wizard.formData.typeStructure && (
            <Step7Summary
              situation={wizard.formData.situation}
              typeStructure={wizard.formData.typeStructure}
              formData={wizard.formData}
              uploadedDocuments={wizard.uploadedDocuments}
            />
          )}
        </AnimatePresence>

        <div className="flex justify-between gap-3 pt-4 border-t">
          {!wizard.isFirstStep && (
            <Button type="button" variant="outline" onClick={wizard.goBack} disabled={wizard.isSubmitting}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
          )}
          {!wizard.isLastStep && (
            <Button
              type="button"
              onClick={wizard.goNext}
              disabled={!wizard.canProceed}
              className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          {wizard.isLastStep && (
            <Button
              type="submit"
              disabled={wizard.isSubmitting}
              className={`ml-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 ${wizard.currentStep === 1 ? '' : ''}`}
            >
              {wizard.isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Envoi en cours...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Envoyer la demande
                </span>
              )}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

export { WIZARD_STEP_COUNT };
