import {
  Clock,
  Scale,
  CheckCircle,
  FileText,
  PlayCircle,
  XCircle,
  AlertCircle,
  Ban,
  Mail,
  Package,
  Bookmark,
} from "lucide-react";
import type { DomiciliationStatut } from "./types";

export const STATUT_CONFIG: Record<
  DomiciliationStatut,
  {
    label: string;
    shortLabel: string;
    variant: "warning" | "success" | "danger" | "neutral" | "info" | "accent";
    icon: React.ElementType;
    color: string;
    bg: string;
    step: number;
  }
> = {
  dossier_preparatoire: {
    label: "Dossier préparatoire",
    shortLabel: "Préparatoire",
    variant: "warning",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    step: 0,
  },
  en_attente_complements: {
    label: "En attente de compléments",
    shortLabel: "Att. compléments",
    variant: "warning",
    icon: FileText,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    step: 1,
  },
  en_attente_signature: {
    label: "En attente de signature notariale",
    shortLabel: "Att. signature",
    variant: "info",
    icon: Scale,
    color: "text-sky-700",
    bg: "bg-sky-50 border-sky-200",
    step: 2,
  },
  domiciliation_creee: {
    label: "Domiciliation créée",
    shortLabel: "Créée",
    variant: "info",
    icon: CheckCircle,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    step: 3,
  },
  active: {
    label: "Active",
    shortLabel: "Active",
    variant: "success",
    icon: PlayCircle,
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    step: 4,
  },
  refusee: {
    label: "Refusée",
    shortLabel: "Refusée",
    variant: "danger",
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    step: -1,
  },
  expiree: {
    label: "Expirée",
    shortLabel: "Expirée",
    variant: "neutral",
    icon: AlertCircle,
    color: "text-gray-600",
    bg: "bg-gray-50 border-gray-200",
    step: 5,
  },
  resiliee: {
    label: "Résiliée",
    shortLabel: "Résiliée",
    variant: "danger",
    icon: Ban,
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    step: -1,
  },
};

export const WORKFLOW_STEPS: { key: DomiciliationStatut; label: string }[] = [
  { key: "dossier_preparatoire", label: "Dossier" },
  { key: "en_attente_signature", label: "Signature" },
  { key: "domiciliation_creee", label: "Créée" },
  { key: "active", label: "Active" },
  { key: "expiree", label: "Expirée" },
];

export const WORKFLOW_TRANSITIONS: Record<DomiciliationStatut, DomiciliationStatut[]> = {
  dossier_preparatoire: ["en_attente_complements", "en_attente_signature", "refusee"],
  en_attente_complements: ["en_attente_signature", "refusee"],
  en_attente_signature: ["domiciliation_creee", "refusee"],
  domiciliation_creee: ["active", "en_attente_complements", "refusee"],
  active: ["resiliee", "expiree"],
  expiree: [],
  refusee: [],
  resiliee: [],
};

export const COURRIER_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; iconBg: string; iconColor: string }
> = {
  lettre: {
    label: "Lettre",
    icon: Mail,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  colis: {
    label: "Colis",
    icon: Package,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  recommande: {
    label: "Recommandé",
    icon: Bookmark,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  autre: {
    label: "Autre",
    icon: Mail,
    iconBg: "bg-gray-50",
    iconColor: "text-gray-500",
  },
};

export const COURRIER_STATUT_CONFIG: Record<
  string,
  { label: string; variant: "warning" | "success" | "info" | "danger" | "neutral" | "accent" }
> = {
  recu: { label: "Reçu", variant: "warning" },
  notifie: { label: "Notifié", variant: "info" },
  en_attente_instruction: { label: "Att. instruction", variant: "warning" },
  recupere: { label: "Récupéré", variant: "success" },
  retire: { label: "Retiré", variant: "success" },
  scanne: { label: "Scanné", variant: "accent" },
  reexpedier: { label: "Réexpédition", variant: "info" },
  envoye: { label: "Envoyé", variant: "info" },
  traite: { label: "Traité", variant: "success" },
  archive: { label: "Archivé", variant: "neutral" },
};

export const COURRIER_INACTIVE_STATUTS = ["retire", "envoye", "archive"];

export const SOCIETE_DOCS = [
  { type: "registre_commerce", label: "Registre de Commerce (RC)", required: true },
  { type: "c20", label: "Extrait C20", required: true },
  { type: "statuts", label: "Statuts de la société", required: true },
  { type: "cni_gerant", label: "CNI du gérant", required: true },
  { type: "extrait_naissance_gerant", label: "Extrait de naissance du gérant", required: true },
];

export const AUTO_ENTREPRENEUR_DOCS = [
  { type: "carte_ae", label: "Carte Auto-Entrepreneur", required: true },
  { type: "cni", label: "Carte Nationale d'Identité", required: true },
];

export const COMMON_DOCS = [{ type: "autre", label: "Autre document", required: false }];

export const REQUIRED_DOCS_NEW_SOCIETE = [
  { type: "cni", label: "CNI du futur gérant", required: true },
  { type: "extrait_naissance", label: "Extrait de naissance", required: true },
  { type: "reservation_denomination", label: "Réservation dénomination (CNRC)", required: false },
];

export const REQUIRED_DOCS_NEW_AUTO_ENTREPRENEUR = [
  { type: "cni", label: "CNI de l'auto-entrepreneur", required: true },
];

export const REQUIRED_DOCS_EXISTING_SOCIETE = [
  { type: "registre_commerce", label: "Registre de Commerce (RC)", required: true },
  { type: "c20", label: "Extrait C20", required: true },
  { type: "statuts", label: "Statuts de la société", required: true },
  { type: "cni_gerant", label: "CNI du gérant", required: true },
  { type: "extrait_naissance_gerant", label: "Extrait de naissance du gérant", required: true },
];

export const REQUIRED_DOCS_EXISTING_AUTO_ENTREPRENEUR = [
  { type: "carte_ae", label: "Carte Auto-Entrepreneur", required: true },
  { type: "cni", label: "CNI", required: true },
];

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
  { key: "domiciliationSimple" as const, label: "Domiciliation simple", description: "Adresse légale uniquement" },
  { key: "receptionCourrier" as const, label: "Réception courrier", description: "Collecte et notification" },
  { key: "scanNotificationEmail" as const, label: "Scan + notification email", description: "Numérisation du courrier" },
  { key: "reexpeditionCourrier" as const, label: "Réexpédition courrier", description: "Envoi à votre adresse" },
  { key: "accesPonctuelEspaces" as const, label: "Accès ponctuel espaces", description: "2 demi-journées/mois" },
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

export const DOCUMENT_STATUS_CONFIG = {
  en_attente: { label: "En attente", variant: "warning" as const, icon: Clock },
  valide: { label: "Validé", variant: "success" as const, icon: CheckCircle },
  rejete: { label: "Rejeté", variant: "danger" as const, icon: XCircle },
};
