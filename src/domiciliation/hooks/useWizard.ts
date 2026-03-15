import { useState, useMemo, useCallback } from 'react';
import type {
  WizardFormData,
  SituationAdministrative,
  TypeStructure,
  RepresentantLegal,
  DomiciliationOptions,
  UploadedDocument,
  DonneesA1,
  DonneesA2,
  DonneesB1,
  DonneesB2,
  RequiredDocument,
  CasMetier,
} from '../domain/types';
import {
  DEFAULT_OPTIONS,
  getCasMetier,
} from '../domain/types';
import { getRequiredDocuments } from '../domain/constants';
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  validateStep6,
} from '../domain/validators';
import type { User } from '../../types';

export const WIZARD_STEP_COUNT = 8;

export const WIZARD_STEPS = [
  { id: 1, title: 'Situation', icon: 'HelpCircle' },
  { id: 2, title: 'Structure', icon: 'Building' },
  { id: 3, title: 'Dirigeant', icon: 'User' },
  { id: 4, title: 'Entreprise', icon: 'Briefcase' },
  { id: 5, title: 'Documents', icon: 'FileText' },
  { id: 6, title: 'CGU', icon: 'Scale' },
  { id: 7, title: 'Options', icon: 'Package' },
  { id: 8, title: 'Confirmation', icon: 'FileCheck' },
] as const;

function createInitialDirigeant(user: User): RepresentantLegal {
  return {
    nom: user.nom || '',
    prenom: user.prenom || '',
    telephone: user.telephone || '',
    email: user.email || '',
    adresseResidence: user.adresse || '',
    ville: user.wilaya || '',
    fonction: '',
  };
}

function createEntrepriseDefaults(situation: SituationAdministrative, typeStructure: TypeStructure) {
  const cas = getCasMetier(situation, typeStructure);
  if (cas === 'A1') return { denominationSociale: '', formeJuridique: '' as const, codeNae: '' } as DonneesA1;
  if (cas === 'A2') return { activiteExercee: '', descriptionActivite: '' } as DonneesA2;
  if (cas === 'B1') return {
    denominationSociale: '', formeJuridique: '' as const,
    registreCommerce: '', nif: '', nis: '', articleImposition: '',
    codeNae: '', dateCreationEntreprise: null, villeImmatriculation: '',
  } as DonneesB1;
  return {
    numeroAutoEntrepreneur: '', activiteExercee: '', dateInscriptionAutoEntrepreneur: null,
  } as DonneesB2;
}

function createInitialFormData(user: User): WizardFormData {
  return {
    situation: null,
    typeStructure: null,
    dirigeant: createInitialDirigeant(user),
    dateDebutSouhaitee: null,
    entreprise: null,
    cguAcceptees: false,
    options: DEFAULT_OPTIONS,
  };
}

export interface WizardState {
  currentStep: number;
  formData: WizardFormData;
  uploadedDocuments: UploadedDocument[];
  errors: Record<string, string>;
  isSubmitting: boolean;
  casMetier: CasMetier | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  requiredDocs: RequiredDocument[];
}

export interface WizardActions {
  goNext: () => void;
  goBack: () => void;
  setSituation: (s: SituationAdministrative) => void;
  setTypeStructure: (t: TypeStructure) => void;
  updateDirigeant: (patch: Partial<RepresentantLegal>) => void;
  updateEntreprise: (patch: Record<string, unknown>) => void;
  setCguAcceptees: (v: boolean) => void;
  updateOptions: (patch: Partial<DomiciliationOptions>) => void;
  setDateDebutSouhaitee: (d: Date | null) => void;
  addDocument: (doc: UploadedDocument) => void;
  removeDocument: (id: string) => void;
  getUploadedDoc: (type: string) => UploadedDocument | undefined;
  submit: () => Promise<void>;
  reset: (user: User) => void;
  setCurrentStep: (step: number) => void;
}

export function useWizard(
  user: User,
  onSubmit: (formData: WizardFormData, documents: UploadedDocument[]) => Promise<void>
): WizardState & WizardActions {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>(() => createInitialFormData(user));
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const casMetier = useMemo<CasMetier | null>(() => {
    if (formData.situation && formData.typeStructure) {
      return getCasMetier(formData.situation, formData.typeStructure);
    }
    return null;
  }, [formData.situation, formData.typeStructure]);

  const requiredDocs = useMemo<RequiredDocument[]>(() => {
    if (formData.situation && formData.typeStructure) {
      return getRequiredDocuments(formData.situation, formData.typeStructure);
    }
    return [];
  }, [formData.situation, formData.typeStructure]);

  const canProceed = useMemo<boolean>(() => {
    switch (currentStep) {
      case 1: return formData.situation !== null;
      case 2: return formData.typeStructure !== null;
      case 3: {
        const r = validateStep3(formData);
        return r.valid;
      }
      case 4: {
        if (!formData.entreprise) return false;
        const r = validateStep4(formData);
        return r.valid;
      }
      case 5: return true;
      case 6: return formData.cguAcceptees;
      case 7: return true;
      case 8: return true;
      default: return false;
    }
  }, [currentStep, formData, uploadedDocuments]);

  const setSituation = useCallback((s: SituationAdministrative) => {
    setFormData((prev) => ({
      ...prev,
      situation: s,
      typeStructure: null,
      entreprise: null,
    }));
    setErrors({});
  }, []);

  const setTypeStructure = useCallback((t: TypeStructure) => {
    setFormData((prev) => {
      if (!prev.situation) return prev;
      return {
        ...prev,
        typeStructure: t,
        entreprise: createEntrepriseDefaults(prev.situation, t),
      };
    });
    setErrors({});
  }, []);

  const updateDirigeant = useCallback((patch: Partial<RepresentantLegal>) => {
    setFormData((prev) => ({
      ...prev,
      dirigeant: { ...prev.dirigeant, ...patch },
    }));
  }, []);

  const updateEntreprise = useCallback((patch: Record<string, unknown>) => {
    setFormData((prev) => ({
      ...prev,
      entreprise: prev.entreprise ? { ...prev.entreprise, ...patch } : null,
    }));
  }, []);

  const setCguAcceptees = useCallback((v: boolean) => {
    setFormData((prev) => ({ ...prev, cguAcceptees: v }));
  }, []);

  const updateOptions = useCallback((patch: Partial<DomiciliationOptions>) => {
    setFormData((prev) => ({
      ...prev,
      options: { ...prev.options, ...patch },
    }));
  }, []);

  const setDateDebutSouhaitee = useCallback((d: Date | null) => {
    setFormData((prev) => ({ ...prev, dateDebutSouhaitee: d }));
  }, []);

  const addDocument = useCallback((doc: UploadedDocument) => {
    setUploadedDocuments((prev) => {
      const filtered = prev.filter((d) => d.type !== doc.type);
      return [...filtered, doc];
    });
  }, []);

  const removeDocument = useCallback((id: string) => {
    setUploadedDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const getUploadedDoc = useCallback(
    (type: string): UploadedDocument | undefined => {
      return uploadedDocuments.find((d) => d.type === type);
    },
    [uploadedDocuments]
  );

  const validateCurrentStep = useCallback((): boolean => {
    let result;
    switch (currentStep) {
      case 1: result = validateStep1(formData); break;
      case 2: result = validateStep2(formData); break;
      case 3: result = validateStep3(formData); break;
      case 4: result = validateStep4(formData); break;
      case 5: result = validateStep5(uploadedDocuments, requiredDocs); break;
      case 6: result = validateStep6(formData); break;
      default: result = { valid: true, errors: {} };
    }
    if (!result.valid) {
      setErrors(result.errors);
      return false;
    }
    setErrors({});
    return true;
  }, [currentStep, formData, uploadedDocuments, requiredDocs]);

  const goNext = useCallback(() => {
    if (!validateCurrentStep()) return;
    if (currentStep < WIZARD_STEP_COUNT) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, validateCurrentStep]);

  const goBack = useCallback(() => {
    setErrors({});
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData, uploadedDocuments);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, uploadedDocuments, onSubmit]);

  const reset = useCallback((u: User) => {
    setCurrentStep(1);
    setFormData(createInitialFormData(u));
    setUploadedDocuments([]);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  return {
    currentStep,
    formData,
    uploadedDocuments,
    errors,
    isSubmitting,
    casMetier,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === WIZARD_STEP_COUNT,
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
    reset,
    setCurrentStep,
  };
}
