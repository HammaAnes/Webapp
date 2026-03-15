export type SituationAdministrative = 'en_cours_creation' | 'deja_creee';
export type TypeStructure = 'societe' | 'auto_entrepreneur';
export type LegalForm = 'SARL' | 'EURL' | 'SPA' | 'SNC' | 'SCS' | 'Startup';

export type DomiciliationStatut =
  | 'dossier_preparatoire'
  | 'en_attente_complements'
  | 'en_attente_signature'
  | 'domiciliation_creee'
  | 'active'
  | 'refusee'
  | 'expiree'
  | 'resiliee';

export type CourrierType = 'lettre' | 'colis' | 'recommande' | 'autre';
export type CourrierStatut =
  | 'recu' | 'notifie' | 'en_attente_instruction' | 'recupere'
  | 'retire' | 'scanne' | 'reexpedier' | 'envoye' | 'traite' | 'archive';
export type DocumentStatus = 'en_attente' | 'valide' | 'rejete';

export type CasMetier = 'A1' | 'A2' | 'B1' | 'B2';

export function getCasMetier(situation: SituationAdministrative, typeStructure: TypeStructure): CasMetier {
  if (situation === 'en_cours_creation') return typeStructure === 'societe' ? 'A1' : 'A2';
  return typeStructure === 'societe' ? 'B1' : 'B2';
}

export function getCasLabel(cas: CasMetier): string {
  const labels: Record<CasMetier, string> = {
    A1: 'CAS A1 — Société en cours de création',
    A2: 'CAS A2 — Auto-entrepreneur en cours de création',
    B1: 'CAS B1 — Société déjà créée',
    B2: 'CAS B2 — Auto-entrepreneur déjà créé',
  };
  return labels[cas];
}

export function getCasShortLabel(cas: CasMetier): string {
  return { A1: 'CAS A1', A2: 'CAS A2', B1: 'CAS B1', B2: 'CAS B2' }[cas];
}

export interface RepresentantLegal {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresseResidence: string;
  ville: string;
  fonction?: string;
}

export interface DomiciliationOptions {
  domiciliationSimple: boolean;
  receptionCourrier: boolean;
  scanNotificationEmail: boolean;
  reexpeditionCourrier: boolean;
  accesPonctuelEspaces: boolean;
}

export const DEFAULT_OPTIONS: DomiciliationOptions = {
  domiciliationSimple: true,
  receptionCourrier: false,
  scanNotificationEmail: false,
  reexpeditionCourrier: false,
  accesPonctuelEspaces: false,
};

export interface DonneesA1 {
  denominationSociale: string;
  formeJuridique: LegalForm | '';
  codeNae: string;
}

export interface DonneesA2 {
  activiteExercee: string;
  descriptionActivite: string;
}

export interface DonneesB1 {
  denominationSociale: string;
  formeJuridique: LegalForm | '';
  registreCommerce: string;
  nif: string;
  nis: string;
  articleImposition: string;
  codeNae: string;
  dateCreationEntreprise: Date | null;
  villeImmatriculation: string;
}

export interface DonneesB2 {
  numeroAutoEntrepreneur: string;
  activiteExercee: string;
  dateInscriptionAutoEntrepreneur: Date | null;
}

export interface WizardFormData {
  situation: SituationAdministrative | null;
  typeStructure: TypeStructure | null;
  dirigeant: RepresentantLegal;
  dateDebutSouhaitee: Date | null;
  entreprise: DonneesA1 | DonneesA2 | DonneesB1 | DonneesB2 | null;
  cguAcceptees: boolean;
  options: DomiciliationOptions;
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  file: File;
}

export interface RequiredDocument {
  id: string;
  name: string;
  description?: string;
  required: boolean;
}

export interface DocumentRecord {
  id: string;
  documentType: string;
  fileName: string;
  fileSize?: number;
  createdAt: string;
  url?: string;
  status: DocumentStatus;
  commentaireRejet?: string;
}

export interface DocumentSlot {
  type: string;
  label: string;
  required: boolean;
}

export interface DemandeDomiciliation {
  id: string;
  userId?: string;
  contactId?: string;
  utilisateur?: { id: string; nom: string; prenom: string; email: string };
  contact?: { id: string; nom: string; prenom: string; email: string };
  situationAdministrative: SituationAdministrative;
  typeStructure: TypeStructure;
  raisonSociale: string;
  formeJuridique: string;
  nif?: string;
  nis?: string;
  registreCommerce?: string;
  articleImposition?: string;
  codeNae?: string;
  activiteExercee?: string;
  descriptionActivite?: string;
  numeroAutoEntrepreneur?: string;
  dateCreationEntreprise?: string;
  villeImmatriculation?: string;
  activitePrincipale?: string;
  domaineActivite?: string;
  adresseSiegeSocial?: string;
  capital?: number;
  representantLegal: RepresentantLegal;
  numeroBureau?: number;
  referenceContratNotarie?: string;
  dateDebutContrat?: string;
  dateFinContrat?: string;
  montantMensuel?: number;
  options?: DomiciliationOptions;
  cguAcceptees: boolean;
  dateCguAcceptation?: string;
  statut: DomiciliationStatut;
  commentaireAdmin?: string;
  dateValidation?: string;
  dateCreation: string;
  updatedAt: string;
  dateDebut?: string;
  dateFin?: string;
  dateDebutSouhaitee?: string;
  wilaya?: string;
  commune?: string;
  adresseActuelle?: string;
  visibleSurSite?: boolean;
  documents?: Array<{ type: string; name: string }>;
}

export interface CourrierItem {
  id: string;
  type: CourrierType;
  expediteur: string;
  description: string;
  statut: CourrierStatut;
  dateReception: string;
  dateRetrait?: string;
  instructionClient?: string;
}

export type ActionKey =
  | 'valider'
  | 'complements'
  | 'rejeter'
  | 'signer'
  | 'activer'
  | 'renouveler'
  | 'resilier';

export interface ActionData {
  motif?: string;
  numeroBureau?: number;
  referenceContratNotarie?: string;
  dateDebutContrat?: string;
  dateFinContrat?: string;
  montantMensuel?: number;
}
