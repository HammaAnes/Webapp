import type { DomiciliationStatut } from './types';

export const TRANSITIONS: Record<DomiciliationStatut, DomiciliationStatut[]> = {
  dossier_preparatoire: ['en_attente_complements', 'en_attente_signature', 'refusee'],
  en_attente_complements: ['en_attente_signature', 'refusee'],
  en_attente_signature: ['domiciliation_creee', 'refusee'],
  domiciliation_creee: ['active', 'en_attente_complements', 'refusee'],
  active: ['resiliee', 'expiree'],
  refusee: [],
  expiree: [],
  resiliee: [],
};

export function canTransition(from: DomiciliationStatut, to: DomiciliationStatut): boolean {
  return TRANSITIONS[from].includes(to);
}

export function getNextStatuts(current: DomiciliationStatut): DomiciliationStatut[] {
  return TRANSITIONS[current];
}

export function isTerminal(statut: DomiciliationStatut): boolean {
  return ['refusee', 'expiree', 'resiliee'].includes(statut);
}

export function isActive(statut: DomiciliationStatut): boolean {
  return statut === 'active';
}

export function isPending(statut: DomiciliationStatut): boolean {
  return ['dossier_preparatoire', 'en_attente_complements', 'en_attente_signature', 'domiciliation_creee'].includes(statut);
}

export interface WorkflowStep {
  key: DomiciliationStatut;
  label: string;
  description: string;
  detail: string;
  order: number;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    key: 'dossier_preparatoire',
    label: 'Dossier soumis',
    description: 'Votre dossier est en cours d\'examen',
    detail: 'Notre équipe examine votre dossier dans les 48h ouvrées',
    order: 0,
  },
  {
    key: 'en_attente_signature',
    label: 'Signature notariale',
    description: 'En attente de la signature chez le notaire',
    detail: 'Un rendez-vous chez le notaire est requis pour finaliser le contrat',
    order: 1,
  },
  {
    key: 'domiciliation_creee',
    label: 'Domiciliation créée',
    description: 'Votre domiciliation a été officiellement créée',
    detail: 'Le contrat est signé et votre adresse est officielle',
    order: 2,
  },
  {
    key: 'active',
    label: 'Service actif',
    description: 'Votre domiciliation est active',
    detail: 'Vous bénéficiez de tous les services souscrits',
    order: 3,
  },
  {
    key: 'expiree',
    label: 'Expirée',
    description: 'Votre contrat a expiré',
    detail: 'Veuillez contacter Coffice pour un renouvellement',
    order: 4,
  },
];

const STEP_ORDER_MAP: Partial<Record<DomiciliationStatut, number>> = {
  dossier_preparatoire: 0,
  en_attente_complements: 0,
  en_attente_signature: 1,
  domiciliation_creee: 2,
  active: 3,
  expiree: 4,
};

export function getStepOrder(statut: DomiciliationStatut): number {
  return STEP_ORDER_MAP[statut] ?? -1;
}

export function getProgressPercent(statut: DomiciliationStatut): number {
  if (isTerminal(statut) && statut !== 'expiree') return 0;
  if (statut === 'en_attente_complements') return 15;
  const order = getStepOrder(statut);
  if (order < 0) return 0;
  const nonTerminalSteps = WORKFLOW_STEPS.length - 1;
  return Math.round(((order + 1) / nonTerminalSteps) * 100);
}

export interface StatutMeta {
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  gradient: string;
  badgeVariant: 'warning' | 'success' | 'danger' | 'neutral' | 'info' | 'accent';
  step: number;
}

export function getStatutMeta(statut: DomiciliationStatut): StatutMeta {
  const map: Record<DomiciliationStatut, StatutMeta> = {
    dossier_preparatoire: {
      label: 'Dossier préparatoire',
      description: 'En cours d\'examen par notre équipe',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      gradient: 'from-amber-500 to-orange-500',
      badgeVariant: 'warning',
      step: 0,
    },
    en_attente_complements: {
      label: 'En attente de compléments',
      description: 'Des informations supplémentaires sont demandées',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      gradient: 'from-amber-500 to-orange-500',
      badgeVariant: 'warning',
      step: 0,
    },
    en_attente_signature: {
      label: 'En attente de signature',
      description: 'Signature notariale requise',
      color: 'text-sky-700',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      gradient: 'from-sky-500 to-blue-500',
      badgeVariant: 'info',
      step: 1,
    },
    domiciliation_creee: {
      label: 'Domiciliation créée',
      description: 'Contrat signé, activation en cours',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      gradient: 'from-blue-500 to-sky-500',
      badgeVariant: 'info',
      step: 2,
    },
    active: {
      label: 'Active',
      description: 'Service de domiciliation actif',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      gradient: 'from-emerald-500 to-green-500',
      badgeVariant: 'success',
      step: 3,
    },
    refusee: {
      label: 'Refusée',
      description: 'Demande refusée',
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      gradient: 'from-red-500 to-rose-500',
      badgeVariant: 'danger',
      step: -1,
    },
    expiree: {
      label: 'Expirée',
      description: 'Contrat expiré',
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      gradient: 'from-gray-400 to-gray-500',
      badgeVariant: 'neutral',
      step: 4,
    },
    resiliee: {
      label: 'Résiliée',
      description: 'Domiciliation résiliée',
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      gradient: 'from-red-500 to-rose-500',
      badgeVariant: 'danger',
      step: -1,
    },
  };
  return map[statut];
}
