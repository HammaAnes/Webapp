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
  { key: "dossier_preparatoire", label: "Dossier préparatoire", description: "Votre dossier est en cours d'examen" },
  { key: "en_attente_complements", label: "Compléments requis", description: "Complétez les informations" },
  { key: "en_attente_signature", label: "Attente signature", description: "Rendez-vous chez le notaire" },
  { key: "domiciliation_creee", label: "Domiciliation créée", description: "Juridiquement créée" },
  { key: "active", label: "Active", description: "Pleinement opérationnelle" },
];

export const CGU_TEXT = `CONDITIONS GÉNÉRALES DE DOMICILIATION

Article 1 - Objet
Le présent contrat a pour objet la mise à disposition d'une adresse professionnelle au sein de l'espace Coffice, situé au 4ème étage du Mohammadia Mall, Bureau 1178, Alger.

Article 2 - Durée
Le contrat de domiciliation est conclu pour une durée minimale de six (6) mois, renouvelable par tacite reconduction.

Article 3 - Services inclus
- Attribution d'une adresse légale et commerciale
- Réception et conservation du courrier
- Notification de réception de courrier par email
- Accès aux informations légales de l'entreprise domiciliée

Article 4 - Obligations du domicilié
Le domicilié s'engage à :
- Fournir des informations exactes et à jour
- Respecter la réglementation en vigueur
- Payer les redevances aux échéances convenues
- Informer le domiciliataire de tout changement de situation

Article 5 - Obligations du domiciliataire
Coffice s'engage à :
- Mettre à disposition l'adresse de domiciliation
- Conserver le courrier pendant une durée de 3 mois
- Notifier la réception de courrier sous 24h ouvrées
- Respecter la confidentialité des informations

Article 6 - Tarification
Les tarifs sont définis selon la grille en vigueur au moment de la signature du contrat.

Article 7 - Résiliation
Chaque partie peut résilier le contrat avec un préavis de 30 jours. En cas de non-paiement, le contrat peut être résilié sans préavis.

Article 8 - Responsabilité
Coffice ne peut être tenu responsable des pertes ou dommages liés au courrier après un délai de conservation de 3 mois.

Article 9 - Loi applicable
Le présent contrat est soumis au droit algérien. Tout litige sera soumis aux tribunaux compétents d'Alger.`;

export const REQUIRED_DOCS_NEW_SOCIETE: RequiredDocument[] = [
  { id: "cni", name: "Carte Nationale d'Identité (CNI)", description: "Du futur gérant", required: true },
  { id: "extrait_naissance", name: "Extrait de naissance", description: "Du futur gérant", required: true },
  { id: "reservation_denomination", name: "Document de réservation de la dénomination (CNRC)", description: "À obtenir auprès du CNRC au 5ème étage du Mohammadia Mall", required: true },
];

export const REQUIRED_DOCS_NEW_AUTO_ENTREPRENEUR: RequiredDocument[] = [
  { id: "cni", name: "Carte Nationale d'Identité (CNI)", description: "De l'auto-entrepreneur", required: true },
];

export const REQUIRED_DOCS_EXISTING_SOCIETE: RequiredDocument[] = [
  { id: "registre_commerce", name: "Registre de commerce (RC)", required: true },
  { id: "c20", name: "Extrait C20", description: "Extrait du Registre de Commerce format C20", required: true },
  { id: "statuts", name: "Statuts de la société", required: true },
  { id: "cni_gerant", name: "Carte Nationale d'Identité du gérant", required: true },
  { id: "extrait_naissance_gerant", name: "Extrait de naissance du gérant", required: true },
];

export const REQUIRED_DOCS_EXISTING_AUTO_ENTREPRENEUR: RequiredDocument[] = [
  { id: "carte_auto_entrepreneur", name: "Carte d'auto-entrepreneur", required: true },
  { id: "cni", name: "Carte Nationale d'Identité", required: true },
];

export const LEGAL_FORM_OPTIONS = [
  { value: "SARL", label: "SARL - Société à Responsabilité Limitée" },
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
        label: "Dossier préparatoire",
        description: "Votre dossier est en préparation. Il sera transmis pour validation.",
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
        label: "Domiciliation créée",
        description: "Votre domiciliation est juridiquement créée. Complétez les informations administratives.",
      };
    case "en_attente_complements":
      return {
        icon: FileText,
        color: "text-amber-600",
        bg: "bg-gradient-to-br from-amber-50 to-yellow-50",
        border: "border-amber-200",
        gradient: "from-amber-500 to-yellow-500",
        label: "En attente de compléments",
        description: "Veuillez compléter les informations administratives de votre dossier.",
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
        label: "Demande refusée",
        description: "Votre demande n'a pas été acceptée. Consultez le commentaire pour plus de détails.",
      };
    case "expiree":
      return {
        icon: AlertCircle,
        color: "text-orange-600",
        bg: "bg-gradient-to-br from-orange-50 to-amber-50",
        border: "border-orange-200",
        gradient: "from-orange-500 to-amber-500",
        label: "Domiciliation expirée",
        description: "Votre contrat de domiciliation a expiré. Contactez-nous pour le renouveler.",
      };
    case "resiliee":
      return {
        icon: XCircle,
        color: "text-gray-600",
        bg: "bg-gradient-to-br from-gray-50 to-slate-50",
        border: "border-gray-300",
        gradient: "from-gray-500 to-slate-500",
        label: "Domiciliation résiliée",
        description: "Votre contrat de domiciliation a été résilié.",
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
  const ORDER: Record<string, number> = {
    dossier_preparatoire: 0,
    en_attente_complements: 1,
    en_attente_signature: 2,
    domiciliation_creee: 3,
    active: 4,
  };
  return ORDER[statut] ?? 0;
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
    description: "Mohammadia Mall, 4ème étage, Bureau 1178, Alger",
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
    description: "Traitement sous 48h ouvrées",
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
  domiciliationSimple: { label: "Domiciliation simple", price: 0, description: "Adresse légale et commerciale", included: true },
  receptionCourrier: { label: "Réception courrier", price: 2000, description: "Réception et conservation de votre courrier" },
  scanNotificationEmail: { label: "Scan & notification email", price: 3000, description: "Numérisation et notification par email à chaque réception" },
  reexpeditionCourrier: { label: "Réexpédition courrier", price: 5000, description: "Réexpédition de votre courrier à une adresse de votre choix" },
  accesPonctuelEspaces: { label: "Accès ponctuel espaces", price: 4000, description: "Accès aux espaces de coworking (2 demi-journées/mois)" },
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
