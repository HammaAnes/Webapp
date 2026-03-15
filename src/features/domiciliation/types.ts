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
  date_reception?: string;
  dateReception?: string;
  date_retrait?: string;
  retire_par?: string;
}

export interface DocumentRecord {
  id: string;
  document_type: string;
  file_name: string;
  file_size?: number;
  created_at: string;
  url?: string;
  status?: "en_attente" | "valide" | "rejete";
  commentaire_rejet?: string;
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
