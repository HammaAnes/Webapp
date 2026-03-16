export type {
  DomiciliationStatut,
  SituationAdministrative,
  TypeStructure,
} from "../../constants";
export type {
  DemandeDomiciliation,
  DomiciliationOptions,
  RepresentantLegal,
} from "../../types";
export { DEFAULT_OPTIONS } from "./constants";

export type LegalForm = 'SARL' | 'EURL' | 'SPA' | 'SNC' | 'SCS' | 'Startup' | 'auto_entrepreneur' | 'freelance' | 'autre';
export type CourrierType = 'lettre' | 'colis' | 'recommande' | 'officiel' | 'autre';
export type CourrierStatut =
  | 'recu' | 'notifie' | 'en_attente_instruction'
  | 'recupere' | 'scanne' | 'reexpedier'
  | 'traite';
export type DocumentStatus = 'en_attente' | 'valide' | 'rejete';
export type CasMetier = 'A1' | 'A2' | 'B1' | 'B2';

export function getCasMetier(situation: 'en_cours_creation' | 'deja_creee', typeStructure: 'societe' | 'auto_entrepreneur'): CasMetier {
  if (situation === 'en_cours_creation') return typeStructure === 'societe' ? 'A1' : 'A2';
  return typeStructure === 'societe' ? 'B1' : 'B2';
}

export function getCasLabel(cas: CasMetier): string {
  const labels: Record<CasMetier, string> = {
    A1: 'CAS A1 — Societe en cours de creation',
    A2: 'CAS A2 — Auto-entrepreneur en cours de creation',
    B1: 'CAS B1 — Societe deja creee',
    B2: 'CAS B2 — Auto-entrepreneur deja cree',
  };
  return labels[cas];
}

export function getCasShortLabel(cas: CasMetier): string {
  return { A1: 'CAS A1', A2: 'CAS A2', B1: 'CAS B1', B2: 'CAS B2' }[cas];
}

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
  situation: 'en_cours_creation' | 'deja_creee' | null;
  typeStructure: 'societe' | 'auto_entrepreneur' | null;
  dirigeant: {
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
    adresseResidence?: string;
    ville?: string;
    fonction?: string;
  };
  dateDebutSouhaitee: Date | null;
  entreprise: DonneesA1 | DonneesA2 | DonneesB1 | DonneesB2 | null;
  cguAcceptees: boolean;
  options: {
    domiciliationSimple: boolean;
    receptionCourrier: boolean;
    scanNotificationEmail: boolean;
    reexpeditionCourrier: boolean;
    accesPonctuelEspaces: boolean;
  };
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

export interface CourrierItem {
  id: string;
  type: CourrierType;
  expediteur: string;
  description?: string;
  statut: CourrierStatut;
  dateReception: string;
  dateRetrait?: string;
  dateTraitement?: string;
  notesAdmin?: string;
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
  complementsDemandes?: string;
  numeroBureau?: number;
  referenceContratNotarie?: string;
  dateDebutContrat?: string;
  dateFinContrat?: string;
  montantMensuel?: number;
  modePaiement?: string;
}
