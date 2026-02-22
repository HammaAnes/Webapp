import type { DomiciliationOptions, DemandeDomiciliation } from "../../types";

export type SituationAdministrative = "en_cours_creation" | "deja_creee" | null;
export type TypeStructureChoice = "societe" | "auto_entrepreneur" | null;
export type LegalFormType = "SARL" | "EURL" | "SPA" | "SNC" | "SCS" | "Startup" | "";

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  file: File;
}

export interface DomiciliationFormData {
  denominationSociale: string;
  formeJuridique: LegalFormType;
  nif: string;
  nis: string;
  registreCommerce: string;
  articleImposition: string;
  codeNae: string;
  activiteExercee: string;
  descriptionActivite: string;
  numeroAutoEntrepreneur: string;
  dateCreationEntreprise: Date | null;
  villeImmatriculation: string;
  dateInscriptionAutoEntrepreneur: Date | null;
  dirigeant: {
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
    adresseResidence: string;
    ville: string;
  };
  dateDebutSouhaitee: Date | null;
  cguAcceptees: boolean;
  options: DomiciliationOptions;
}

export interface RequiredDocument {
  id: string;
  name: string;
  description?: string;
  required: boolean;
}

export interface WizardStep {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface StatusInfo {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  gradient: string;
  label: string;
  description: string;
}

export type DemandeDomiciliationWithDetails = DemandeDomiciliation;
