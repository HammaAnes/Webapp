import { useState, useMemo, useCallback } from 'react';
import type { User } from '../../types';
import {
  type WizardFormData,
  type SituationAdministrative,
  type TypeStructure,
  type UploadedDocument,
  type DomiciliationOptions,
  type RepresentantLegal,
  type DonneesA1,
  type DonneesA2,
  type DonneesB1,
  type DonneesB2,
  getCasMetier,
  DEFAULT_OPTIONS,
} from '../domain/types';
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  validateStep6,
  firstError,
} from '../domain/validators';
import { getRequiredDocuments, mapTypeEntrepriseToFormeJuridique } from '../domain/constants';

export const WIZARD_STEP_COUNT = 8;

export interface WizardStepConfig {
  id: number;
  title: string;
  icon: string;
}

export const WIZARD_STEPS: WizardStepConfig[] = [
  { id: 1, title: 'Situation', icon: 'HelpCircle' },
  { id: 2, title: 'Structure', icon: 'Building' },
  { id: 3, title: 'Dirigeant', icon: 'User' },
  { id: 4, title: 'Entreprise', icon: 'Briefcase' },
  { id: 5, title: 'Documents', icon: 'FileText' },
  { id: 6, title: 'CGU', icon: 'Shield' },
  { id: 7, title: 'Options', icon: 'Package' },
  { id: 8, title: 'Récapitulatif', icon: 'CheckCircle' },
];

function initialDirigeant(user: User): RepresentantLegal {
  return {
    nom: user.nom || '',
    prenom: user.prenom || '',
    telephone: user.telephone || '',
    email: user.email || '',
    adresseResidence: '',
    ville: '',
    fonction: '',
  };
}

function initialEntreprise(
  situation: SituationAdministrative,
  typeStructure: TypeStructure,
  user: User
): WizardFormData['entreprise'] {
  const cas = getCasMetier(situation, typeStructure);
  if (cas === 'A1') {
    return {
      denominationSociale: user.raisonSociale || '',
      formeJuridique: mapTypeEntrepriseToFormeJuridique(user.typeEntreprise) || '',
      codeNae: '',
    } satisfies DonneesA1;
  }
  if (cas === 'A2') {
    return {
      activiteExercee: user.activitePrincipale || '',
      descriptionActivite: '',
    } satisfies DonneesA2;
  }
  if (cas === 'B1') {
    return {
      denominationSociale: user.raisonSociale || '',
      formeJuridique: mapTypeEntrepriseToFormeJuridique(user.typeEntreprise) || '',
      registreCommerce: user.registreCommerce || '',
      nif: user.nif || '',
      nis: user.nis || '',
      articleImposition: user.articleImposition || '',
      codeNae: '',
      dateCreationEntreprise: null,
      villeImmatriculation: '',
    } satisfies DonneesB1;
  }
  return {
    numeroAutoEntrepreneur: user.numeroAutoEntrepreneur || '',
    activiteExercee: user.activitePrincipale || '',
    dateInscriptionAutoEntrepreneur: null,
  } satisfies DonneesB2;
}

export interface UseWizardReturn {
  currentStep: number;
  formData: WizardFormData;
  uploadedDocuments: UploadedDocument[];
  errors: Record<string, string>;
  isSubmitting: boolean;
  casMetier: ReturnType<typeof getCasMetier> | null;
  requiredDocs: ReturnType<typeof getRequiredDocuments> | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  goNext: () => void;
  goBack: () => void;
  setSituation: (v: SituationAdministrative) => void;
  setTypeStructure: (v: TypeStructure) => void;
  updateDirigeant: (partial: Partial<RepresentantLegal>) => void;
  updateEntreprise: (partial: Record<string, unknown>) => void;
  setDateDebutSouhaitee: (d: Date | null) => void;
  setCguAcceptees: (v: boolean) => void;
  updateOptions: (partial: Partial<DomiciliationOptions>) => void;
  addDocument: (doc: UploadedDocument) => void;
  removeDocument: (id: string) => void;
  getUploadedDoc: (type: string) => UploadedDocument | undefined;
  submit: () => Promise<void>;
  reset: () => void;
  setIsSubmitting: (v: boolean) => void;
}

export function useWizard(
  user: User,
  onSubmit: (data: WizardFormData, docs: UploadedDocument[]) => Promise<void>,
  initialStep = 1,
  initialData?: Partial<WizardFormData>
): UseWizardReturn {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);

  const [formData, setFormData] = useState<WizardFormData>(() => ({
    situation: initialData?.situation ?? null,
    typeStructure: initialData?.typeStructure ?? null,
    dirigeant: initialData?.dirigeant ?? initialDirigeant(user),
    dateDebutSouhaitee: initialData?.dateDebutSouhaitee ?? null,
    entreprise: initialData?.entreprise ?? null,
    cguAcceptees: initialData?.cguAcceptees ?? false,
    options: initialData?.options ?? { ...DEFAULT_OPTIONS },
  }));

  const casMetier = useMemo(() => {
    if (!formData.situation || !formData.typeStructure) return null;
    return getCasMetier(formData.situation, formData.typeStructure);
  }, [formData.situation, formData.typeStructure]);

  const requiredDocs = useMemo(() => {
    if (!formData.situation || !formData.typeStructure) return null;
    return getRequiredDocuments(formData.situation, formData.typeStructure);
  }, [formData.situation, formData.typeStructure]);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1: return !!formData.situation;
      case 2: return !!formData.typeStructure;
      case 3: {
        const d = formData.dirigeant;
        return !!(d.adresseResidence?.trim() && d.ville?.trim() && d.telephone?.trim() && d.email?.trim() && formData.dateDebutSouhaitee);
      }
      case 4: return !!formData.entreprise;
      case 5: return true;
      case 6: return formData.cguAcceptees;
      case 7: return true;
      case 8: return true;
      default: return true;
    }
  }, [currentStep, formData]);

  const validateCurrentStep = useCallback((): boolean => {
    let result = { valid: true, errors: {} as Record<string, string> };
    switch (currentStep) {
      case 1: result = validateStep1({ situation: formData.situation }); break;
      case 2: result = validateStep2({ typeStructure: formData.typeStructure }); break;
      case 3: result = validateStep3({ dirigeant: formData.dirigeant, dateDebutSouhaitee: formData.dateDebutSouhaitee }); break;
      case 4:
        if (formData.situation && formData.typeStructure) {
          result = validateStep4(formData.situation, formData.typeStructure, formData.entreprise);
        }
        break;
      case 5:
        if (requiredDocs) {
          result = validateStep5(uploadedDocuments, requiredDocs);
        }
        break;
      case 6: result = validateStep6(formData.cguAcceptees); break;
      default: break;
    }
    if (!result.valid) setErrors(result.errors);
    else setErrors({});
    return result.valid;
  }, [currentStep, formData, uploadedDocuments, requiredDocs]);

  const goNext = useCallback(() => {
    if (!validateCurrentStep()) return;
    if (currentStep < WIZARD_STEP_COUNT) setCurrentStep(s => s + 1);
  }, [currentStep, validateCurrentStep]);

  const goBack = useCallback(() => {
    setErrors({});
    if (currentStep > 1) setCurrentStep(s => s - 1);
  }, [currentStep]);

  const setSituation = useCallback((v: SituationAdministrative) => {
    setFormData(prev => ({
      ...prev,
      situation: v,
      typeStructure: null,
      entreprise: null,
    }));
    setErrors({});
  }, []);

  const setTypeStructure = useCallback((v: TypeStructure) => {
    setFormData(prev => {
      const situation = prev.situation;
      const newEntreprise = situation ? initialEntreprise(situation, v, user) : null;
      return { ...prev, typeStructure: v, entreprise: newEntreprise };
    });
    setErrors({});
  }, [user]);

  const updateDirigeant = useCallback((partial: Partial<RepresentantLegal>) => {
    setFormData(prev => ({ ...prev, dirigeant: { ...prev.dirigeant, ...partial } }));
  }, []);

  const updateEntreprise = useCallback((partial: Record<string, unknown>) => {
    setFormData(prev => ({
      ...prev,
      entreprise: prev.entreprise ? { ...prev.entreprise as unknown as Record<string, unknown>, ...partial } as unknown as WizardFormData['entreprise'] : null,
    }));
  }, []);

  const setDateDebutSouhaitee = useCallback((d: Date | null) => {
    setFormData(prev => ({ ...prev, dateDebutSouhaitee: d }));
  }, []);

  const setCguAcceptees = useCallback((v: boolean) => {
    setFormData(prev => ({ ...prev, cguAcceptees: v }));
    if (v) setErrors(prev => { const e = { ...prev }; delete e.cgu; return e; });
  }, []);

  const updateOptions = useCallback((partial: Partial<DomiciliationOptions>) => {
    setFormData(prev => ({ ...prev, options: { ...prev.options, ...partial } }));
  }, []);

  const addDocument = useCallback((doc: UploadedDocument) => {
    setUploadedDocuments(prev => {
      const filtered = prev.filter(d => d.type !== doc.type);
      return [...filtered, doc];
    });
  }, []);

  const removeDocument = useCallback((id: string) => {
    setUploadedDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  const getUploadedDoc = useCallback((type: string): UploadedDocument | undefined => {
    return uploadedDocuments.find(d => d.type === type);
  }, [uploadedDocuments]);

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData, uploadedDocuments);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, uploadedDocuments, onSubmit]);

  const reset = useCallback(() => {
    setCurrentStep(1);
    setErrors({});
    setUploadedDocuments([]);
    setFormData({
      situation: null,
      typeStructure: null,
      dirigeant: initialDirigeant(user),
      dateDebutSouhaitee: null,
      entreprise: null,
      cguAcceptees: false,
      options: { ...DEFAULT_OPTIONS },
    });
  }, [user]);

  return {
    currentStep,
    formData,
    uploadedDocuments,
    errors,
    isSubmitting,
    casMetier,
    requiredDocs,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === WIZARD_STEP_COUNT,
    canProceed,
    goNext,
    goBack,
    setSituation,
    setTypeStructure,
    updateDirigeant,
    updateEntreprise,
    setDateDebutSouhaitee,
    setCguAcceptees,
    updateOptions,
    addDocument,
    removeDocument,
    getUploadedDoc,
    submit,
    reset,
    setIsSubmitting,
  };
}

export { firstError };
