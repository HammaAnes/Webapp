import type { DocumentSlot, LegalForm, CasMetier } from './types';
import { getCasMetier } from './types';
import type { DomiciliationOptions } from '../../types';

export const MAX_DOMICILIATIONS = 60;
export const ACTIVATION_DELAY = '48h';

export const DEFAULT_OPTIONS: DomiciliationOptions = {
  domiciliationSimple: true,
  receptionCourrier: false,
  scanNotificationEmail: false,
  reexpeditionCourrier: false,
  accesPonctuelEspaces: false,
};

export const COFFICE_ADDRESS = {
  full: 'Mohammadia Mall, 4ème étage, Bureau 1178, Alger',
  short: 'Mohammadia Mall, Bureau 1178',
  city: 'Alger, Algérie',
  phone: '+213 XX XX XX XX',
  email: 'domiciliation@coffice.dz',
};

export interface LegalFormOption {
  value: LegalForm;
  label: string;
  shortLabel: string;
}

export const LEGAL_FORMS: LegalFormOption[] = [
  { value: 'SARL', label: 'SARL — Société à Responsabilité Limitée', shortLabel: 'SARL' },
  { value: 'EURL', label: 'EURL — Entreprise Unipersonnelle à RL', shortLabel: 'EURL' },
  { value: 'SPA', label: 'SPA — Société par Actions', shortLabel: 'SPA' },
  { value: 'SNC', label: 'SNC — Société en Nom Collectif', shortLabel: 'SNC' },
  { value: 'SCS', label: 'SCS — Société en Commandite Simple', shortLabel: 'SCS' },
  { value: 'Startup', label: 'Startup labellisée', shortLabel: 'Startup' },
];

export function mapTypeEntrepriseToFormeJuridique(typeEntreprise?: string): LegalForm | '' {
  const map: Record<string, LegalForm> = {
    sarl: 'SARL',
    eurl: 'EURL',
    spa: 'SPA',
    snc: 'SNC',
    scs: 'SCS',
    startup: 'Startup',
  };
  if (!typeEntreprise) return '';
  return map[typeEntreprise.toLowerCase()] ?? '';
}

export interface RequiredDocConfig {
  id: string;
  name: string;
  description?: string;
  required: boolean;
}

const DOCS_A1: RequiredDocConfig[] = [
  { id: 'cni', name: 'Carte Nationale d\'Identité', description: 'CNI du futur gérant en cours de validité', required: true },
  { id: 'extrait_naissance', name: 'Extrait de naissance', description: 'Extrait de naissance du futur gérant', required: true },
  { id: 'reservation_denomination', name: 'Réservation dénomination (CNRC)', description: 'Attestation de réservation de dénomination au CNRC', required: false },
];

const DOCS_A2: RequiredDocConfig[] = [
  { id: 'cni', name: 'Carte Nationale d\'Identité', description: 'CNI de l\'auto-entrepreneur en cours de validité', required: true },
];

const DOCS_B1: RequiredDocConfig[] = [
  { id: 'registre_commerce', name: 'Registre de Commerce (RC)', description: 'Extrait du registre de commerce', required: true },
  { id: 'c20', name: 'Extrait C20', description: 'Extrait C20 de la société', required: true },
  { id: 'statuts', name: 'Statuts de la société', description: 'Statuts signés et légalisés', required: true },
  { id: 'cni_gerant', name: 'CNI du gérant', description: 'Carte nationale d\'identité du gérant', required: true },
  { id: 'extrait_naissance_gerant', name: 'Extrait de naissance du gérant', description: 'Extrait de naissance du gérant', required: true },
];

const DOCS_B2: RequiredDocConfig[] = [
  { id: 'carte_ae', name: 'Carte Auto-Entrepreneur', description: 'Carte officielle auto-entrepreneur', required: true },
  { id: 'cni', name: 'Carte Nationale d\'Identité', description: 'CNI en cours de validité', required: true },
];

export function getRequiredDocuments(
  situation: 'en_cours_creation' | 'deja_creee',
  typeStructure: 'societe' | 'auto_entrepreneur'
): RequiredDocConfig[] {
  const cas = getCasMetier(situation, typeStructure);
  return { A1: DOCS_A1, A2: DOCS_A2, B1: DOCS_B1, B2: DOCS_B2 }[cas];
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

export function getDocumentSlots(typeStructure: 'societe' | 'auto_entrepreneur'): DocumentSlot[] {
  return typeStructure === 'societe' ? SOCIETE_DOC_SLOTS : AUTO_ENTREPRENEUR_DOC_SLOTS;
}

export const CGU_TEXT = `
ARTICLE 1 — OBJET DU CONTRAT
Le présent contrat a pour objet de définir les conditions dans lesquelles Coffice, ci-après désigné "le Prestataire", fournit un service de domiciliation commerciale à l'entreprise cliente, ci-après désignée "le Client".

ARTICLE 2 — DESCRIPTION DU SERVICE
Le Prestataire met à disposition du Client l'adresse de son établissement (Mohammadia Mall, 4ème étage, Bureau 1178, Alger) en tant que siège social officiel. Ce service inclut la réception du courrier selon les options souscrites.

ARTICLE 3 — DURÉE DU CONTRAT
Le contrat est conclu pour une durée minimale de 6 mois, renouvelable par tacite reconduction. Toute résiliation doit être notifiée par écrit avec un préavis minimum de 30 jours.

ARTICLE 4 — CONDITIONS TARIFAIRES
Le montant mensuel est fixé selon les options souscrites. Toute modification tarifaire sera notifiée au Client 30 jours avant application.

ARTICLE 5 — OBLIGATIONS DU PRESTATAIRE
Le Prestataire s'engage à : assurer la réception du courrier aux heures d'ouverture, notifier le Client des courriers reçus selon l'option souscrite, maintenir la confidentialité des informations du Client, et mettre à disposition un espace de travail selon les options souscrites.

ARTICLE 6 — OBLIGATIONS DU CLIENT
Le Client s'engage à : utiliser l'adresse de domiciliation uniquement pour son activité légalement déclarée, informer le Prestataire de tout changement de situation juridique, régler les factures dans les délais convenus, et ne pas utiliser l'adresse à des fins frauduleuses ou illicites.

ARTICLE 7 — DOCUMENTS REQUIS
Le Client s'engage à fournir tous les documents légaux requis par la réglementation algérienne en vigueur concernant la domiciliation commerciale. Le non-respect de cette obligation peut entraîner la résiliation du contrat.

ARTICLE 8 — RÉSILIATION
Le contrat peut être résilié par l'une ou l'autre des parties avec un préavis de 30 jours. En cas de non-paiement ou de violation des conditions, le Prestataire peut résilier immédiatement le contrat après mise en demeure.

ARTICLE 9 — LOI APPLICABLE
Le présent contrat est soumis au droit algérien. Tout litige sera soumis aux tribunaux compétents d'Alger.
`.trim();
