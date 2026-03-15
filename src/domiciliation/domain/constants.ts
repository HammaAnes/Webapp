import type { LegalForm, SituationAdministrative, TypeStructure, RequiredDocument, DocumentSlot } from './types';

export interface LegalFormOption {
  value: LegalForm;
  label: string;
  shortLabel: string;
}

export const LEGAL_FORMS: LegalFormOption[] = [
  { value: 'SARL', label: 'SARL — Société à Responsabilité Limitée', shortLabel: 'SARL' },
  { value: 'EURL', label: 'EURL — Entreprise Unipersonnelle à Responsabilité Limitée', shortLabel: 'EURL' },
  { value: 'SPA', label: 'SPA — Société Par Actions', shortLabel: 'SPA' },
  { value: 'SNC', label: 'SNC — Société en Nom Collectif', shortLabel: 'SNC' },
  { value: 'SCS', label: 'SCS — Société en Commandite Simple', shortLabel: 'SCS' },
  { value: 'Startup', label: 'Startup — Label Startup Algérie', shortLabel: 'Startup' },
];

export function mapTypeEntrepriseToFormeJuridique(type: string): LegalForm | '' {
  const map: Record<string, LegalForm> = {
    sarl: 'SARL',
    eurl: 'EURL',
    spa: 'SPA',
    snc: 'SNC',
    scs: 'SCS',
  };
  return map[type.toLowerCase()] ?? '';
}

const DOCS_A1: RequiredDocument[] = [
  { id: 'cni', name: 'Carte Nationale d\'Identité (CNI)', description: 'Du futur gérant', required: true },
  { id: 'extrait_naissance', name: 'Extrait de naissance', description: 'Du futur gérant', required: true },
  { id: 'reservation_denomination', name: 'Réservation dénomination (CNRC)', description: 'Peut être faite sur place au CNRC (5ème étage)', required: false },
];

const DOCS_A2: RequiredDocument[] = [
  { id: 'cni', name: 'Carte Nationale d\'Identité (CNI)', description: 'De l\'auto-entrepreneur', required: true },
];

const DOCS_B1: RequiredDocument[] = [
  { id: 'registre_commerce', name: 'Registre de Commerce (RC)', description: 'Extrait récent', required: true },
  { id: 'c20', name: 'Extrait C20', description: 'Extrait de la balance commerciale', required: true },
  { id: 'statuts', name: 'Statuts de la société', description: 'Version originale signée', required: true },
  { id: 'cni_gerant', name: 'CNI du gérant', description: 'Carte nationale en cours de validité', required: true },
  { id: 'extrait_naissance_gerant', name: 'Extrait de naissance du gérant', description: 'Original ou copie légalisée', required: true },
];

const DOCS_B2: RequiredDocument[] = [
  { id: 'carte_ae', name: 'Carte Auto-Entrepreneur', description: 'En cours de validité', required: true },
  { id: 'cni', name: 'Carte Nationale d\'Identité', description: 'En cours de validité', required: true },
];

export function getRequiredDocuments(
  situation: SituationAdministrative,
  typeStructure: TypeStructure
): RequiredDocument[] {
  if (situation === 'en_cours_creation') {
    return typeStructure === 'societe' ? DOCS_A1 : DOCS_A2;
  }
  return typeStructure === 'societe' ? DOCS_B1 : DOCS_B2;
}

export const SOCIETE_DOC_SLOTS: DocumentSlot[] = [
  { type: 'registre_commerce', label: 'Registre de Commerce (RC)', required: true },
  { type: 'c20', label: 'Extrait C20', required: true },
  { type: 'statuts', label: 'Statuts de la société', required: true },
  { type: 'cni_gerant', label: 'CNI du gérant', required: true },
  { type: 'extrait_naissance_gerant', label: 'Extrait de naissance du gérant', required: true },
  { type: 'autre', label: 'Autre document', required: false },
];

export const AUTO_ENTREPRENEUR_DOC_SLOTS: DocumentSlot[] = [
  { type: 'carte_ae', label: 'Carte Auto-Entrepreneur', required: true },
  { type: 'cni', label: 'Carte Nationale d\'Identité', required: true },
  { type: 'autre', label: 'Autre document', required: false },
];

export function getDocumentSlots(typeStructure: TypeStructure): DocumentSlot[] {
  return typeStructure === 'societe' ? SOCIETE_DOC_SLOTS : AUTO_ENTREPRENEUR_DOC_SLOTS;
}

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

export const COFFICE_ADDRESS = {
  full: 'Mohammadia Mall, 4ème étage, Bureau 1178, Mohammadia, Alger',
  short: 'Mohammadia Mall, Bureau 1178',
  city: 'Alger',
  phone: '+213 23 804 924',
  email: 'desk@coffice.dz',
};

export const MAX_DOMICILIATIONS = 60;
export const ACTIVATION_DELAY = '48h';

export const COURRIER_TYPE_LABELS: Record<string, string> = {
  lettre: 'Lettre',
  colis: 'Colis',
  recommande: 'Recommandé',
  autre: 'Autre',
};

export const COURRIER_STATUT_LABELS: Record<string, string> = {
  recu: 'Reçu',
  notifie: 'Notifié',
  en_attente_instruction: 'En attente d\'instruction',
  recupere: 'Récupéré',
  retire: 'Retiré',
  scanne: 'Scanné',
  reexpedier: 'À réexpédier',
  envoye: 'Envoyé',
  traite: 'Traité',
  archive: 'Archivé',
};

export const STATUTS_ACTIFS: Array<string> = [
  'active',
  'domiciliation_creee',
  'en_attente_complements',
  'en_attente_signature',
  'dossier_preparatoire',
];
