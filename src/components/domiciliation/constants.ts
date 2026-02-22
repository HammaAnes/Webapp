import {
  HelpCircle,
  Building,
  User,
  Briefcase,
  FileText,
  Scale,
  Package,
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { LegalFormType, RequiredDocument, StatusInfo, WizardStep } from "./types";

export const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: "Situation", icon: HelpCircle },
  { id: 2, title: "Structure", icon: Building },
  { id: 3, title: "Dirigeant", icon: User },
  { id: 4, title: "Entreprise", icon: Briefcase },
  { id: 5, title: "Documents", icon: FileText },
  { id: 6, title: "CGU", icon: Scale },
  { id: 7, title: "Options", icon: Package },
  { id: 8, title: "Confirmation", icon: FileCheck },
];

export const TOTAL_STEPS = WIZARD_STEPS.length;

export const WORKFLOW_STEPS = [
  { key: "dossier_preparatoire", label: "Dossier preparatoire", description: "Votre dossier est en cours d'examen" },
  { key: "en_attente_signature", label: "Attente signature", description: "Rendez-vous chez le notaire" },
  { key: "domiciliation_creee", label: "Domiciliation creee", description: "Juridiquement creee" },
  { key: "en_attente_complements", label: "Complements requis", description: "Completez les informations" },
  { key: "active", label: "Active", description: "Pleinement operationnelle" },
];

export const CGU_TEXT = `CONDITIONS GENERALES DE DOMICILIATION

Article 1 - Objet
Le present contrat a pour objet la mise a disposition d'une adresse professionnelle au sein de l'espace Coffice, situe au 4eme etage du Mohammadia Mall, Bureau 1178, Alger.

Article 2 - Duree
Le contrat de domiciliation est conclu pour une duree minimale de six (6) mois, renouvelable par tacite reconduction.

Article 3 - Services inclus
- Attribution d'une adresse legale et commerciale
- Reception et conservation du courrier
- Notification de reception de courrier par email
- Acces aux informations legales de l'entreprise domiciliee

Article 4 - Obligations du domicilie
Le domicilie s'engage a:
- Fournir des informations exactes et a jour
- Respecter la reglementation en vigueur
- Payer les redevances aux echeances convenues
- Informer le domiciliataire de tout changement de situation

Article 5 - Obligations du domiciliataire
Coffice s'engage a:
- Mettre a disposition l'adresse de domiciliation
- Conserver le courrier pendant une duree de 3 mois
- Notifier la reception de courrier sous 24h ouvrees
- Respecter la confidentialite des informations

Article 6 - Tarification
Les tarifs sont definis selon la grille en vigueur au moment de la signature du contrat.

Article 7 - Resiliation
Chaque partie peut resilier le contrat avec un preavis de 30 jours. En cas de non-paiement, le contrat peut etre resilie sans preavis.

Article 8 - Responsabilite
Coffice ne peut etre tenu responsable des pertes ou dommages lies au courrier apres un delai de conservation de 3 mois.

Article 9 - Loi applicable
Le present contrat est soumis au droit algerien. Tout litige sera soumis aux tribunaux competents d'Alger.`;

export const REQUIRED_DOCS_NEW_SOCIETE: RequiredDocument[] = [
  { id: "cni", name: "Carte Nationale d'Identite (CNI)", description: "Du futur gerant", required: true },
  { id: "extrait_naissance", name: "Extrait de naissance", description: "Du futur gerant", required: true },
  { id: "reservation_denomination", name: "Document de reservation de la denomination (CNRC)", description: "A obtenir aupres du CNRC au 5eme etage du Mohammadia Mall", required: true },
];

export const REQUIRED_DOCS_NEW_AUTO_ENTREPRENEUR: RequiredDocument[] = [
  { id: "cni", name: "Carte Nationale d'Identite (CNI)", description: "De l'auto-entrepreneur", required: true },
];

export const REQUIRED_DOCS_EXISTING_SOCIETE: RequiredDocument[] = [
  { id: "registre_commerce", name: "Registre de commerce", required: true },
  { id: "statuts", name: "Statuts de la societe", required: true },
  { id: "cni_gerant", name: "Carte Nationale d'Identite du gerant", required: true },
  { id: "extrait_naissance_gerant", name: "Extrait de naissance du gerant", required: true },
];

export const REQUIRED_DOCS_EXISTING_AUTO_ENTREPRENEUR: RequiredDocument[] = [
  { id: "carte_auto_entrepreneur", name: "Carte d'auto-entrepreneur", required: true },
  { id: "cni", name: "Carte Nationale d'Identite", required: true },
];

export const LEGAL_FORM_OPTIONS = [
  { value: "SARL", label: "SARL - Societe a Responsabilite Limitee" },
  { value: "EURL", label: "EURL - Entreprise Unipersonnelle" },
  { value: "SPA", label: "SPA - Societe Par Actions" },
  { value: "SNC", label: "SNC - Societe en Nom Collectif" },
  { value: "SCS", label: "SCS - Societe en Commandite Simple" },
  { value: "Startup", label: "Startup (Loi Startup Act)" },
];

export const LEGAL_FORM_OPTIONS_SHORT = [
  { value: "SARL", label: "SARL" },
  { value: "EURL", label: "EURL" },
  { value: "SPA", label: "SPA" },
  { value: "SNC", label: "SNC" },
  { value: "SCS", label: "SCS" },
  { value: "Startup", label: "Startup" },
];

export const mapTypeEntrepriseToFormeJuridique = (type?: string): LegalFormType => {
  const map: Record<string, LegalFormType> = {
    sarl: "SARL",
    eurl: "EURL",
    spa: "SPA",
    snc: "SNC",
    scs: "SCS",
    startup: "Startup",
  };
  return map[type?.toLowerCase() || ""] || "";
};

export const getRequiredDocuments = (
  situation: "en_cours_creation" | "deja_creee" | null,
  typeStructure: "societe" | "auto_entrepreneur" | null
): RequiredDocument[] => {
  if (situation === "en_cours_creation") {
    return typeStructure === "societe"
      ? REQUIRED_DOCS_NEW_SOCIETE
      : REQUIRED_DOCS_NEW_AUTO_ENTREPRENEUR;
  }
  return typeStructure === "societe"
    ? REQUIRED_DOCS_EXISTING_SOCIETE
    : REQUIRED_DOCS_EXISTING_AUTO_ENTREPRENEUR;
};

export const getStatusInfo = (statut: string): StatusInfo => {
  switch (statut) {
    case "dossier_preparatoire":
      return {
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-gradient-to-br from-amber-50 to-orange-50",
        border: "border-amber-200",
        gradient: "from-amber-500 to-orange-500",
        label: "Dossier preparatoire",
        description: "Votre dossier est en preparation. Il sera transmis pour validation.",
      };
    case "en_attente_signature":
      return {
        icon: Scale,
        color: "text-sky-600",
        bg: "bg-gradient-to-br from-sky-50 to-cyan-50",
        border: "border-sky-200",
        gradient: "from-sky-500 to-cyan-500",
        label: "En attente de signature notariale",
        description: "Votre dossier est valide. Rendez-vous chez le notaire pour signer le contrat de domiciliation.",
      };
    case "domiciliation_creee":
      return {
        icon: CheckCircle,
        color: "text-teal-600",
        bg: "bg-gradient-to-br from-teal-50 to-emerald-50",
        border: "border-teal-200",
        gradient: "from-teal-500 to-emerald-500",
        label: "Domiciliation creee",
        description: "Votre domiciliation est juridiquement creee. Completez les informations administratives.",
      };
    case "en_attente_complements":
      return {
        icon: FileText,
        color: "text-amber-600",
        bg: "bg-gradient-to-br from-amber-50 to-yellow-50",
        border: "border-amber-200",
        gradient: "from-amber-500 to-yellow-500",
        label: "En attente de complements",
        description: "Veuillez completer les informations administratives de votre dossier.",
      };
    case "active":
      return {
        icon: CheckCircle,
        color: "text-emerald-600",
        bg: "bg-gradient-to-br from-emerald-50 to-green-50",
        border: "border-emerald-200",
        gradient: "from-emerald-500 to-green-500",
        label: "Domiciliation active",
        description: "Votre domiciliation est active. Vous pouvez utiliser l'adresse du Mohammadia Mall.",
      };
    case "refusee":
      return {
        icon: XCircle,
        color: "text-red-600",
        bg: "bg-gradient-to-br from-red-50 to-rose-50",
        border: "border-red-200",
        gradient: "from-red-500 to-rose-500",
        label: "Demande refusee",
        description: "Votre demande n'a pas ete acceptee. Consultez le commentaire pour plus de details.",
      };
    case "expiree":
      return {
        icon: AlertCircle,
        color: "text-orange-600",
        bg: "bg-gradient-to-br from-orange-50 to-amber-50",
        border: "border-orange-200",
        gradient: "from-orange-500 to-amber-500",
        label: "Domiciliation expiree",
        description: "Votre contrat de domiciliation a expire. Contactez-nous pour le renouveler.",
      };
    case "resiliee":
      return {
        icon: XCircle,
        color: "text-gray-600",
        bg: "bg-gradient-to-br from-gray-50 to-slate-50",
        border: "border-gray-300",
        gradient: "from-gray-500 to-slate-500",
        label: "Domiciliation resiliee",
        description: "Votre contrat de domiciliation a ete resilie.",
      };
    default:
      return {
        icon: AlertCircle,
        color: "text-gray-600",
        bg: "bg-gray-50",
        border: "border-gray-200",
        gradient: "from-gray-500 to-gray-600",
        label: "Statut inconnu",
        description: "",
      };
  }
};

export const getStepIndex = (statut: string): number => {
  if (statut === "refusee" || statut === "resiliee" || statut === "expiree") return -1;
  if (statut === "en_attente_complements") return 3;
  const idx = WORKFLOW_STEPS.findIndex(s => s.key === statut);
  return idx >= 0 ? idx : 0;
};

export const getCasLabel = (
  situation: "en_cours_creation" | "deja_creee" | null,
  typeStructure: "societe" | "auto_entrepreneur" | null
): string => {
  if (situation === "en_cours_creation") {
    return typeStructure === "societe" ? "CAS A1" : "CAS A2";
  }
  return typeStructure === "societe" ? "CAS B1" : "CAS B2";
};

export const BENEFITS = [
  {
    title: "Adresse prestigieuse",
    description: "Mohammadia Mall, 4eme etage, Bureau 1178, Alger",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Services inclus",
    description: "Reception courrier, salle de reunion, assistance",
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    title: "Validation rapide",
    description: "Traitement sous 48h ouvrees",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];

export const OFFER_ITEMS = [
  "Adresse commerciale officielle",
  "Reception du courrier",
  "Salle de reunion (2h/mois)",
  "Assistance administrative",
];

export const OPTIONS_PRICING: Record<string, { label: string; price: number; description: string; included?: boolean }> = {
  domiciliationSimple: { label: "Domiciliation simple", price: 0, description: "Adresse legale et commerciale", included: true },
  receptionCourrier: { label: "Reception courrier", price: 2000, description: "Reception et conservation de votre courrier" },
  scanNotificationEmail: { label: "Scan & notification email", price: 3000, description: "Numerisation et notification par email a chaque reception" },
  reexpeditionCourrier: { label: "Reexpedition courrier", price: 5000, description: "Reexpedition de votre courrier a une adresse de votre choix" },
  accesPonctuelEspaces: { label: "Acces ponctuel espaces", price: 4000, description: "Acces aux espaces de coworking (2 demi-journees/mois)" },
};

export const BASE_MONTHLY_PRICE = 12000;

export const calculateTotalMonthly = (options: Record<string, boolean>): number => {
  let total = BASE_MONTHLY_PRICE;
  Object.entries(options).forEach(([key, enabled]) => {
    if (enabled && OPTIONS_PRICING[key] && !OPTIONS_PRICING[key].included) {
      total += OPTIONS_PRICING[key].price;
    }
  });
  return total;
};

export const INITIAL_FORM_DATA = (user?: { nom?: string; prenom?: string; telephone?: string; email?: string }): import("./types").DomiciliationFormData => ({
  denominationSociale: "",
  formeJuridique: "",
  nif: "",
  nis: "",
  registreCommerce: "",
  articleImposition: "",
  codeNae: "",
  activiteExercee: "",
  descriptionActivite: "",
  numeroAutoEntrepreneur: "",
  dateCreationEntreprise: null,
  villeImmatriculation: "",
  dateInscriptionAutoEntrepreneur: null,
  dirigeant: {
    nom: user?.nom || "",
    prenom: user?.prenom || "",
    telephone: user?.telephone || "",
    email: user?.email || "",
    adresseResidence: "",
    ville: "",
  },
  dateDebutSouhaitee: null,
  cguAcceptees: false,
  options: {
    domiciliationSimple: true,
    receptionCourrier: false,
    scanNotificationEmail: false,
    reexpeditionCourrier: false,
    accesPonctuelEspaces: false,
  },
});
