import React from 'react';
import { motion } from 'framer-motion';
import {
  Building, User, MapPin, Hash, Briefcase, Info, CheckCircle,
  HelpCircle, UserPlus, Shield, Package, Mail, ScanLine, Forward, DoorOpen, FileText, Upload, X, Scale,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import type {
  SituationAdministrative, TypeStructure, UploadedDocument, DomiciliationOptions,
  RepresentantLegal, DonneesA1, DonneesA2, DonneesB1, DonneesB2, WizardFormData,
} from '../../domain/types';
import { getCasLabel, getCasMetier } from '../../domain/types';
import { CGU_TEXT, LEGAL_FORMS, getRequiredDocuments } from '../../domain/constants';
import { OPTIONS_CONFIG, calculateMonthlyTotal, BASE_MONTHLY_PRICE } from '../../domain/pricing';

const stepMotion = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-red-500 text-sm mt-1">{error}</p>;
}

function SelectionCard({
  selected, onClick, icon, iconBg, title, description,
}: {
  selected: boolean; onClick: () => void; icon: React.ReactNode;
  iconBg: string; title: string; description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-6 rounded-2xl border-2 text-left transition-all ${
        selected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
      }`}
    >
      <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>{icon}</div>
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
}

function CasInfoBox({ situation, typeStructure }: { situation: SituationAdministrative; typeStructure: TypeStructure }) {
  const cas = getCasMetier(situation, typeStructure);
  const casLabel = getCasLabel(cas);
  const isSociete = typeStructure === 'societe';
  const bg = isSociete ? 'bg-sky-50 border-sky-200' : 'bg-emerald-50 border-emerald-200';
  const textClass = isSociete ? 'text-sky-700' : 'text-emerald-700';
  const iconClass = isSociete ? 'text-sky-600' : 'text-emerald-600';
  const detail = situation === 'en_cours_creation'
    ? isSociete
      ? "Vous devrez obtenir une réservation de dénomination auprès du CNRC."
      : "Aucune dénomination sociale n'est requise pour ce statut."
    : isSociete
      ? "Vous devrez fournir les documents administratifs de votre société."
      : "Vous devrez fournir votre carte d'auto-entrepreneur.";
  return (
    <div className={`p-4 rounded-xl border ${bg}`}>
      <div className="flex items-start gap-3">
        <Info className={`w-5 h-5 mt-0.5 ${iconClass}`} />
        <div className={`text-sm ${textClass}`}>
          <p className="font-medium mb-1">{casLabel}</p>
          <p>{detail}</p>
        </div>
      </div>
    </div>
  );
}

function LegalFormSelect({ value, onChange, error, label }: {
  value: string; onChange: (v: string) => void; error?: string; label: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
          error ? 'border-red-500' : 'border-gray-200'
        }`}
      >
        <option value="">Sélectionnez</option>
        {LEGAL_FORMS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <FieldError error={error} />
    </div>
  );
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <p className="font-medium text-gray-900">{value || '—'}</p>
    </div>
  );
}

function FieldsA1({ entreprise, errors, onChange }: {
  entreprise: DonneesA1;
  errors: Record<string, string>;
  onChange: (p: Record<string, unknown>) => void;
}) {
  return (
    <>
      <Input
        label="Dénomination sociale (Document CNRC)"
        icon={<Building className="w-5 h-5" />}
        value={entreprise.denominationSociale}
        onChange={e => onChange({ denominationSociale: e.target.value })}
        placeholder="Ex: Innovation Tech"
        className={errors.denominationSociale ? 'border-red-500' : ''}
      />
      <FieldError error={errors.denominationSociale} />
      <LegalFormSelect
        value={entreprise.formeJuridique}
        onChange={v => onChange({ formeJuridique: v })}
        error={errors.formeJuridique}
        label="Forme juridique envisagée"
      />
      <Input
        label="Activité principale (CODE NAE)"
        icon={<Briefcase className="w-5 h-5" />}
        value={entreprise.codeNae}
        onChange={e => onChange({ codeNae: e.target.value })}
        placeholder="Ex: 62.01 - Programmation informatique"
        className={errors.codeNae ? 'border-red-500' : ''}
      />
      <FieldError error={errors.codeNae} />
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
        <p className="text-sm text-sky-700">
          <strong>Finalité :</strong> Préparer le contrat de domiciliation chez le notaire pour constater la domiciliation et rédiger les statuts.
        </p>
      </div>
    </>
  );
}

function FieldsA2({ entreprise, errors, onChange }: {
  entreprise: DonneesA2;
  errors: Record<string, string>;
  onChange: (p: Record<string, unknown>) => void;
}) {
  return (
    <>
      <Input
        label="Activité exercée ou envisagée"
        icon={<Briefcase className="w-5 h-5" />}
        value={entreprise.activiteExercee}
        onChange={e => onChange({ activiteExercee: e.target.value })}
        placeholder="Ex: Consultant en informatique"
        className={errors.activiteExercee ? 'border-red-500' : ''}
      />
      <FieldError error={errors.activiteExercee} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description courte de l'activité <span className="text-red-500">*</span>
        </label>
        <textarea
          value={entreprise.descriptionActivite}
          onChange={e => onChange({ descriptionActivite: e.target.value })}
          placeholder="Décrivez brièvement votre activité..."
          rows={3}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
            errors.descriptionActivite ? 'border-red-500' : 'border-gray-200'
          }`}
        />
        <FieldError error={errors.descriptionActivite} />
      </div>
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <p className="text-sm text-emerald-700">
          <strong>Note :</strong> Aucune dénomination sociale n'est requise pour l'auto-entrepreneur.
        </p>
      </div>
    </>
  );
}

function FieldsB1({ entreprise, errors, onChange }: {
  entreprise: DonneesB1;
  errors: Record<string, string>;
  onChange: (p: Record<string, unknown>) => void;
}) {
  return (
    <>
      <Input
        label="Dénomination sociale"
        icon={<Building className="w-5 h-5" />}
        value={entreprise.denominationSociale}
        onChange={e => onChange({ denominationSociale: e.target.value })}
        placeholder="Ex: SARL Innovation Tech"
        className={errors.denominationSociale ? 'border-red-500' : ''}
      />
      <FieldError error={errors.denominationSociale} />
      <LegalFormSelect
        value={entreprise.formeJuridique}
        onChange={v => onChange({ formeJuridique: v })}
        error={errors.formeJuridique}
        label="Forme Juridique"
      />
      <Input
        label="Numéro de Registre de Commerce (RC)"
        icon={<Hash className="w-5 h-5" />}
        value={entreprise.registreCommerce}
        onChange={e => onChange({ registreCommerce: e.target.value })}
        placeholder="Ex: 16/00-0123456B00"
        className={errors.registreCommerce ? 'border-red-500' : ''}
      />
      <FieldError error={errors.registreCommerce} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="NIF (exactement 20 chiffres)"
            icon={<Hash className="w-5 h-5" />}
            value={entreprise.nif}
            onChange={e => onChange({ nif: e.target.value })}
            placeholder="09901234567890123456"
            maxLength={20}
            className={errors.nif ? 'border-red-500' : ''}
          />
          <FieldError error={errors.nif} />
        </div>
        <div>
          <Input
            label="NIS (exactement 15 chiffres)"
            icon={<Hash className="w-5 h-5" />}
            value={entreprise.nis}
            onChange={e => onChange({ nis: e.target.value })}
            placeholder="123456789012345"
            maxLength={15}
            className={errors.nis ? 'border-red-500' : ''}
          />
          <FieldError error={errors.nis} />
        </div>
      </div>
      <Input
        label="Article d'Imposition (AI)"
        icon={<Hash className="w-5 h-5" />}
        value={entreprise.articleImposition}
        onChange={e => onChange({ articleImposition: e.target.value })}
        placeholder="Ex: 12345678"
        className={errors.articleImposition ? 'border-red-500' : ''}
      />
      <FieldError error={errors.articleImposition} />
      <Input
        label="Activité principale (CODE NAE)"
        icon={<Briefcase className="w-5 h-5" />}
        value={entreprise.codeNae}
        onChange={e => onChange({ codeNae: e.target.value })}
        placeholder="Ex: 62.01 - Programmation informatique"
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date de création</label>
          <DatePicker
            selected={entreprise.dateCreationEntreprise}
            onChange={date => onChange({ dateCreationEntreprise: date })}
            maxDate={new Date()}
            dateFormat="dd MMMM yyyy"
            placeholderText="Sélectionnez"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <Input
          label="Ville d'immatriculation"
          icon={<MapPin className="w-5 h-5" />}
          value={entreprise.villeImmatriculation}
          onChange={e => onChange({ villeImmatriculation: e.target.value })}
          placeholder="Ex: Alger"
        />
      </div>
    </>
  );
}

function FieldsB2({ entreprise, errors, onChange }: {
  entreprise: DonneesB2;
  errors: Record<string, string>;
  onChange: (p: Record<string, unknown>) => void;
}) {
  return (
    <>
      <Input
        label="Numéro d'auto-entrepreneur"
        icon={<Hash className="w-5 h-5" />}
        value={entreprise.numeroAutoEntrepreneur}
        onChange={e => onChange({ numeroAutoEntrepreneur: e.target.value })}
        placeholder="Ex: AE-2024-123456"
        className={errors.numeroAutoEntrepreneur ? 'border-red-500' : ''}
      />
      <FieldError error={errors.numeroAutoEntrepreneur} />
      <Input
        label="Activité exercée"
        icon={<Briefcase className="w-5 h-5" />}
        value={entreprise.activiteExercee}
        onChange={e => onChange({ activiteExercee: e.target.value })}
        placeholder="Ex: Consultant en informatique"
        className={errors.activiteExercee ? 'border-red-500' : ''}
      />
      <FieldError error={errors.activiteExercee} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date d'inscription</label>
        <DatePicker
          selected={entreprise.dateInscriptionAutoEntrepreneur}
          onChange={date => onChange({ dateInscriptionAutoEntrepreneur: date })}
          maxDate={new Date()}
          dateFormat="dd MMMM yyyy"
          placeholderText="Sélectionnez"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>
    </>
  );
}

export function Step1Situation({ situation, onSelect }: {
  situation: SituationAdministrative | null;
  onSelect: (s: SituationAdministrative) => void;
}) {
  return (
    <motion.div key="step1" {...stepMotion} className="space-y-6">
      <div className="text-center mb-4">
        <Badge className="bg-amber-100 text-amber-700 mb-3">Étape 1 — Point d'entrée unique</Badge>
        <h3 className="font-bold text-xl text-gray-900">Situation administrative</h3>
        <p className="text-gray-500 text-sm mt-1">Ce choix conditionne l'intégralité du parcours</p>
      </div>
      <p className="text-gray-600 text-center font-medium">La structure est-elle :</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectionCard
          selected={situation === 'en_cours_creation'}
          onClick={() => onSelect('en_cours_creation')}
          icon={<UserPlus className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100"
          title="En cours de création"
          description="Future création, à partir de zéro"
        />
        <SelectionCard
          selected={situation === 'deja_creee'}
          onClick={() => onSelect('deja_creee')}
          icon={<Building className="w-6 h-6 text-sky-600" />}
          iconBg="bg-sky-100"
          title="Déjà créée"
          description="Entreprise immatriculée, transfert de siège"
        />
      </div>
    </motion.div>
  );
}

export function Step2Structure({ situation, typeStructure, onSelect }: {
  situation: SituationAdministrative | null;
  typeStructure: TypeStructure | null;
  onSelect: (t: TypeStructure) => void;
}) {
  return (
    <motion.div key="step2" {...stepMotion} className="space-y-6">
      <div className="text-center mb-4">
        <Badge className="bg-amber-100 text-amber-700 mb-3">Étape 2 — Type de structure</Badge>
        <h3 className="font-bold text-xl text-gray-900">Quel type de structure ?</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectionCard
          selected={typeStructure === 'societe'}
          onClick={() => onSelect('societe')}
          icon={<Building className="w-6 h-6 text-sky-600" />}
          iconBg="bg-sky-100"
          title="Société"
          description="SARL, EURL, SPA, SNC ou Startup"
        />
        <SelectionCard
          selected={typeStructure === 'auto_entrepreneur'}
          onClick={() => onSelect('auto_entrepreneur')}
          icon={<User className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100"
          title="Auto-entrepreneur"
          description="Statut simplifié pour activité individuelle"
        />
      </div>
      {situation && typeStructure && (
        <CasInfoBox situation={situation} typeStructure={typeStructure} />
      )}
    </motion.div>
  );
}

export function Step3Dirigeant({ dirigeant, dateDebutSouhaitee, errors, onUpdate, setDateDebutSouhaitee }: {
  dirigeant: RepresentantLegal;
  dateDebutSouhaitee: Date | null;
  errors: Record<string, string>;
  onUpdate: (p: Partial<RepresentantLegal>) => void;
  setDateDebutSouhaitee: (d: Date | null) => void;
}) {
  return (
    <motion.div key="step3" {...stepMotion} className="space-y-4">
      <div className="text-center mb-4">
        <Badge className="bg-amber-100 text-amber-700 mb-3">Étape 3 — Informations personnelles</Badge>
        <h3 className="font-bold text-xl text-gray-900">Dirigeant / Auto-entrepreneur</h3>
        <p className="text-gray-500 text-sm mt-1">Informations préremplies depuis votre inscription</p>
      </div>
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Informations verrouillées</p>
        <div className="grid grid-cols-2 gap-4">
          <LockedField label="Nom" value={dirigeant.nom} />
          <LockedField label="Prénom" value={dirigeant.prenom} />
          <LockedField label="Email" value={dirigeant.email} />
          <LockedField label="Téléphone" value={dirigeant.telephone} />
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <Input
            label="Adresse de résidence"
            icon={<MapPin className="w-5 h-5" />}
            value={dirigeant.adresseResidence}
            onChange={e => onUpdate({ adresseResidence: e.target.value })}
            placeholder="Ex: 12 Rue des Oliviers, Hydra"
            className={errors['dirigeant.adresseResidence'] ? 'border-red-500' : ''}
          />
          <FieldError error={errors['dirigeant.adresseResidence']} />
        </div>
        <div>
          <Input
            label="Ville"
            icon={<MapPin className="w-5 h-5" />}
            value={dirigeant.ville}
            onChange={e => onUpdate({ ville: e.target.value })}
            placeholder="Ex: Alger"
            className={errors['dirigeant.ville'] ? 'border-red-500' : ''}
          />
          <FieldError error={errors['dirigeant.ville']} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date souhaitée de début de domiciliation <span className="text-red-500">*</span>
          </label>
          <DatePicker
            selected={dateDebutSouhaitee}
            onChange={setDateDebutSouhaitee}
            minDate={new Date()}
            dateFormat="dd MMMM yyyy"
            placeholderText="Sélectionnez une date"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          <FieldError error={errors.dateDebutSouhaitee} />
        </div>
      </div>
    </motion.div>
  );
}

export function Step4Entreprise({ situation, typeStructure, entreprise, errors, onChange }: {
  situation: SituationAdministrative;
  typeStructure: TypeStructure;
  entreprise: WizardFormData['entreprise'];
  errors: Record<string, string>;
  onChange: (p: Record<string, unknown>) => void;
}) {
  const cas = getCasMetier(situation, typeStructure);
  const casLabel = getCasLabel(cas);
  return (
    <motion.div key="step4" {...stepMotion} className="space-y-4">
      <div className="text-center mb-4">
        <Badge className="bg-amber-100 text-amber-700 mb-3">{casLabel} — Informations demandées</Badge>
        <h3 className="font-bold text-xl text-gray-900">
          {situation === 'en_cours_creation' ? 'Future structure' : 'Structure existante'}
        </h3>
      </div>
      {cas === 'A1' && entreprise && <FieldsA1 entreprise={entreprise as DonneesA1} errors={errors} onChange={onChange} />}
      {cas === 'A2' && entreprise && <FieldsA2 entreprise={entreprise as DonneesA2} errors={errors} onChange={onChange} />}
      {cas === 'B1' && entreprise && <FieldsB1 entreprise={entreprise as DonneesB1} errors={errors} onChange={onChange} />}
      {cas === 'B2' && entreprise && <FieldsB2 entreprise={entreprise as DonneesB2} errors={errors} onChange={onChange} />}
    </motion.div>
  );
}

export function Step5Documents({ situation, typeStructure, uploadedDocuments, onUpload, onRemove, getUploadedDoc }: {
  situation: SituationAdministrative;
  typeStructure: TypeStructure;
  uploadedDocuments: UploadedDocument[];
  onUpload: (docType: string) => void;
  onRemove: (docId: string) => void;
  getUploadedDoc: (type: string) => UploadedDocument | undefined;
}) {
  const requiredDocs = getRequiredDocuments(situation, typeStructure);
  const cas = getCasMetier(situation, typeStructure);
  const casLabel = getCasLabel(cas);
  return (
    <motion.div key="step5" {...stepMotion} className="space-y-4">
      <div className="text-center mb-4">
        <Badge className="bg-amber-100 text-amber-700 mb-3">Étape 5 — Documents obligatoires</Badge>
        <h3 className="font-bold text-xl text-gray-900">Pièces justificatives</h3>
      </div>
      <div className={`p-4 rounded-xl border ${typeStructure === 'societe' ? 'bg-sky-50 border-sky-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <p className={`text-sm ${typeStructure === 'societe' ? 'text-sky-700' : 'text-emerald-700'}`}>
          <strong>{casLabel} :</strong>{' '}
          {situation === 'en_cours_creation'
            ? typeStructure === 'societe'
              ? 'CNI du futur gérant, Extrait de naissance, Document CNRC'
              : 'Seule la CNI est nécessaire'
            : typeStructure === 'societe'
              ? 'Registre de commerce, Statuts, CNI et extrait de naissance du gérant'
              : "Carte d'auto-entrepreneur et CNI"}
        </p>
      </div>
      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
        {requiredDocs.map(doc => {
          const uploaded = getUploadedDoc(doc.id);
          return (
            <div
              key={doc.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                uploaded ? 'border-emerald-300 bg-emerald-50' : doc.required ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{doc.name}</span>
                    {doc.required ? (
                      <Badge variant="warning" className="text-xs">Requis</Badge>
                    ) : (
                      <Badge variant="neutral" className="text-xs">Optionnel</Badge>
                    )}
                  </div>
                  {doc.description && <p className="text-xs text-gray-500 mt-1">{doc.description}</p>}
                  {uploaded && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {uploaded.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {uploaded ? (
                    <button type="button" onClick={() => onRemove(uploaded.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button type="button" onClick={() => onUpload(doc.id)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">
                      <Upload className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500">Formats acceptés : PDF, JPEG, PNG (max 5 Mo par fichier)</p>
    </motion.div>
  );
}

export function Step6CGU({ cguAcceptees, onToggle }: { cguAcceptees: boolean; onToggle: (v: boolean) => void }) {
  return (
    <motion.div key="step6" {...stepMotion} className="space-y-4">
      <div className="text-center mb-4">
        <Badge className="bg-amber-100 text-amber-700 mb-3">Étape clé — Conditions générales</Badge>
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
          onChange={e => onToggle(e.target.checked)}
          className="w-5 h-5 mt-0.5 text-amber-600 border-2 border-amber-300 rounded focus:ring-amber-500"
        />
        <div>
          <p className="font-medium text-gray-900">J'accepte les conditions générales de domiciliation</p>
          <p className="text-sm text-gray-600 mt-1">En cochant cette case, vous confirmez avoir lu et accepté les CGU.</p>
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
}

export function Step7Options({ options, onUpdate }: {
  options: DomiciliationOptions;
  onUpdate: (p: Partial<DomiciliationOptions>) => void;
}) {
  const total = calculateMonthlyTotal(options);
  return (
    <motion.div key="step7" {...stepMotion} className="space-y-4">
      <div className="text-center mb-4">
        <Badge className="bg-amber-100 text-amber-700 mb-3">Options de domiciliation</Badge>
        <h3 className="font-bold text-xl text-gray-900">Services complémentaires</h3>
        <p className="text-gray-500 text-sm mt-1">Sélectionnez les options souhaitées</p>
      </div>
      <div className="space-y-3">
        {OPTIONS_CONFIG.map(opt => {
          const icons: Record<string, React.ReactNode> = {
            domiciliationSimple: <MapPin className="w-5 h-5 text-emerald-600" />,
            receptionCourrier: <Mail className="w-5 h-5 text-gray-600" />,
            scanNotificationEmail: <ScanLine className="w-5 h-5 text-gray-600" />,
            reexpeditionCourrier: <Forward className="w-5 h-5 text-gray-600" />,
            accesPonctuelEspaces: <DoorOpen className="w-5 h-5 text-gray-600" />,
          };
          const checked = options[opt.key];
          return (
            <label
              key={opt.key}
              className={`flex items-start gap-4 p-4 border-2 rounded-xl transition-colors ${
                opt.included
                  ? 'bg-emerald-50 border-emerald-200'
                  : checked
                    ? 'border-amber-300 bg-amber-50/50'
                    : 'border-gray-200 cursor-pointer hover:border-amber-300 hover:bg-amber-50/50'
              }`}
            >
              <input
                type="checkbox"
                checked={!!checked}
                disabled={opt.included}
                onChange={e => onUpdate({ [opt.key]: e.target.checked })}
                className={`w-5 h-5 mt-0.5 border-2 rounded focus:ring-amber-500 ${
                  opt.included ? 'text-emerald-600 border-emerald-300' : 'text-amber-600 border-gray-300'
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {icons[opt.key]}
                  <span className="font-medium text-gray-900">{opt.label}</span>
                  {opt.included && <Badge variant="success" className="text-xs">Inclus</Badge>}
                </div>
                <p className="text-sm text-gray-600 mt-1">{opt.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {opt.included ? (
                  <span className="text-sm font-semibold text-emerald-600">Inclus</span>
                ) : (
                  <span className="text-sm font-bold text-gray-900">+{opt.price.toLocaleString()} <span className="text-xs font-normal text-gray-500">DA/mois</span></span>
                )}
              </div>
            </label>
          );
        })}
      </div>
      <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-700">Estimation mensuelle</p>
            <p className="text-xs text-amber-600 mt-0.5">Base {BASE_MONTHLY_PRICE.toLocaleString()} DA + options sélectionnées</p>
          </div>
          <p className="text-2xl font-bold text-amber-800">{total.toLocaleString()} <span className="text-sm font-normal">DA/mois</span></p>
        </div>
      </div>
    </motion.div>
  );
}

function SummarySection({ title, icon, bg, children }: { title: string; icon: React.ReactNode; bg: string; children: React.ReactNode }) {
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">{icon}{title}</h4>
      {children}
    </div>
  );
}

function SummaryItem({ label, value, italic, colSpan2 }: { label: string; value: string; italic?: boolean; colSpan2?: boolean }) {
  return (
    <div className={colSpan2 ? 'col-span-2' : ''}>
      <span className="text-gray-500">{label}:</span>
      <p className={`font-medium ${italic ? 'text-gray-500 italic' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

export function Step8Summary({ situation, typeStructure, formData, uploadedDocuments }: {
  situation: SituationAdministrative;
  typeStructure: TypeStructure;
  formData: WizardFormData;
  uploadedDocuments: UploadedDocument[];
}) {
  const cas = getCasMetier(situation, typeStructure);
  const casLabel = getCasLabel(cas);
  const entreprise = formData.entreprise as Record<string, unknown> | null;
  return (
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
            <p className="text-sm text-emerald-700">Vérifiez les informations ci-dessous. Notre équipe traitera votre demande sous 48h ouvrées.</p>
          </div>
        </div>
      </div>
      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
        <SummarySection title="Situation administrative" icon={<HelpCircle className="w-4 h-4 text-amber-500" />} bg="bg-amber-50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <SummaryItem label="Situation" value={situation === 'en_cours_creation' ? 'En cours de création' : 'Déjà créée'} />
            <SummaryItem label="Type" value={typeStructure === 'societe' ? 'Société' : 'Auto-entrepreneur'} />
            <SummaryItem label="Cas" value={casLabel} />
            <SummaryItem label="Début souhaité" value={formData.dateDebutSouhaitee ? format(formData.dateDebutSouhaitee, 'dd/MM/yyyy') : '—'} />
          </div>
        </SummarySection>
        <SummarySection title={situation === 'en_cours_creation' ? 'Future structure' : 'Entreprise'} icon={<Building className="w-4 h-4 text-amber-500" />} bg="bg-gray-50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {typeStructure === 'societe' && entreprise ? (
              <>
                <SummaryItem label="Dénomination" value={String(entreprise.denominationSociale || '—')} />
                <SummaryItem label="Forme juridique" value={String(entreprise.formeJuridique || '—')} />
                {entreprise.codeNae && <SummaryItem label="Code NAE" value={String(entreprise.codeNae)} colSpan2 />}
                {situation === 'deja_creee' && (
                  <>
                    {entreprise.registreCommerce && <SummaryItem label="RC" value={String(entreprise.registreCommerce)} />}
                    {entreprise.nif && <SummaryItem label="NIF" value={String(entreprise.nif)} />}
                  </>
                )}
              </>
            ) : entreprise ? (
              <>
                <SummaryItem label="Nom" value={`${formData.dirigeant.prenom} ${formData.dirigeant.nom}`} />
                <SummaryItem label="Forme" value="Auto-entrepreneur" />
                {entreprise.activiteExercee && <SummaryItem label="Activité" value={String(entreprise.activiteExercee)} colSpan2 />}
              </>
            ) : null}
          </div>
        </SummarySection>
        <SummarySection title="Dirigeant" icon={<User className="w-4 h-4 text-sky-500" />} bg="bg-sky-50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <SummaryItem label="Nom complet" value={`${formData.dirigeant.prenom} ${formData.dirigeant.nom}`} />
            <SummaryItem label="Ville" value={formData.dirigeant.ville || '—'} />
          </div>
        </SummarySection>
        <SummarySection title={`Documents (${uploadedDocuments.length})`} icon={<FileText className="w-4 h-4 text-emerald-500" />} bg="bg-emerald-50">
          {uploadedDocuments.length > 0 ? (
            <div className="space-y-1">
              {uploadedDocuments.map(doc => (
                <p key={doc.id} className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-500" /> {doc.name}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucun document uploadé</p>
          )}
        </SummarySection>
        <SummarySection title="Options sélectionnées" icon={<Package className="w-4 h-4 text-teal-500" />} bg="bg-teal-50">
          <div className="space-y-1 text-sm">
            {OPTIONS_CONFIG.filter(o => formData.options[o.key]).map(o => (
              <p key={o.key} className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-3 h-3 text-teal-500" /> {o.label}
              </p>
            ))}
          </div>
        </SummarySection>
        <SummarySection title="Conditions générales" icon={<Scale className="w-4 h-4 text-gray-500" />} bg="bg-gray-50">
          <p className="text-sm"><span className="text-gray-500">CGU acceptées :</span> <span className="font-medium text-emerald-600">Oui</span></p>
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
              <li>Attribution du numéro de bureau (1-60)</li>
              <li>Remise de l'attestation de domiciliation</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
