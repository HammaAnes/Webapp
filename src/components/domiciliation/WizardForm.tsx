import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  FileText,
  Send,
  CheckCircle,
  Plus,
  MapPin,
  User,
  Hash,
  Briefcase,
  Info,
  ArrowRight,
  ArrowLeft,
  Loader2,
  HelpCircle,
  UserPlus,
  Scale,
  Package,
  ScanLine,
  Forward,
  DoorOpen,
  Shield,
  Upload,
  X,
  Mail,
  FileCheck,
} from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Badge from "../ui/Badge";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import type { User as UserType } from "../../types";
import type {
  SituationAdministrative,
  TypeStructureChoice,
  LegalFormType,
  UploadedDocument,
  DomiciliationFormData,
} from "./types";
import {
  WIZARD_STEPS,
  TOTAL_STEPS,
  CGU_TEXT,
  LEGAL_FORM_OPTIONS,
  LEGAL_FORM_OPTIONS_SHORT,
  getRequiredDocuments,
  getCasLabel,
  mapTypeEntrepriseToFormeJuridique,
  INITIAL_FORM_DATA,
  OPTIONS_PRICING,
  BASE_MONTHLY_PRICE,
  calculateTotalMonthly,
} from "./constants";

interface WizardFormProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onSubmit: (data: {
    situation: "en_cours_creation" | "deja_creee";
    typeStructure: "societe" | "auto_entrepreneur";
    formData: DomiciliationFormData;
    uploadedDocuments: UploadedDocument[];
  }) => Promise<void>;
}

const WizardForm: React.FC<WizardFormProps> = ({ isOpen, onClose, user, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [situation, setSituation] = useState<SituationAdministrative>(null);
  const [typeStructure, setTypeStructure] = useState<TypeStructureChoice>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [currentDocumentType, setCurrentDocumentType] = useState<string>("");

  const DRAFT_KEY = `coffice_wizard_draft_${user.id}`;

  const loadDraft = (): { situation: SituationAdministrative; typeStructure: TypeStructureChoice; formData: DomiciliationFormData; step: number } | null => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const draft = JSON.parse(raw);
      if (draft.formData?.dateDebutSouhaitee) draft.formData.dateDebutSouhaitee = new Date(draft.formData.dateDebutSouhaitee);
      if (draft.formData?.dateCreationEntreprise) draft.formData.dateCreationEntreprise = new Date(draft.formData.dateCreationEntreprise);
      if (draft.formData?.dateInscriptionAutoEntrepreneur) draft.formData.dateInscriptionAutoEntrepreneur = new Date(draft.formData.dateInscriptionAutoEntrepreneur);
      return draft;
    } catch {
      return null;
    }
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ situation, typeStructure, formData, step: currentStep }));
    } catch {
      // storage full or unavailable
    }
  };

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* */ }
  };

  const [formData, setFormData] = useState<DomiciliationFormData>(() => {
    const draft = loadDraft();
    return draft?.formData || INITIAL_FORM_DATA(user);
  });

  const [hasDraft] = useState(() => !!loadDraft());

  useEffect(() => {
    if (isOpen && hasDraft) {
      const draft = loadDraft();
      if (draft) {
        setSituation(draft.situation);
        setTypeStructure(draft.typeStructure);
        setFormData(draft.formData);
        setCurrentStep(draft.step);
        toast.success("Brouillon restaure");
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && currentStep > 1) {
      saveDraft();
    }
  }, [formData, situation, typeStructure, currentStep, isOpen]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        denominationSociale: prev.denominationSociale || user.raisonSociale || "",
        formeJuridique: (prev.formeJuridique || mapTypeEntrepriseToFormeJuridique(user.typeEntreprise) || "") as LegalFormType,
        nif: prev.nif || user.nif || "",
        nis: prev.nis || user.nis || "",
        registreCommerce: prev.registreCommerce || user.registreCommerce || "",
        articleImposition: prev.articleImposition || user.articleImposition || "",
        activiteExercee: prev.activiteExercee || user.activitePrincipale || "",
        numeroAutoEntrepreneur: prev.numeroAutoEntrepreneur || user.numeroAutoEntrepreneur || "",
        dirigeant: {
          ...prev.dirigeant,
          nom: user.nom || "",
          prenom: user.prenom || "",
          telephone: user.telephone || "",
          email: user.email || "",
        },
      }));
    }
  }, [user]);

  const resetForm = () => {
    setCurrentStep(1);
    setSituation(null);
    setTypeStructure(null);
    setUploadedDocuments([]);
    setErrors({});
    setFormData(INITIAL_FORM_DATA(user));
    clearDraft();
  };

  const handleClose = () => {
    if (currentStep > 1) {
      saveDraft();
      toast.success("Brouillon sauvegarde");
    }
    onClose();
  };

  const validateStep1 = (): boolean => {
    if (!situation) {
      toast.error("Veuillez indiquer la situation administrative de votre structure");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!typeStructure) {
      toast.error("Veuillez sélectionner le type de structure");
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.dirigeant.adresseResidence.trim()) {
      newErrors["dirigeant.adresseResidence"] = "L'adresse de residence est requise";
    }
    if (!formData.dirigeant.ville.trim()) {
      newErrors["dirigeant.ville"] = "La ville est requise";
    }
    if (!formData.dateDebutSouhaitee) {
      newErrors["dateDebutSouhaitee"] = "Veuillez sélectionner une date de début souhaitée";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error(Object.values(newErrors)[0]);
    }
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (situation === "en_cours_creation") {
      if (typeStructure === "societe") {
        if (!formData.denominationSociale.trim()) newErrors.denominationSociale = "La denomination sociale est requise";
        if (!formData.formeJuridique) newErrors.formeJuridique = "La forme juridique est requise";
        if (!formData.codeNae.trim()) newErrors.codeNae = "L'activite principale (CODE NAE) est requise";
      } else {
        if (!formData.activiteExercee.trim()) newErrors.activiteExercee = "L'activite exercee est requise";
        if (!formData.descriptionActivite.trim()) newErrors.descriptionActivite = "La description de l'activite est requise";
      }
    } else {
      if (typeStructure === "societe") {
        if (!formData.denominationSociale.trim()) newErrors.denominationSociale = "La denomination sociale est requise";
        if (!formData.formeJuridique) newErrors.formeJuridique = "La forme juridique est requise";
        if (!formData.registreCommerce.trim()) newErrors.registreCommerce = "Le numero de Registre de Commerce est requis";
        if (!formData.nif.trim()) {
          newErrors.nif = "Le NIF est requis";
        } else if (!/^[0-9]{15,20}$/.test(formData.nif.trim())) {
          newErrors.nif = "Le NIF doit contenir entre 15 et 20 chiffres";
        }
        if (!formData.nis.trim()) {
          newErrors.nis = "Le NIS est requis";
        } else if (!/^[0-9]{11,15}$/.test(formData.nis.trim())) {
          newErrors.nis = "Le NIS doit contenir entre 11 et 15 chiffres";
        }
        if (!formData.articleImposition.trim()) newErrors.articleImposition = "L'Article d'Imposition est requis";
        if (!formData.codeNae.trim()) newErrors.codeNae = "L'activite principale (CODE NAE) est requise";
      } else {
        if (!formData.numeroAutoEntrepreneur.trim()) newErrors.numeroAutoEntrepreneur = "Le numero d'auto-entrepreneur est requis";
        if (!formData.activiteExercee.trim()) newErrors.activiteExercee = "L'activite exercee est requise";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) toast.error(Object.values(newErrors)[0]);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep5 = (): boolean => {
    const requiredDocs = getRequiredDocuments(situation as "en_cours_creation" | "deja_creee", typeStructure as "societe" | "auto_entrepreneur").filter(d => d.required);
    const uploadedIds = uploadedDocuments.map(d => d.type);
    const missingDocs = requiredDocs.filter(d => !uploadedIds.includes(d.id));
    if (missingDocs.length > 0) {
      toast.error(`Documents manquants: ${missingDocs.map(d => d.name).join(", ")}`);
      return false;
    }
    return true;
  };

  const validateStep6 = (): boolean => {
    if (!formData.cguAcceptees) {
      toast.error("Vous devez accepter les conditions générales de domiciliation");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    const validators: Record<number, () => boolean> = {
      1: validateStep1,
      2: validateStep2,
      3: validateStep3,
      4: validateStep4,
      5: validateStep5,
      6: validateStep6,
      7: () => true,
    };

    const validate = validators[currentStep];
    if (validate && !validate()) return;
    if (currentStep < TOTAL_STEPS) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleFileUpload = (docType: string) => {
    setCurrentDocumentType(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 5 MB)");
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporte. Utilisez PDF, JPEG ou PNG");
      return;
    }

    const newDoc: UploadedDocument = {
      id: `${currentDocumentType}-${Date.now()}`,
      name: file.name,
      type: currentDocumentType,
      file,
    };

    setUploadedDocuments(prev => {
      const filtered = prev.filter(d => d.type !== currentDocumentType);
      return [...filtered, newDoc];
    });

    toast.success(`Document "${file.name}" ajouté`);
    e.target.value = "";
  };

  const removeDocument = (docId: string) => {
    setUploadedDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const getUploadedDoc = (docType: string) => uploadedDocuments.find(d => d.type === docType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!situation || !typeStructure) return;

    setLoading(true);
    try {
      await onSubmit({
        situation: situation as "en_cours_creation" | "deja_creee",
        typeStructure: typeStructure as "societe" | "auto_entrepreneur",
        formData,
        uploadedDocuments,
      });
      clearDraft();
      resetForm();
      onClose();
    } catch {
      // error toast handled by parent (MonEspace.handleWizardSubmit)
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = situation !== null;
  const canProceedStep2 = typeStructure !== null;
  const canProceedStep3 = formData.dirigeant.adresseResidence.trim() !== "" && formData.dirigeant.ville.trim() !== "" && formData.dateDebutSouhaitee !== null;
  const canProceedStep6 = formData.cguAcceptees;

  const casLabel = getCasLabel(situation as "en_cours_creation" | "deja_creee", typeStructure as "societe" | "auto_entrepreneur");
  const requiredDocs = getRequiredDocuments(situation as "en_cours_creation" | "deja_creee", typeStructure as "societe" | "auto_entrepreneur");

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Demande de Domiciliation">
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
        />

        <StepIndicator currentStep={currentStep} />

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <Step1Situation
              situation={situation}
              onSelect={(s) => { setSituation(s); setTypeStructure(null); }}
            />
          )}

          {currentStep === 2 && (
            <Step2Structure
              situation={situation}
              typeStructure={typeStructure}
              onSelect={setTypeStructure}
              casLabel={casLabel}
            />
          )}

          {currentStep === 3 && (
            <Step3Dirigeant
              formData={formData}
              errors={errors}
              onUpdate={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
              onUpdateDirigeant={(updates) => setFormData(prev => ({ ...prev, dirigeant: { ...prev.dirigeant, ...updates } }))}
              onClearError={(key) => { const ne = { ...errors }; delete ne[key]; setErrors(ne); }}
            />
          )}

          {currentStep === 4 && (
            <Step4Entreprise
              situation={situation!}
              typeStructure={typeStructure!}
              formData={formData}
              errors={errors}
              casLabel={casLabel}
              onUpdate={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
              onClearError={(key) => setErrors(prev => ({ ...prev, [key]: "" }))}
            />
          )}

          {currentStep === 5 && (
            <Step5Documents
              situation={situation!}
              typeStructure={typeStructure!}
              requiredDocs={requiredDocs}
              uploadedDocuments={uploadedDocuments}
              casLabel={casLabel}
              onUpload={handleFileUpload}
              onRemove={removeDocument}
              getUploadedDoc={getUploadedDoc}
            />
          )}

          {currentStep === 6 && (
            <Step6CGU
              cguAcceptees={formData.cguAcceptees}
              onToggle={(checked) => setFormData(prev => ({ ...prev, cguAcceptees: checked }))}
            />
          )}

          {currentStep === 7 && (
            <Step7Options
              options={formData.options}
              onUpdate={(updates) => setFormData(prev => ({ ...prev, options: { ...prev.options, ...updates } }))}
            />
          )}

          {currentStep === 8 && (
            <Step8Summary
              situation={situation!}
              typeStructure={typeStructure!}
              formData={formData}
              uploadedDocuments={uploadedDocuments}
              casLabel={casLabel}
            />
          )}
        </AnimatePresence>

        <div className="flex justify-between gap-3 pt-4 border-t">
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={prevStep} disabled={loading}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Precedent
            </Button>
          )}
          {currentStep < TOTAL_STEPS && (
            <Button
              type="button"
              onClick={nextStep}
              disabled={
                (currentStep === 1 && !canProceedStep1) ||
                (currentStep === 2 && !canProceedStep2) ||
                (currentStep === 3 && !canProceedStep3) ||
                (currentStep === 6 && !canProceedStep6)
              }
              className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          {currentStep === TOTAL_STEPS && (
            <Button
              type="submit"
              disabled={loading}
              className="ml-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
            >
              {loading ? (
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
};

const StepIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
    {WIZARD_STEPS.map((step, index) => (
      <React.Fragment key={step.id}>
        <div className="flex flex-col items-center min-w-[50px]">
          <div
            className={`w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all ${
              currentStep >= step.id
                ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            <step.icon className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span
            className={`text-[9px] md:text-xs mt-1.5 font-medium ${
              currentStep >= step.id ? "text-amber-600" : "text-gray-400"
            }`}
          >
            {step.title}
          </span>
        </div>
        {index < WIZARD_STEPS.length - 1 && (
          <div
            className={`flex-1 h-0.5 mx-1 md:mx-2 rounded-full min-w-[12px] ${
              currentStep > step.id ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gray-200"
            }`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

const stepMotion = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const Step1Situation: React.FC<{
  situation: SituationAdministrative;
  onSelect: (s: "en_cours_creation" | "deja_creee") => void;
}> = ({ situation, onSelect }) => (
  <motion.div key="step1" {...stepMotion} className="space-y-6">
    <div className="text-center mb-4">
      <Badge className="bg-amber-100 text-amber-700 mb-3">Etape 1 - Point d'entree unique</Badge>
      <h3 className="font-bold text-xl text-gray-900">Situation administrative</h3>
      <p className="text-gray-500 text-sm mt-1">Ce choix conditionne l'integralite du parcours</p>
    </div>
    <p className="text-gray-600 text-center font-medium">La structure est-elle :</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SelectionCard
        selected={situation === "en_cours_creation"}
        onClick={() => onSelect("en_cours_creation")}
        icon={<UserPlus className="w-6 h-6 text-emerald-600" />}
        iconBg="bg-emerald-100"
        title="En cours de creation"
        description="Future creation, a partir de zero"
      />
      <SelectionCard
        selected={situation === "deja_creee"}
        onClick={() => onSelect("deja_creee")}
        icon={<Building className="w-6 h-6 text-sky-600" />}
        iconBg="bg-sky-100"
        title="Deja creee"
        description="Entreprise immatriculee, transfert de siege"
      />
    </div>
  </motion.div>
);

const Step2Structure: React.FC<{
  situation: SituationAdministrative;
  typeStructure: TypeStructureChoice;
  onSelect: (t: "societe" | "auto_entrepreneur") => void;
  casLabel: string;
}> = ({ situation, typeStructure, onSelect, casLabel }) => (
  <motion.div key="step2" {...stepMotion} className="space-y-6">
    <div className="text-center mb-4">
      <Badge className="bg-amber-100 text-amber-700 mb-3">Etape 2 - Type de structure</Badge>
      <h3 className="font-bold text-xl text-gray-900">Quel type de structure ?</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SelectionCard
        selected={typeStructure === "societe"}
        onClick={() => onSelect("societe")}
        icon={<Building className="w-6 h-6 text-sky-600" />}
        iconBg="bg-sky-100"
        title="Societe"
        description="SARL, EURL, SPA, SNC ou Startup"
      />
      <SelectionCard
        selected={typeStructure === "auto_entrepreneur"}
        onClick={() => onSelect("auto_entrepreneur")}
        icon={<User className="w-6 h-6 text-emerald-600" />}
        iconBg="bg-emerald-100"
        title="Auto-entrepreneur"
        description="Statut simplifie pour activite individuelle"
      />
    </div>
    {situation && typeStructure && (
      <CasInfoBox situation={situation} typeStructure={typeStructure} casLabel={casLabel} />
    )}
  </motion.div>
);

const Step3Dirigeant: React.FC<{
  formData: DomiciliationFormData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<DomiciliationFormData>) => void;
  onUpdateDirigeant: (updates: Partial<DomiciliationFormData["dirigeant"]>) => void;
  onClearError: (key: string) => void;
}> = ({ formData, errors, onUpdate, onUpdateDirigeant, onClearError }) => (
  <motion.div key="step3" {...stepMotion} className="space-y-4">
    <div className="text-center mb-4">
      <Badge className="bg-amber-100 text-amber-700 mb-3">Etape 3 - Informations personnelles</Badge>
      <h3 className="font-bold text-xl text-gray-900">Dirigeant / Auto-entrepreneur</h3>
      <p className="text-gray-500 text-sm mt-1">Informations preremplies depuis votre inscription</p>
    </div>

    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Informations verrouillees</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nom</label>
          <p className="font-medium text-gray-900">{formData.dirigeant.nom || "-"}</p>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Prenom</label>
          <p className="font-medium text-gray-900">{formData.dirigeant.prenom || "-"}</p>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <p className="font-medium text-gray-900">{formData.dirigeant.email || "-"}</p>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Telephone</label>
          <p className="font-medium text-gray-900">{formData.dirigeant.telephone || "-"}</p>
        </div>
      </div>
    </div>

    <div className="space-y-4">
      <Input
        label="Adresse de residence"
        icon={<MapPin className="w-5 h-5" />}
        value={formData.dirigeant.adresseResidence}
        onChange={(e) => {
          onUpdateDirigeant({ adresseResidence: e.target.value });
          if (errors["dirigeant.adresseResidence"]) onClearError("dirigeant.adresseResidence");
        }}
        placeholder="Ex: 12 Rue des Oliviers, Hydra"
        className={errors["dirigeant.adresseResidence"] ? "border-red-500" : ""}
      />
      {errors["dirigeant.adresseResidence"] && (
        <p className="text-red-500 text-sm -mt-2">{errors["dirigeant.adresseResidence"]}</p>
      )}

      <Input
        label="Ville"
        icon={<MapPin className="w-5 h-5" />}
        value={formData.dirigeant.ville}
        onChange={(e) => {
          onUpdateDirigeant({ ville: e.target.value });
          if (errors["dirigeant.ville"]) onClearError("dirigeant.ville");
        }}
        placeholder="Ex: Alger"
        className={errors["dirigeant.ville"] ? "border-red-500" : ""}
      />
      {errors["dirigeant.ville"] && (
        <p className="text-red-500 text-sm -mt-2">{errors["dirigeant.ville"]}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date souhaitee de debut de domiciliation (indicative) <span className="text-red-500">*</span>
        </label>
        <DatePicker
          selected={formData.dateDebutSouhaitee as Date | null}
          onChange={(date: Date | null) => onUpdate({ dateDebutSouhaitee: date })}
          minDate={new Date()}
          locale="fr"
          dateFormat="dd MMMM yyyy"
          placeholderText="Selectionnez une date"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>
    </div>
  </motion.div>
);

const Step4Entreprise: React.FC<{
  situation: "en_cours_creation" | "deja_creee";
  typeStructure: "societe" | "auto_entrepreneur";
  formData: DomiciliationFormData;
  errors: Record<string, string>;
  casLabel: string;
  onUpdate: (updates: Partial<DomiciliationFormData>) => void;
  onClearError: (key: string) => void;
}> = ({ situation, typeStructure, formData, errors, casLabel, onUpdate, onClearError }) => (
  <motion.div key="step4" {...stepMotion} className="space-y-4">
    <div className="text-center mb-4">
      <Badge className="bg-amber-100 text-amber-700 mb-3">{casLabel} - Informations demandees</Badge>
      <h3 className="font-bold text-xl text-gray-900">
        {situation === "en_cours_creation" ? "Future structure" : "Structure existante"}
      </h3>
    </div>

    {situation === "en_cours_creation" && typeStructure === "societe" && (
      <CasA1Fields formData={formData} errors={errors} onUpdate={onUpdate} onClearError={onClearError} />
    )}
    {situation === "en_cours_creation" && typeStructure === "auto_entrepreneur" && (
      <CasA2Fields formData={formData} errors={errors} onUpdate={onUpdate} onClearError={onClearError} />
    )}
    {situation === "deja_creee" && typeStructure === "societe" && (
      <CasB1Fields formData={formData} errors={errors} onUpdate={onUpdate} onClearError={onClearError} />
    )}
    {situation === "deja_creee" && typeStructure === "auto_entrepreneur" && (
      <CasB2Fields formData={formData} errors={errors} onUpdate={onUpdate} onClearError={onClearError} />
    )}
  </motion.div>
);

const CasA1Fields: React.FC<{
  formData: DomiciliationFormData;
  errors: Record<string, string>;
  onUpdate: (u: Partial<DomiciliationFormData>) => void;
  onClearError: (k: string) => void;
}> = ({ formData, errors, onUpdate, onClearError }) => (
  <>
    <Input
      label="Denomination sociale (Document CNRC)"
      icon={<Building className="w-5 h-5" />}
      value={formData.denominationSociale}
      onChange={(e) => { onUpdate({ denominationSociale: e.target.value }); if (errors.denominationSociale) onClearError("denominationSociale"); }}
      placeholder="Ex: Innovation Tech"
      className={errors.denominationSociale ? "border-red-500" : ""}
    />
    {errors.denominationSociale && <p className="text-red-500 text-sm -mt-2">{errors.denominationSociale}</p>}

    <LegalFormSelect
      value={formData.formeJuridique}
      onChange={(v) => { onUpdate({ formeJuridique: v as LegalFormType }); if (errors.formeJuridique) onClearError("formeJuridique"); }}
      error={errors.formeJuridique}
      label="Forme juridique envisagee"
      variant="full"
    />

    <Input
      label="Activite principale (CODE NAE)"
      icon={<Briefcase className="w-5 h-5" />}
      value={formData.codeNae}
      onChange={(e) => { onUpdate({ codeNae: e.target.value }); if (errors.codeNae) onClearError("codeNae"); }}
      placeholder="Ex: 62.01 - Programmation informatique"
      className={errors.codeNae ? "border-red-500" : ""}
    />
    {errors.codeNae && <p className="text-red-500 text-sm -mt-2">{errors.codeNae}</p>}

    <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
      <p className="text-sm text-sky-700">
        <strong>Finalite:</strong> Preparer le contrat de domiciliation chez le notaire pour constater la domiciliation et rediger les statuts.
      </p>
    </div>
  </>
);

const CasA2Fields: React.FC<{
  formData: DomiciliationFormData;
  errors: Record<string, string>;
  onUpdate: (u: Partial<DomiciliationFormData>) => void;
  onClearError: (k: string) => void;
}> = ({ formData, errors, onUpdate, onClearError }) => (
  <>
    <Input
      label="Activite exercee ou envisagee"
      icon={<Briefcase className="w-5 h-5" />}
      value={formData.activiteExercee}
      onChange={(e) => { onUpdate({ activiteExercee: e.target.value }); if (errors.activiteExercee) onClearError("activiteExercee"); }}
      placeholder="Ex: Consultant en informatique"
      className={errors.activiteExercee ? "border-red-500" : ""}
    />
    {errors.activiteExercee && <p className="text-red-500 text-sm -mt-2">{errors.activiteExercee}</p>}

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Description courte de l'activite <span className="text-red-500">*</span>
      </label>
      <textarea
        value={formData.descriptionActivite}
        onChange={(e) => { onUpdate({ descriptionActivite: e.target.value }); if (errors.descriptionActivite) onClearError("descriptionActivite"); }}
        placeholder="Decrivez brievement votre activite..."
        rows={3}
        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
          errors.descriptionActivite ? "border-red-500" : "border-gray-200"
        }`}
      />
      {errors.descriptionActivite && <p className="text-red-500 text-sm mt-1">{errors.descriptionActivite}</p>}
    </div>

    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
      <p className="text-sm text-emerald-700">
        <strong>Note:</strong> Aucune denomination sociale n'est requise pour l'auto-entrepreneur.
      </p>
    </div>
  </>
);

const CasB1Fields: React.FC<{
  formData: DomiciliationFormData;
  errors: Record<string, string>;
  onUpdate: (u: Partial<DomiciliationFormData>) => void;
  onClearError: (k: string) => void;
}> = ({ formData, errors, onUpdate, onClearError }) => (
  <>
    <Input
      label="Dénomination sociale"
      icon={<Building className="w-5 h-5" />}
      value={formData.denominationSociale}
      onChange={(e) => { onUpdate({ denominationSociale: e.target.value }); if (errors.denominationSociale) onClearError("denominationSociale"); }}
      placeholder="Ex: SARL Innovation Tech"
      className={errors.denominationSociale ? "border-red-500" : ""}
    />
    {errors.denominationSociale && <p className="text-red-500 text-sm -mt-2">{errors.denominationSociale}</p>}

    <LegalFormSelect
      value={formData.formeJuridique}
      onChange={(v) => { onUpdate({ formeJuridique: v as LegalFormType }); if (errors.formeJuridique) onClearError("formeJuridique"); }}
      error={errors.formeJuridique}
      label="Forme Juridique"
      variant="short"
    />

    <Input
      label="Numéro de Registre de Commerce (RC)"
      icon={<Hash className="w-5 h-5" />}
      value={formData.registreCommerce}
      onChange={(e) => { onUpdate({ registreCommerce: e.target.value }); if (errors.registreCommerce) onClearError("registreCommerce"); }}
      placeholder="Ex: 16/00-0123456B00"
      className={errors.registreCommerce ? "border-red-500" : ""}
    />
    {errors.registreCommerce && <p className="text-red-500 text-sm -mt-2">{errors.registreCommerce}</p>}

    <div className="grid grid-cols-2 gap-4">
      <div>
        <Input
          label="NIF (20 caractères)"
          icon={<Hash className="w-5 h-5" />}
          value={formData.nif}
          onChange={(e) => { onUpdate({ nif: e.target.value }); if (errors.nif) onClearError("nif"); }}
          placeholder="09901234567890123456"
          maxLength={20}
          className={errors.nif ? "border-red-500" : ""}
        />
        {errors.nif && <p className="text-red-500 text-sm mt-1">{errors.nif}</p>}
      </div>
      <div>
        <Input
          label="NIS (15 caractères)"
          icon={<Hash className="w-5 h-5" />}
          value={formData.nis}
          onChange={(e) => { onUpdate({ nis: e.target.value }); if (errors.nis) onClearError("nis"); }}
          placeholder="123456789012345"
          maxLength={15}
          className={errors.nis ? "border-red-500" : ""}
        />
        {errors.nis && <p className="text-red-500 text-sm mt-1">{errors.nis}</p>}
      </div>
    </div>

    <Input
      label="Article d'Imposition (AI)"
      icon={<Hash className="w-5 h-5" />}
      value={formData.articleImposition}
      onChange={(e) => { onUpdate({ articleImposition: e.target.value }); if (errors.articleImposition) onClearError("articleImposition"); }}
      placeholder="Ex: 12345678"
      className={errors.articleImposition ? "border-red-500" : ""}
    />
    {errors.articleImposition && <p className="text-red-500 text-sm -mt-2">{errors.articleImposition}</p>}

    <Input
      label="Activité principale (CODE NAE)"
      icon={<Briefcase className="w-5 h-5" />}
      value={formData.codeNae}
      onChange={(e) => { onUpdate({ codeNae: e.target.value }); if (errors.codeNae) onClearError("codeNae"); }}
      placeholder="Ex: 62.01 - Programmation informatique"
      className={errors.codeNae ? "border-red-500" : ""}
    />
    {errors.codeNae && <p className="text-red-500 text-sm -mt-2">{errors.codeNae}</p>}

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date de création</label>
        <DatePicker
          selected={formData.dateCreationEntreprise as Date | null}
          onChange={(date: Date | null) => onUpdate({ dateCreationEntreprise: date })}
          maxDate={new Date()}
          locale="fr"
          dateFormat="dd MMMM yyyy"
          placeholderText="Selectionnez"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>
      <Input
        label="Ville d'immatriculation"
        icon={<MapPin className="w-5 h-5" />}
        value={formData.villeImmatriculation}
        onChange={(e) => onUpdate({ villeImmatriculation: e.target.value })}
        placeholder="Ex: Alger"
      />
    </div>
  </>
);

const CasB2Fields: React.FC<{
  formData: DomiciliationFormData;
  errors: Record<string, string>;
  onUpdate: (u: Partial<DomiciliationFormData>) => void;
  onClearError: (k: string) => void;
}> = ({ formData, errors, onUpdate, onClearError }) => (
  <>
    <Input
      label="Numéro d'auto-entrepreneur"
      icon={<Hash className="w-5 h-5" />}
      value={formData.numeroAutoEntrepreneur}
      onChange={(e) => { onUpdate({ numeroAutoEntrepreneur: e.target.value }); if (errors.numeroAutoEntrepreneur) onClearError("numeroAutoEntrepreneur"); }}
      placeholder="Ex: AE-2024-123456"
      className={errors.numeroAutoEntrepreneur ? "border-red-500" : ""}
    />
    {errors.numeroAutoEntrepreneur && <p className="text-red-500 text-sm -mt-2">{errors.numeroAutoEntrepreneur}</p>}

    <Input
      label="Activité exercée"
      icon={<Briefcase className="w-5 h-5" />}
      value={formData.activiteExercee}
      onChange={(e) => { onUpdate({ activiteExercee: e.target.value }); if (errors.activiteExercee) onClearError("activiteExercee"); }}
      placeholder="Ex: Consultant en informatique"
      className={errors.activiteExercee ? "border-red-500" : ""}
    />
    {errors.activiteExercee && <p className="text-red-500 text-sm -mt-2">{errors.activiteExercee}</p>}

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Date d'inscription</label>
      <DatePicker
        selected={formData.dateInscriptionAutoEntrepreneur as Date | null}
        onChange={(date: Date | null) => onUpdate({ dateInscriptionAutoEntrepreneur: date })}
        maxDate={new Date()}
        locale="fr"
        dateFormat="dd MMMM yyyy"
        placeholderText="Selectionnez"
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      />
    </div>
  </>
);

const Step5Documents: React.FC<{
  situation: "en_cours_creation" | "deja_creee";
  typeStructure: "societe" | "auto_entrepreneur";
  requiredDocs: import("./types").RequiredDocument[];
  uploadedDocuments: UploadedDocument[];
  casLabel: string;
  onUpload: (docType: string) => void;
  onRemove: (docId: string) => void;
  getUploadedDoc: (docType: string) => UploadedDocument | undefined;
}> = ({ situation, typeStructure, requiredDocs, uploadedDocuments: _, casLabel, onUpload, onRemove, getUploadedDoc }) => (
  <motion.div key="step5" {...stepMotion} className="space-y-4">
    <div className="text-center mb-4">
      <Badge className="bg-amber-100 text-amber-700 mb-3">Documents obligatoires</Badge>
      <h3 className="font-bold text-xl text-gray-900">Pièces justificatives</h3>
    </div>

    <div className={`p-4 rounded-xl border ${
      typeStructure === "societe" ? "bg-sky-50 border-sky-200" : "bg-emerald-50 border-emerald-200"
    }`}>
      <p className={`text-sm ${typeStructure === "societe" ? "text-sky-700" : "text-emerald-700"}`}>
        <strong>{casLabel}:</strong>{" "}
        {situation === "en_cours_creation"
          ? typeStructure === "societe"
            ? "CNI du futur gérant, Extrait de naissance, Document CNRC"
            : "Seule la CNI est nécessaire"
          : typeStructure === "societe"
            ? "Registre de commerce, Statuts, CNI et extrait de naissance du gérant"
            : "Carte d'auto-entrepreneur et CNI"
        }
      </p>
    </div>

    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
      {requiredDocs.map((doc) => {
        const uploaded = getUploadedDoc(doc.id);
        return (
          <div
            key={doc.id}
            className={`p-4 rounded-xl border-2 transition-all ${
              uploaded
                ? "border-emerald-300 bg-emerald-50"
                : doc.required
                  ? "border-amber-200 bg-amber-50"
                  : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{doc.name}</span>
                  {doc.required ? (
                    <Badge variant="warning" className="text-xs">Requis</Badge>
                  ) : (
                    <Badge variant="default" className="text-xs">Optionnel</Badge>
                  )}
                </div>
                {doc.description && <p className="text-xs text-gray-500 mt-1">{doc.description}</p>}
                {uploaded && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {uploaded.name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {uploaded ? (
                  <button
                    type="button"
                    onClick={() => onRemove(uploaded.id)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onUpload(doc.id)}
                    className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>

    <p className="text-xs text-gray-500">Formats acceptés : PDF, JPEG, PNG (max 5 MB par fichier)</p>
  </motion.div>
);

const Step6CGU: React.FC<{
  cguAcceptees: boolean;
  onToggle: (checked: boolean) => void;
}> = ({ cguAcceptees, onToggle }) => (
  <motion.div key="step6" {...stepMotion} className="space-y-4">
    <div className="text-center mb-4">
      <Badge className="bg-amber-100 text-amber-700 mb-3">Étape clé - Conditions générales</Badge>
      <h3 className="font-bold text-xl text-gray-900">Acceptation des CGU</h3>
      <p className="text-gray-500 text-sm mt-1">Obligatoire avant toute signature</p>
    </div>

    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-[200px] overflow-y-auto">
      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">{CGU_TEXT}</pre>
    </div>

    <label className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
      <input
        type="checkbox"
        checked={cguAcceptees}
        onChange={(e) => onToggle(e.target.checked)}
        className="w-5 h-5 mt-0.5 text-amber-600 border-2 border-amber-300 rounded focus:ring-amber-500"
      />
      <div>
        <p className="font-medium text-gray-900">J'accepte les conditions générales de domiciliation</p>
        <p className="text-sm text-gray-600 mt-1">
          En cochant cette case, vous confirmez avoir lu et accepté les CGU.
        </p>
      </div>
    </label>

    <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-sky-600 mt-0.5" />
        <div className="text-sm text-sky-700">
          <p className="font-medium mb-1">Prochaine étape</p>
          <p>Après validation de votre dossier, vous serez invité à signer le contrat de domiciliation chez le notaire.</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const Step7Options: React.FC<{
  options: import("../../types").DomiciliationOptions;
  onUpdate: (updates: Partial<import("../../types").DomiciliationOptions>) => void;
}> = ({ options, onUpdate }) => {
  const total = calculateTotalMonthly(options as unknown as Record<string, boolean>);
  return (
    <motion.div key="step7" {...stepMotion} className="space-y-4">
      <div className="text-center mb-4">
        <Badge className="bg-amber-100 text-amber-700 mb-3">Options de domiciliation</Badge>
        <h3 className="font-bold text-xl text-gray-900">Services complementaires</h3>
        <p className="text-gray-500 text-sm mt-1">Selectionnez les options souhaitees</p>
      </div>

      <div className="space-y-3">
        <OptionRow
          icon={<MapPin className="w-5 h-5 text-emerald-600" />}
          label="Domiciliation simple"
          description="Adresse legale au Mohammadia Mall"
          checked={options.domiciliationSimple}
          disabled
          badge={<Badge variant="success" className="text-xs">Inclus</Badge>}
          activeBg="bg-emerald-50 border-emerald-200"
          price={OPTIONS_PRICING.domiciliationSimple.price}
          included
        />
        <OptionRow
          icon={<Mail className="w-5 h-5 text-gray-600" />}
          label="Reception du courrier"
          description="Nous recevons votre courrier a votre place"
          checked={options.receptionCourrier}
          onChange={(c) => onUpdate({ receptionCourrier: c })}
          price={OPTIONS_PRICING.receptionCourrier.price}
        />
        <OptionRow
          icon={<ScanLine className="w-5 h-5 text-gray-600" />}
          label="Scan et notification par e-mail"
          description="Recevez une copie scannee de votre courrier par email"
          checked={options.scanNotificationEmail}
          onChange={(c) => onUpdate({ scanNotificationEmail: c })}
          price={OPTIONS_PRICING.scanNotificationEmail.price}
        />
        <OptionRow
          icon={<Forward className="w-5 h-5 text-gray-600" />}
          label="Reexpedition du courrier"
          description="Nous reexpedions votre courrier a l'adresse de votre choix"
          checked={options.reexpeditionCourrier}
          onChange={(c) => onUpdate({ reexpeditionCourrier: c })}
          price={OPTIONS_PRICING.reexpeditionCourrier.price}
        />
        <OptionRow
          icon={<DoorOpen className="w-5 h-5 text-gray-600" />}
          label="Acces ponctuel aux espaces"
          description="Acces aux salles de reunion et espaces de coworking"
          checked={options.accesPonctuelEspaces}
          onChange={(c) => onUpdate({ accesPonctuelEspaces: c })}
          price={OPTIONS_PRICING.accesPonctuelEspaces.price}
        />
      </div>

      <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-700">Estimation mensuelle</p>
            <p className="text-xs text-amber-600 mt-0.5">Base {BASE_MONTHLY_PRICE.toLocaleString()} DA + options selectionnees</p>
          </div>
          <p className="text-2xl font-bold text-amber-800">{total.toLocaleString()} <span className="text-sm font-normal">DA/mois</span></p>
        </div>
      </div>
    </motion.div>
  );
};

const Step8Summary: React.FC<{
  situation: "en_cours_creation" | "deja_creee";
  typeStructure: "societe" | "auto_entrepreneur";
  formData: DomiciliationFormData;
  uploadedDocuments: UploadedDocument[];
  casLabel: string;
}> = ({ situation, typeStructure, formData, uploadedDocuments, casLabel }) => (
  <motion.div key="step8" {...stepMotion} className="space-y-4">
    <div className="text-center mb-4">
      <Badge className="bg-emerald-100 text-emerald-700 mb-3">Récapitulatif final</Badge>
      <h3 className="font-bold text-xl text-gray-900">Validation du dossier</h3>
    </div>

    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-200">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h4 className="font-bold text-emerald-900 mb-1">Prêt à soumettre</h4>
          <p className="text-sm text-emerald-700">
            Vérifiez les informations ci-dessous. Notre équipe traitera votre demande sous 48h ouvrées.
          </p>
        </div>
      </div>
    </div>

    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
      <SummarySection title="Situation administrative" icon={<HelpCircle className="w-4 h-4 text-amber-500" />} bg="bg-amber-50">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <SummaryItem label="Situation" value={situation === "en_cours_creation" ? "En cours de création" : "Déjà créée"} />
          <SummaryItem label="Type" value={typeStructure === "societe" ? "Société" : "Auto-entrepreneur"} />
          <SummaryItem label="État du dossier" value="Dossier préparatoire" />
          <SummaryItem label="Bureau" value="Attribué après signature notariale" italic />
          <SummaryItem label="Cas" value={casLabel} />
          <SummaryItem label="Début souhaité" value={formData.dateDebutSouhaitee ? format(formData.dateDebutSouhaitee, "dd/MM/yyyy") : "-"} />
        </div>
      </SummarySection>

      <SummarySection title={situation === "en_cours_creation" ? "Future structure" : "Entreprise"} icon={<Building className="w-4 h-4 text-amber-500" />} bg="bg-gray-50">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {typeStructure === "societe" ? (
            <>
              <SummaryItem label="Dénomination" value={formData.denominationSociale || "-"} />
              <SummaryItem label="Forme juridique" value={formData.formeJuridique || "-"} />
              {formData.codeNae && <SummaryItem label="Code NAE" value={formData.codeNae} colSpan2 />}
              {situation === "deja_creee" && (
                <>
                  {formData.registreCommerce && <SummaryItem label="RC" value={formData.registreCommerce} />}
                  {formData.nif && <SummaryItem label="NIF" value={formData.nif} />}
                  {formData.nis && <SummaryItem label="NIS" value={formData.nis} />}
                  {formData.articleImposition && <SummaryItem label="AI" value={formData.articleImposition} />}
                </>
              )}
            </>
          ) : (
            <>
              <SummaryItem label="Nom" value={`${formData.dirigeant.prenom} ${formData.dirigeant.nom}`} />
              <SummaryItem label="Forme" value="Auto-entrepreneur" />
              <SummaryItem label="Activité" value={formData.activiteExercee || "-"} colSpan2 />
              {situation === "deja_creee" && formData.numeroAutoEntrepreneur && (
                <SummaryItem label="N. auto-entrepreneur" value={formData.numeroAutoEntrepreneur} colSpan2 />
              )}
            </>
          )}
        </div>
      </SummarySection>

      <SummarySection title="Dirigeant" icon={<User className="w-4 h-4 text-sky-500" />} bg="bg-sky-50">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <SummaryItem label="Nom complet" value={`${formData.dirigeant.prenom} ${formData.dirigeant.nom}`} />
          <SummaryItem label="Ville" value={formData.dirigeant.ville || "-"} />
        </div>
      </SummarySection>

      <SummarySection title={`Documents (${uploadedDocuments.length})`} icon={<FileText className="w-4 h-4 text-emerald-500" />} bg="bg-emerald-50">
        <div className="space-y-1">
          {uploadedDocuments.map(doc => (
            <p key={doc.id} className="text-sm text-gray-700 flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              {doc.name}
            </p>
          ))}
        </div>
      </SummarySection>

      <SummarySection title="Options sélectionnées" icon={<Package className="w-4 h-4 text-teal-500" />} bg="bg-teal-50">
        <div className="space-y-1 text-sm">
          {formData.options.domiciliationSimple && <SummaryCheck label="Domiciliation simple" />}
          {formData.options.receptionCourrier && <SummaryCheck label="Réception du courrier" />}
          {formData.options.scanNotificationEmail && <SummaryCheck label="Scan et notification email" />}
          {formData.options.reexpeditionCourrier && <SummaryCheck label="Réexpédition du courrier" />}
          {formData.options.accesPonctuelEspaces && <SummaryCheck label="Accès ponctuel aux espaces" />}
        </div>
      </SummarySection>

      <SummarySection title="Conditions générales" icon={<Scale className="w-4 h-4 text-gray-500" />} bg="bg-gray-50">
        <div className="text-sm">
          <span className="text-gray-500">CGU acceptées :</span>
          <p className="font-medium text-emerald-600">Oui</p>
        </div>
      </SummarySection>
    </div>

    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 mt-0.5" />
        <div className="text-sm text-amber-700">
          <p className="font-medium mb-1">Prochaines étapes :</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Validation de votre dossier sous 48h</li>
            <li>Rendez-vous chez le notaire pour la signature</li>
            <li>Attribution du numéro de bureau (1-36)</li>
            <li>Remise de l'attestation de domiciliation</li>
          </ul>
        </div>
      </div>
    </div>
  </motion.div>
);

const SelectionCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}> = ({ selected, onClick, icon, iconBg, title, description }) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-6 rounded-2xl border-2 text-left transition-all ${
      selected
        ? "border-amber-500 bg-amber-50"
        : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
    }`}
  >
    <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
      {icon}
    </div>
    <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
    <p className="text-sm text-gray-600">{description}</p>
    {selected && (
      <div className="mt-4 flex items-center gap-2 text-amber-600">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-medium">Sélectionné</span>
      </div>
    )}
  </button>
);

const CasInfoBox: React.FC<{
  situation: SituationAdministrative;
  typeStructure: TypeStructureChoice;
  casLabel: string;
}> = ({ situation, typeStructure, casLabel }) => {
  const isSociete = typeStructure === "societe";
  const colorClass = isSociete ? "bg-sky-50 border-sky-200 text-sky-700 text-sky-600" : "bg-emerald-50 border-emerald-200 text-emerald-700 text-emerald-600";
  const [bgClass, borderClass, textClass, iconClass] = colorClass.split(" ");

  const title = situation === "en_cours_creation"
    ? isSociete ? "Société en cours de création" : "Auto-entrepreneur en cours de création"
    : isSociete ? "Société déjà créée" : "Auto-entrepreneur déjà créé";

  const detail = situation === "en_cours_creation"
    ? isSociete
      ? "Vous devrez obtenir une réservation de dénomination auprès du CNRC."
      : "Aucune dénomination sociale n'est requise."
    : isSociete
      ? "Vous devrez fournir les documents administratifs de votre société."
      : "Vous devrez fournir votre carte d'auto-entrepreneur.";

  return (
    <div className={`p-4 rounded-xl border ${bgClass} ${borderClass}`}>
      <div className="flex items-start gap-3">
        <Info className={`w-5 h-5 mt-0.5 ${iconClass}`} />
        <div className={`text-sm ${textClass}`}>
          <p className="font-medium mb-1">{casLabel} - {title}</p>
          <p>{detail}</p>
        </div>
      </div>
    </div>
  );
};

const LegalFormSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  error?: string;
  label: string;
  variant: "full" | "short";
}> = ({ value, onChange, error, label, variant }) => {
  const options = variant === "full" ? LEGAL_FORM_OPTIONS : LEGAL_FORM_OPTIONS_SHORT;
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
          error ? "border-red-500" : "border-gray-200"
        }`}
      >
        <option value="">Sélectionnez</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

const OptionRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  badge?: React.ReactNode;
  activeBg?: string;
  price?: number;
  included?: boolean;
}> = ({ icon, label, description, checked, disabled, onChange, badge, activeBg, price, included }) => (
  <label className={`flex items-start gap-4 p-4 border-2 rounded-xl ${
    checked && !activeBg ? "border-amber-300 bg-amber-50/50" : activeBg ? activeBg : "border-gray-200 cursor-pointer hover:border-amber-300 hover:bg-amber-50/50"
  } transition-colors`}>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
      className={`w-5 h-5 mt-0.5 border-2 rounded focus:ring-amber-500 ${
        activeBg ? "text-emerald-600 border-emerald-300" : "text-amber-600 border-gray-300"
      }`}
    />
    <div className="flex-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-gray-900">{label}</span>
        {badge}
      </div>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
    {price !== undefined && (
      <div className="text-right flex-shrink-0">
        {included ? (
          <span className="text-sm font-semibold text-emerald-600">Inclus</span>
        ) : (
          <span className="text-sm font-bold text-gray-900">+{price.toLocaleString()} <span className="text-xs font-normal text-gray-500">DA/mois</span></span>
        )}
      </div>
    )}
  </label>
);

const SummarySection: React.FC<{
  title: string;
  icon: React.ReactNode;
  bg: string;
  children: React.ReactNode;
}> = ({ title, icon, bg, children }) => (
  <div className={`${bg} rounded-xl p-4`}>
    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
      {icon}
      {title}
    </h4>
    {children}
  </div>
);

const SummaryItem: React.FC<{
  label: string;
  value: string;
  italic?: boolean;
  colSpan2?: boolean;
}> = ({ label, value, italic, colSpan2 }) => (
  <div className={colSpan2 ? "col-span-2" : ""}>
    <span className="text-gray-500">{label}:</span>
    <p className={`font-medium ${italic ? "text-gray-500 italic" : "text-gray-900"}`}>{value}</p>
  </div>
);

const SummaryCheck: React.FC<{ label: string }> = ({ label }) => (
  <p className="flex items-center gap-2 text-gray-700">
    <CheckCircle className="w-3 h-3 text-teal-500" /> {label}
  </p>
);

export default WizardForm;
