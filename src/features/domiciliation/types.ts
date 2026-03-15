import type { DemandeDomiciliation, DomiciliationOptions } from "../../types";

export type { DemandeDomiciliation, DomiciliationOptions };

export type DomiciliationStatut =
  | "dossier_preparatoire"
  | "en_attente_signature"
  | "domiciliation_creee"
  | "en_attente_complements"
  | "active"
  | "refusee"
  | "expiree"
  | "resiliee";

export interface CourrierItem {
  id: string;
  type: "lettre" | "colis" | "recommande" | "autre";
  expediteur: string;
  description?: string;
  statut: "recu" | "notifie" | "en_attente_instruction" | "retire" | "envoye" | "archive";
  dateReception: string;
  dateRetrait?: string;
  retirePar?: string;
}

export interface DocumentRecord {
  id: string;
  documentType: string;
  fileName: string;
  fileSize?: number;
  createdAt: string;
  url?: string;
  status: "en_attente" | "valide" | "rejete";
  commentaireRejet?: string;
}

export interface DocumentSlot {
  type: string;
  label: string;
  required: boolean;
}

export type ActionKey =
  | "valider"
  | "complements"
  | "rejeter"
  | "signer"
  | "activer"
  | "renouveler"
  | "resilier";

export interface ActionData {
  motif?: string;
  numeroBureau?: number;
  referenceContratNotarie?: string;
  dateDebutContrat?: string;
  dateFinContrat?: string;
  montantMensuel?: number;
}
