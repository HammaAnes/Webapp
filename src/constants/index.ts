export * from "./espaces";
export * from "./messages";
export * from "./algeria";

export const RESERVATION_STATUTS = {
  CONFIRMEE: "confirmee",
  EN_ATTENTE: "en_attente",
  EN_COURS: "en_cours",
  ANNULEE: "annulee",
  TERMINEE: "terminee",
  NO_SHOW: "no_show",
} as const;

export type ReservationStatut =
  (typeof RESERVATION_STATUTS)[keyof typeof RESERVATION_STATUTS];

export const RESERVATION_STATUT_LABELS: Record<ReservationStatut, string> = {
  [RESERVATION_STATUTS.CONFIRMEE]: "Confirmée",
  [RESERVATION_STATUTS.EN_ATTENTE]: "En attente",
  [RESERVATION_STATUTS.EN_COURS]: "En cours",
  [RESERVATION_STATUTS.ANNULEE]: "Annulée",
  [RESERVATION_STATUTS.TERMINEE]: "Terminée",
  [RESERVATION_STATUTS.NO_SHOW]: "No-show",
};

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "error";

export const RESERVATION_STATUT_COLORS: Record<
  ReservationStatut,
  BadgeVariant
> = {
  [RESERVATION_STATUTS.CONFIRMEE]: "success",
  [RESERVATION_STATUTS.EN_ATTENTE]: "warning",
  [RESERVATION_STATUTS.EN_COURS]: "info",
  [RESERVATION_STATUTS.ANNULEE]: "danger",
  [RESERVATION_STATUTS.TERMINEE]: "default",
  [RESERVATION_STATUTS.NO_SHOW]: "error",
};

export function getReservationStatutLabel(statut: string): string {
  return RESERVATION_STATUT_LABELS[statut as ReservationStatut] || statut;
}

export function getReservationStatutColor(statut: string): BadgeVariant {
  return RESERVATION_STATUT_COLORS[statut as ReservationStatut] || "default";
}

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_STATUTS = {
  ACTIF: "actif",
  INACTIF: "inactif",
  SUSPENDU: "suspendu",
} as const;

export type UserStatut = (typeof USER_STATUTS)[keyof typeof USER_STATUTS];

export const DOMICILIATION_STATUTS = {
  DOSSIER_PREPARATOIRE: "dossier_preparatoire",
  EN_ATTENTE_SIGNATURE: "en_attente_signature",
  DOMICILIATION_CREEE: "domiciliation_creee",
  EN_ATTENTE_COMPLEMENTS: "en_attente_complements",
  ACTIVE: "active",
  REFUSEE: "refusee",
  EXPIREE: "expiree",
  RESILIEE: "resiliee",
} as const;

export type DomiciliationStatut =
  (typeof DOMICILIATION_STATUTS)[keyof typeof DOMICILIATION_STATUTS];

export const DOMICILIATION_STATUT_LABELS: Record<DomiciliationStatut, string> = {
  [DOMICILIATION_STATUTS.DOSSIER_PREPARATOIRE]: "Dossier préparatoire",
  [DOMICILIATION_STATUTS.EN_ATTENTE_SIGNATURE]: "En attente de signature notariale",
  [DOMICILIATION_STATUTS.DOMICILIATION_CREEE]: "Domiciliation créée",
  [DOMICILIATION_STATUTS.EN_ATTENTE_COMPLEMENTS]: "En attente de compléments",
  [DOMICILIATION_STATUTS.ACTIVE]: "Domiciliation active",
  [DOMICILIATION_STATUTS.REFUSEE]: "Refusée",
  [DOMICILIATION_STATUTS.EXPIREE]: "Expirée",
  [DOMICILIATION_STATUTS.RESILIEE]: "Résiliée",
};

export const SITUATION_ADMINISTRATIVE = {
  EN_COURS_CREATION: "en_cours_creation",
  DEJA_CREEE: "deja_creee",
} as const;

export type SituationAdministrative =
  (typeof SITUATION_ADMINISTRATIVE)[keyof typeof SITUATION_ADMINISTRATIVE];

export const TYPE_STRUCTURE = {
  SOCIETE: "societe",
  AUTO_ENTREPRENEUR: "auto_entrepreneur",
} as const;

export type TypeStructure =
  (typeof TYPE_STRUCTURE)[keyof typeof TYPE_STRUCTURE];

export const TYPE_RESERVATION = {
  HEURE: "heure",
  DEMI_JOURNEE: "demi_journee",
  JOUR: "jour",
  SEMAINE: "semaine",
  MOIS: "mois",
} as const;

export type TypeReservation =
  (typeof TYPE_RESERVATION)[keyof typeof TYPE_RESERVATION];
