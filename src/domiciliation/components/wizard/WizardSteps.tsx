import React from 'react';
import {
  Building,
  User,
  HelpCircle,
  Check,
  Info,
  Upload,
  X,
  FileText,
  Shield,
  MapPin,
  Mail,
  Phone,
  Hash,
  Briefcase,
  Package,
  ScanLine,
  Forward,
  DoorOpen,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import Input from '../../../components/ui/Input';
import type {
  SituationAdministrative,
  TypeStructure,
  RepresentantLegal,
  DomiciliationOptions,
  UploadedDocument,
  RequiredDocument,
  DonneesA1,
  DonneesA2,
  DonneesB1,
  DonneesB2,
  CasMetier,
  WizardFormData,
} from '../../domain/types';
import { getCasLabel, getCasShortLabel } from '../../domain/types';
import { LEGAL_FORMS } from '../../domain/constants';
import { CGU_TEXT } from '../../domain/constants';
import { OPTIONS_CONFIG, calculateMonthlyTotal, formatPrice, formatPriceWithUnit, BASE_MONTHLY_PRICE } from '../../domain/pricing';

interface FieldErrorProps {
  error?: string;
}

const FieldError: React.FC<FieldErrorProps> = ({ error }) => {
  if (!error) return null;
  return <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>;
};

interface SelectionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

const SelectionCard: React.FC<SelectionCardProps> = ({ selected, onClick, icon, title, description, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
      selected
        ? 'border-amber-500 bg-amber-50 shadow-md'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
    }`}
  >
    <div className="flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-semibold ${selected ? 'text-amber-800' : 'text-gray-800'}`}>{title}</h3>
          {badge && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selected ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>{badge}</span>}
        </div>
        <p className={`text-sm leading-relaxed ${selected ? 'text-amber-700' : 'text-gray-500'}`}>{description}</p>
      </div>
      {selected && (
        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  </button>
);

interface CasInfoBoxProps {
  cas: CasMetier;
}

const CasInfoBox: React.FC<CasInfoBoxProps> = ({ cas }) => (
  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
    <div className="flex items-start gap-3">
      <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800">{getCasLabel(cas)}</p>
        <p className="text-xs text-amber-700 mt-1">
          {getCasShortLabel(cas)} — Documents et champs adaptés à votre situation
        </p>
      </div>
    </div>
  </div>
);

interface LegalFormSelectProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

const LegalFormSelect: React.FC<LegalFormSelectProps> = ({ value, onChange, error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Forme juridique <span className="text-red-500">*</span></label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
    >
      <option value="">Sélectionner la forme juridique</option>
      {LEGAL_FORMS.map((f) => (
        <option key={f.value} value={f.value}>{f.label}</option>
      ))}
    </select>
    <FieldError error={error} />
  </div>
);

interface LockedFieldProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const LockedField: React.FC<LockedFieldProps> = ({ label, value, icon }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
      {icon && <span className="text-gray-400">{icon}</span>}
      <span className="text-sm text-gray-700">{value || '—'}</span>
      <Shield className="w-3 h-3 text-gray-400 ml-auto" />
    </div>
  </div>
);

interface FieldsA1Props {
  data: DonneesA1;
  onChange: (patch: Record<string, unknown>) => void;
  errors: Record<string, string>;
}

const FieldsA1: React.FC<FieldsA1Props> = ({ data, onChange, errors }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Dénomination sociale souhaitée <span className="text-red-500">*</span></label>
      <Input value={data.denominationSociale} onChange={(e) => onChange({ denominationSociale: e.target.value })} placeholder="Ex: Ma Société SARL" className={errors.denominationSociale ? 'border-red-300' : ''} />
      <FieldError error={errors.denominationSociale} />
    </div>
    <LegalFormSelect value={data.formeJuridique} onChange={(v) => onChange({ formeJuridique: v })} error={errors.formeJuridique} />
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Code NAE (activité)</label>
      <Input value={data.codeNae} onChange={(e) => onChange({ codeNae: e.target.value })} placeholder="Ex: 6201Z" />
    </div>
  </div>
);

interface FieldsA2Props {
  data: DonneesA2;
  onChange: (patch: Record<string, unknown>) => void;
  errors: Record<string, string>;
}

const FieldsA2: React.FC<FieldsA2Props> = ({ data, onChange, errors }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Activité exercée <span className="text-red-500">*</span></label>
      <Input value={data.activiteExercee} onChange={(e) => onChange({ activiteExercee: e.target.value })} placeholder="Ex: Développement web, Consultant marketing..." className={errors.activiteExercee ? 'border-red-300' : ''} />
      <FieldError error={errors.activiteExercee} />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Description de l'activité</label>
      <textarea
        value={data.descriptionActivite}
        onChange={(e) => onChange({ descriptionActivite: e.target.value })}
        rows={3}
        placeholder="Décrivez brièvement votre activité..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
      />
    </div>
  </div>
);

interface FieldsB1Props {
  data: DonneesB1;
  onChange: (patch: Record<string, unknown>) => void;
  errors: Record<string, string>;
}

const FieldsB1: React.FC<FieldsB1Props> = ({ data, onChange, errors }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Dénomination sociale <span className="text-red-500">*</span></label>
      <Input value={data.denominationSociale} onChange={(e) => onChange({ denominationSociale: e.target.value })} placeholder="Raison sociale de la société" className={errors.denominationSociale ? 'border-red-300' : ''} />
      <FieldError error={errors.denominationSociale} />
    </div>
    <LegalFormSelect value={data.formeJuridique} onChange={(v) => onChange({ formeJuridique: v })} error={errors.formeJuridique} />
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Registre de Commerce <span className="text-red-500">*</span></label>
      <Input value={data.registreCommerce} onChange={(e) => onChange({ registreCommerce: e.target.value })} placeholder="N° RC" className={errors.registreCommerce ? 'border-red-300' : ''} />
      <FieldError error={errors.registreCommerce} />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">NIF <span className="text-red-500">*</span></label>
        <Input value={data.nif} onChange={(e) => onChange({ nif: e.target.value })} placeholder="20 chiffres" maxLength={20} className={errors.nif ? 'border-red-300' : ''} />
        <FieldError error={errors.nif} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">NIS <span className="text-red-500">*</span></label>
        <Input value={data.nis} onChange={(e) => onChange({ nis: e.target.value })} placeholder="15 chiffres" maxLength={15} className={errors.nis ? 'border-red-300' : ''} />
        <FieldError error={errors.nis} />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Article d'imposition</label>
        <Input value={data.articleImposition} onChange={(e) => onChange({ articleImposition: e.target.value })} placeholder="N° article" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Code NAE</label>
        <Input value={data.codeNae} onChange={(e) => onChange({ codeNae: e.target.value })} placeholder="Ex: 6201Z" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date de création</label>
        <DatePicker
          selected={data.dateCreationEntreprise}
          onChange={(d) => onChange({ dateCreationEntreprise: d })}
          locale={fr}
          dateFormat="dd/MM/yyyy"
          placeholderText="Sélectionner"
          showYearDropdown
          scrollableYearDropdown
          yearDropdownItemNumber={30}
          maxDate={new Date()}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ville d'immatriculation</label>
        <Input value={data.villeImmatriculation} onChange={(e) => onChange({ villeImmatriculation: e.target.value })} placeholder="Ex: Alger" />
      </div>
    </div>
  </div>
);

interface FieldsB2Props {
  data: DonneesB2;
  onChange: (patch: Record<string, unknown>) => void;
  errors: Record<string, string>;
}

const FieldsB2: React.FC<FieldsB2Props> = ({ data, onChange, errors }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Numéro auto-entrepreneur <span className="text-red-500">*</span></label>
      <Input value={data.numeroAutoEntrepreneur} onChange={(e) => onChange({ numeroAutoEntrepreneur: e.target.value })} placeholder="N° AE" className={errors.numeroAutoEntrepreneur ? 'border-red-300' : ''} />
      <FieldError error={errors.numeroAutoEntrepreneur} />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Activité exercée <span className="text-red-500">*</span></label>
      <Input value={data.activiteExercee} onChange={(e) => onChange({ activiteExercee: e.target.value })} placeholder="Votre activité principale" className={errors.activiteExercee ? 'border-red-300' : ''} />
      <FieldError error={errors.activiteExercee} />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Date d'inscription AE</label>
      <DatePicker
        selected={data.dateInscriptionAutoEntrepreneur}
        onChange={(d) => onChange({ dateInscriptionAutoEntrepreneur: d })}
        locale={fr}
        dateFormat="dd/MM/yyyy"
        placeholderText="Sélectionner"
        showYearDropdown
        scrollableYearDropdown
        maxDate={new Date()}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
      />
    </div>
  </div>
);

export interface StepProps {
  formData: WizardFormData;
  errors: Record<string, string>;
  uploadedDocuments: UploadedDocument[];
  requiredDocs: RequiredDocument[];
  casMetier: CasMetier | null;
  onSituationChange: (s: SituationAdministrative) => void;
  onTypeStructureChange: (t: TypeStructure) => void;
  onDirigeantChange: (patch: Partial<RepresentantLegal>) => void;
  onEntrepriseChange: (patch: Record<string, unknown>) => void;
  onCguChange: (v: boolean) => void;
  onOptionsChange: (patch: Partial<DomiciliationOptions>) => void;
  onDateDebutChange: (d: Date | null) => void;
  onAddDocument: (doc: UploadedDocument) => void;
  onRemoveDocument: (id: string) => void;
  getUploadedDoc: (type: string) => UploadedDocument | undefined;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const Step1Situation: React.FC<StepProps> = ({ formData, errors, onSituationChange }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Quelle est votre situation ?</h3>
      <p className="text-sm text-gray-500 mb-5">Indiquez si votre entreprise est déjà immatriculée ou en cours de création.</p>
    </div>
    <SelectionCard
      selected={formData.situation === 'en_cours_creation'}
      onClick={() => onSituationChange('en_cours_creation')}
      icon={<HelpCircle className="w-6 h-6" />}
      title="En cours de création"
      description="Je n'ai pas encore de registre de commerce. Je souhaite domicilier l'adresse de ma future entreprise."
      badge="Nouveau"
    />
    <SelectionCard
      selected={formData.situation === 'deja_creee'}
      onClick={() => onSituationChange('deja_creee')}
      icon={<Building className="w-6 h-6" />}
      title="Déjà créée"
      description="Mon entreprise est déjà immatriculée. Je souhaite transférer mon siège social ou me domicilier."
      badge="Existante"
    />
    <FieldError error={errors.situation} />
  </div>
);

export const Step2Structure: React.FC<StepProps> = ({ formData, errors, onTypeStructureChange }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Type de structure</h3>
      <p className="text-sm text-gray-500 mb-5">Choisissez le type de structure juridique de votre entreprise.</p>
    </div>
    <SelectionCard
      selected={formData.typeStructure === 'societe'}
      onClick={() => onTypeStructureChange('societe')}
      icon={<Building className="w-6 h-6" />}
      title="Société"
      description="SARL, EURL, SPA, SNC, SCS, Startup — Toute forme de société commerciale avec registre de commerce."
    />
    <SelectionCard
      selected={formData.typeStructure === 'auto_entrepreneur'}
      onClick={() => onTypeStructureChange('auto_entrepreneur')}
      icon={<User className="w-6 h-6" />}
      title="Auto-entrepreneur"
      description="Personne physique exerçant une activité commerciale ou artisanale en nom propre."
    />
    <FieldError error={errors.typeStructure} />
  </div>
);

export const Step3Dirigeant: React.FC<StepProps> = ({ formData, errors, onDirigeantChange, onDateDebutChange }) => {
  const { dirigeant, dateDebutSouhaitee } = formData;
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Informations du dirigeant</h3>
        <p className="text-sm text-gray-500 mb-1">Ces informations sont pré-remplies depuis votre profil.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LockedField label="Prénom" value={dirigeant.prenom} icon={<User className="w-3.5 h-3.5" />} />
        <LockedField label="Nom" value={dirigeant.nom} icon={<User className="w-3.5 h-3.5" />} />
      </div>
      <LockedField label="Email" value={dirigeant.email} icon={<Mail className="w-3.5 h-3.5" />} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone <span className="text-red-500">*</span></label>
        <Input
          value={dirigeant.telephone}
          onChange={(e) => onDirigeantChange({ telephone: e.target.value })}
          placeholder="05X XXX XX XX"
          icon={<Phone className="w-4 h-4 text-gray-400" />}
          className={errors['dirigeant.telephone'] ? 'border-red-300' : ''}
        />
        <FieldError error={errors['dirigeant.telephone']} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de résidence <span className="text-red-500">*</span></label>
        <Input
          value={dirigeant.adresseResidence}
          onChange={(e) => onDirigeantChange({ adresseResidence: e.target.value })}
          placeholder="Adresse complète"
          icon={<MapPin className="w-4 h-4 text-gray-400" />}
          className={errors['dirigeant.adresseResidence'] ? 'border-red-300' : ''}
        />
        <FieldError error={errors['dirigeant.adresseResidence']} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ville <span className="text-red-500">*</span></label>
        <Input
          value={dirigeant.ville}
          onChange={(e) => onDirigeantChange({ ville: e.target.value })}
          placeholder="Ex: Alger"
          className={errors['dirigeant.ville'] ? 'border-red-300' : ''}
        />
        <FieldError error={errors['dirigeant.ville']} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Calendar className="w-4 h-4 inline mr-1 text-amber-500" />
          Date de début souhaitée <span className="text-red-500">*</span>
        </label>
        <DatePicker
          selected={dateDebutSouhaitee}
          onChange={onDateDebutChange}
          locale={fr}
          dateFormat="dd/MM/yyyy"
          placeholderText="Sélectionner une date"
          minDate={new Date()}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent ${errors.dateDebutSouhaitee ? 'border-red-300' : 'border-gray-300'}`}
        />
        <FieldError error={errors.dateDebutSouhaitee} />
      </div>
    </div>
  );
};

export const Step4Entreprise: React.FC<StepProps> = ({ formData, errors, onEntrepriseChange, casMetier }) => {
  if (!casMetier || !formData.entreprise) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Veuillez d'abord choisir votre situation et type de structure.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Informations de l'entreprise</h3>
        <p className="text-sm text-gray-500 mb-2">Renseignez les informations de votre entreprise.</p>
      </div>
      <CasInfoBox cas={casMetier} />
      {casMetier === 'A1' && <FieldsA1 data={formData.entreprise as DonneesA1} onChange={onEntrepriseChange} errors={errors} />}
      {casMetier === 'A2' && <FieldsA2 data={formData.entreprise as DonneesA2} onChange={onEntrepriseChange} errors={errors} />}
      {casMetier === 'B1' && <FieldsB1 data={formData.entreprise as DonneesB1} onChange={onEntrepriseChange} errors={errors} />}
      {casMetier === 'B2' && <FieldsB2 data={formData.entreprise as DonneesB2} onChange={onEntrepriseChange} errors={errors} />}
    </div>
  );
};

interface DocumentUploadCardProps {
  doc: RequiredDocument;
  uploaded?: UploadedDocument;
  onUpload: (file: File, type: string) => void;
  onRemove: (id: string) => void;
  errors: Record<string, string>;
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({ doc, uploaded, onUpload, onRemove, errors }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Fichier trop volumineux (max 5 Mo)');
      return;
    }
    onUpload(file, doc.id);
    e.target.value = '';
  };

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${uploaded ? 'border-emerald-300 bg-emerald-50' : errors[doc.id] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className={`w-4 h-4 flex-shrink-0 ${uploaded ? 'text-emerald-600' : 'text-gray-400'}`} />
            <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
            {doc.required && <span className="text-xs text-red-500">*</span>}
          </div>
          {doc.description && <p className="text-xs text-gray-500 ml-6">{doc.description}</p>}
          {uploaded && <p className="text-xs text-emerald-600 ml-6 mt-1 truncate">{uploaded.name}</p>}
          <FieldError error={errors[doc.id]} />
        </div>
        {uploaded ? (
          <button
            type="button"
            onClick={() => onRemove(uploaded.id)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0"
          >
            <X className="w-3 h-3" />
            Retirer
          </button>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors flex-shrink-0"
          >
            <Upload className="w-3 h-3" />
            Choisir
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleChange} className="hidden" />
    </div>
  );
};

export const Step5Documents: React.FC<StepProps> = ({ requiredDocs, uploadedDocuments, errors, onAddDocument, onRemoveDocument }) => {
  const handleUpload = (file: File, type: string) => {
    onAddDocument({
      id: `${type}-${Date.now()}`,
      name: file.name,
      type,
      file,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Documents requis</h3>
        <p className="text-sm text-gray-500 mb-1">Formats acceptés : PDF, JPEG, PNG — Max 5 Mo par fichier.</p>
      </div>
      {requiredDocs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucun document requis pour cette étape.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requiredDocs.map((doc) => (
            <DocumentUploadCard
              key={doc.id}
              doc={doc}
              uploaded={uploadedDocuments.find((d) => d.type === doc.id)}
              onUpload={handleUpload}
              onRemove={onRemoveDocument}
              errors={errors}
            />
          ))}
        </div>
      )}
      {uploadedDocuments.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-xs text-emerald-700 font-medium">{uploadedDocuments.length} document(s) prêt(s) à l'envoi</p>
        </div>
      )}
    </div>
  );
};

export const Step6CGU: React.FC<StepProps> = ({ formData, errors, onCguChange }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Conditions générales</h3>
      <p className="text-sm text-gray-500 mb-2">Lisez et acceptez les conditions générales de domiciliation.</p>
    </div>
    <div className="h-64 overflow-y-auto bg-gray-50 border border-gray-200 rounded-xl p-4">
      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{CGU_TEXT}</pre>
    </div>
    <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.cguAcceptees ? 'border-emerald-400 bg-emerald-50' : errors.cguAcceptees ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${formData.cguAcceptees ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
        {formData.cguAcceptees && <Check className="w-3 h-3 text-white" />}
      </div>
      <input type="checkbox" checked={formData.cguAcceptees} onChange={(e) => onCguChange(e.target.checked)} className="sr-only" />
      <div>
        <p className={`text-sm font-medium ${formData.cguAcceptees ? 'text-emerald-800' : 'text-gray-700'}`}>
          J'accepte les conditions générales de domiciliation
        </p>
        <p className="text-xs text-gray-500 mt-0.5">En cochant cette case, vous acceptez le contrat de domiciliation de Coffice.</p>
      </div>
    </label>
    <FieldError error={errors.cguAcceptees} />
  </div>
);

export const Step7Options: React.FC<StepProps> = ({ formData, onOptionsChange }) => {
  const total = calculateMonthlyTotal(formData.options);
  const addons = OPTIONS_CONFIG.filter((c) => !c.included);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Options de service</h3>
        <p className="text-sm text-gray-500 mb-2">Personnalisez votre domiciliation avec des services additionnels.</p>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-800">Domiciliation simple</p>
            <p className="text-xs text-amber-700">Adresse légale — inclus dans le forfait de base</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-amber-700">{formatPrice(BASE_MONTHLY_PRICE)}</p>
            <p className="text-xs text-amber-600">HT/mois</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {addons.map((config) => {
          const selected = formData.options[config.key];
          const Icon = config.key === 'receptionCourrier' ? Package
            : config.key === 'scanNotificationEmail' ? ScanLine
            : config.key === 'reexpeditionCourrier' ? Forward
            : DoorOpen;

          return (
            <label
              key={config.key}
              className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${selected ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => onOptionsChange({ [config.key]: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${selected ? 'text-amber-800' : 'text-gray-700'}`}>{config.label}</p>
                <p className="text-xs text-gray-500">{config.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${selected ? 'text-amber-700' : 'text-gray-600'}`}>+{formatPrice(config.price)}</p>
                <p className="text-xs text-gray-400">/mois</p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Total mensuel</span>
          <div className="text-right">
            <span className="text-2xl font-bold">{formatPriceWithUnit(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Step8Summary: React.FC<StepProps> = ({ formData, uploadedDocuments, casMetier }) => {
  const total = calculateMonthlyTotal(formData.options);
  const e = formData.entreprise;

  const getSocieteLabel = () => {
    if (!e) return 'Non renseigné';
    if ('denominationSociale' in e) return (e as DonneesA1 | DonneesB1).denominationSociale || 'Non renseigné';
    if ('activiteExercee' in e) return (e as DonneesA2 | DonneesB2).activiteExercee || 'Non renseigné';
    return 'Non renseigné';
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Récapitulatif</h3>
        <p className="text-sm text-gray-500">Vérifiez vos informations avant d'envoyer votre demande.</p>
      </div>

      {casMetier && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-700">{getCasLabel(casMetier)}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Entreprise</p>
        </div>
        <div className="divide-y divide-gray-100">
          <SummaryRow label="Dénomination / Activité" value={getSocieteLabel()} />
          <SummaryRow label="Situation" value={formData.situation === 'en_cours_creation' ? 'En cours de création' : 'Déjà créée'} />
          <SummaryRow label="Structure" value={formData.typeStructure === 'auto_entrepreneur' ? 'Auto-entrepreneur' : 'Société'} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dirigeant</p>
        </div>
        <div className="divide-y divide-gray-100">
          <SummaryRow label="Nom" value={`${formData.dirigeant.prenom} ${formData.dirigeant.nom}`} />
          <SummaryRow label="Email" value={formData.dirigeant.email} />
          <SummaryRow label="Téléphone" value={formData.dirigeant.telephone} />
          <SummaryRow label="Ville" value={formData.dirigeant.ville} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Documents ({uploadedDocuments.length})</p>
        </div>
        {uploadedDocuments.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-400">Aucun document joint</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {uploadedDocuments.map((d) => (
              <div key={d.id} className="px-4 py-2 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-sm text-gray-700 truncate">{d.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Total mensuel estimé</span>
          <span className="text-xl font-bold">{formatPriceWithUnit(total)}</span>
        </div>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3">
        <p className="text-xs text-sky-700 font-medium flex items-start gap-2">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          Après envoi, notre équipe examinera votre dossier sous 24–48h ouvrées.
        </p>
      </div>
    </div>
  );
};

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="px-4 py-2.5 flex items-center justify-between gap-3">
    <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
    <span className="text-sm text-gray-800 font-medium text-right truncate">{value || '—'}</span>
  </div>
);

const Info: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
