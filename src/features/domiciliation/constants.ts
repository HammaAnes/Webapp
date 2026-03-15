import {
  Clock,
  Scale,
  CheckCircle,
  FileText,
  PlayCircle,
  XCircle,
  AlertCircle,
  Ban,
} from "lucide-react";
import type { DomiciliationStatut } from "./types";

export const STATUT_CONFIG: Record<
  DomiciliationStatut,
  {
    label: string;
    shortLabel: string;
    variant: "warning" | "success" | "danger" | "default" | "info" | "teal";
    icon: React.ElementType;
    color: string;
  }
> = {
  dossier_preparatoire: {
    label: "Dossier préparatoire",
    shortLabel: "Préparatoire",
    variant: "warning",
    icon: Clock,
    color: "text-amber-600",
  },
  en_attente_signature: {
    label: "En attente de signature notariale",
    shortLabel: "Att. signature",
    variant: "info",
    icon: Scale,
    color: "text-sky-600",
  },
  domiciliation_creee: {
    label: "Domiciliation créée",
    shortLabel: "Créée",
    variant: "teal",
    icon: CheckCircle,
    color: "text-teal-600",
  },
  en_attente_complements: {
    label: "En attente de compléments",
    shortLabel: "Att. compléments",
    variant: "warning",
    icon: FileText,
    color: "text-amber-600",
  },
  active: {
    label: "Active",
    shortLabel: "Active",
    variant: "success",
    icon: PlayCircle,
    color: "text-emerald-600",
  },
  refusee: {
    label: "Refusée",
    shortLabel: "Refusée",
    variant: "danger",
    icon: XCircle,
    color: "text-red-600",
  },
  expiree: {
    label: "Expirée",
    shortLabel: "Expirée",
    variant: "default",
    icon: AlertCircle,
    color: "text-gray-600",
  },
  resiliee: {
    label: "Résiliée",
    shortLabel: "Résiliée",
    variant: "danger",
    icon: Ban,
    color: "text-red-600",
  },
};

export const WORKFLOW_TRANSITIONS: Record<DomiciliationStatut, DomiciliationStatut[]> = {
  dossier_preparatoire: ["en_attente_signature", "en_attente_complements", "refusee"],
  en_attente_complements: ["en_attente_signature", "refusee"],
  en_attente_signature: ["domiciliation_creee", "refusee"],
  domiciliation_creee: ["active", "en_attente_complements", "refusee"],
  active: ["resiliee"],
  expiree: ["active"],
  refusee: [],
  resiliee: [],
};

export const SOCIETE_DOCS: DocumentSlotDef[] = [
  { type: "rc", label: "Registre de Commerce", required: true },
  { type: "nif", label: "NIF", required: true },
  { type: "nis", label: "NIS", required: true },
  { type: "c20", label: "Extrait C20", required: true },
  { type: "statuts", label: "Statuts de la société", required: false },
  { type: "cni", label: "CNI du gérant", required: true },
];

export const AUTO_ENTREPRENEUR_DOCS: DocumentSlotDef[] = [
  { type: "carte_ae", label: "Carte Auto-Entrepreneur", required: true },
  { type: "cni", label: "CNI", required: true },
];

export const COMMON_DOCS: DocumentSlotDef[] = [
  { type: "autre", label: "Autre document", required: false },
];

export const REQUIRED_DOCS_NEW_SOCIETE: DocumentSlotDef[] = [
  { type: "cni", label: "CNI du futur gérant", required: true },
  { type: "extrait_naissance", label: "Extrait de naissance", required: true },
  { type: "reservation_denomination", label: "Réservation de dénomination (CNRC)", required: false },
];

export const REQUIRED_DOCS_NEW_AUTO_ENTREPRENEUR: DocumentSlotDef[] = [
  { type: "cni", label: "CNI de l'auto-entrepreneur", required: true },
];

export const REQUIRED_DOCS_EXISTING_SOCIETE: DocumentSlotDef[] = [
  { type: "rc", label: "Registre de Commerce", required: true },
  { type: "statuts", label: "Statuts de la société", required: true },
  { type: "cni", label: "CNI du gérant", required: true },
  { type: "extrait_naissance", label: "Extrait de naissance du gérant", required: true },
];

export const REQUIRED_DOCS_EXISTING_AUTO_ENTREPRENEUR: DocumentSlotDef[] = [
  { type: "carte_ae", label: "Carte Auto-Entrepreneur", required: true },
  { type: "cni", label: "CNI", required: true },
];

interface DocumentSlotDef {
  type: string;
  label: string;
  required: boolean;
}

export const FORMES_JURIDIQUES = [
  "SARL",
  "EURL",
  "SPA",
  "SNC",
  "SCS",
  "SCA",
  "Micro-entreprise",
  "Autre",
];

export const OPTIONS_DOMICILIATION = [
  { key: "domiciliationSimple" as const, label: "Domiciliation simple", prix: 0 },
  { key: "receptionCourrier" as const, label: "Réception courrier", prix: 2000 },
  { key: "scanNotificationEmail" as const, label: "Scan + notification email", prix: 3000 },
  { key: "reexpeditionCourrier" as const, label: "Réexpédition courrier", prix: 5000 },
  { key: "accesPonctuelEspaces" as const, label: "Accès ponctuel espaces (2 demi-journées/mois)", prix: 4000 },
];

export const STATUTS_ACTIFS: DomiciliationStatut[] = [
  "active",
  "domiciliation_creee",
  "en_attente_complements",
  "en_attente_signature",
];

export const STATUS_FILTERS = [
  { key: "tous", label: "Tous" },
  { key: "dossier_preparatoire", label: "Préparatoires" },
  { key: "en_attente_signature", label: "Att. signature" },
  { key: "domiciliation_creee", label: "Créées" },
  { key: "en_attente_complements", label: "Att. compléments" },
  { key: "active", label: "Actives" },
  { key: "refusee", label: "Refusées" },
  { key: "resiliee", label: "Résiliées" },
  { key: "expiree", label: "Expirées" },
];
