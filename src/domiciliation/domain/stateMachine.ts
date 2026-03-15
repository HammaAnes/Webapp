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
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStatuts(current: DomiciliationStatut): DomiciliationStatut[] {
  return TRANSITIONS[current] ?? [];
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
    label: 'Dossier préparatoire',
    description: 'Votre dossier est en cours d\'examen',
    detail: 'Coffice examine votre dossier sous 24–48h ouvrées',
    order: 1,
  },
  {
    key: 'en_attente_signature',
    label: 'Attente signature',
    description: 'Rendez-vous chez le notaire',
    detail: 'Dossier validé — passage chez le notaire requis',
    order: 2,
  },
  {
    key: 'domiciliation_creee',
    label: 'Domiciliation créée',
    description: 'Juridiquement constituée',
    detail: 'Domiciliation officielle créée, activation en cours',
    order: 3,
  },
  {
    key: 'active',
    label: 'Active',
    description: 'Pleinement opérationnelle',
    detail: 'Service actif — courrier, scan et accès disponibles',
    order: 4,
  },
];

export function getStepOrder(statut: DomiciliationStatut): number {
  if (statut === 'en_attente_complements') return 1;
  const step = WORKFLOW_STEPS.find((s) => s.key === statut);
  return step?.order ?? 0;
}

export function getProgressPercent(statut: DomiciliationStatut): number {
  if (isTerminal(statut)) return 0;
  const order = getStepOrder(statut);
  return Math.round((order / WORKFLOW_STEPS.length) * 100);
}

export interface StatutMeta {
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  gradient: string;
  badgeVariant: 'warning' | 'success' | 'danger' | 'neutral' | 'info';
}

export function getStatutMeta(statut: DomiciliationStatut): StatutMeta {
  const map: Record<DomiciliationStatut, StatutMeta> = {
    dossier_preparatoire: {
      label: 'Dossier préparatoire',
      description: 'Votre dossier est en cours d\'examen par notre équipe',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      gradient: 'from-amber-500 to-orange-500',
      badgeVariant: 'warning',
    },
    en_attente_complements: {
      label: 'En attente de compléments',
      description: 'Des informations complémentaires sont requises',
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      gradient: 'from-orange-500 to-amber-500',
      badgeVariant: 'warning',
    },
    en_attente_signature: {
      label: 'En attente de signature',
      description: 'Rendez-vous chez le notaire requis',
      color: 'text-sky-700',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      gradient: 'from-sky-500 to-blue-500',
      badgeVariant: 'info',
    },
    domiciliation_creee: {
      label: 'Domiciliation créée',
      description: 'Domiciliation juridiquement constituée',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      gradient: 'from-blue-500 to-sky-500',
      badgeVariant: 'info',
    },
    active: {
      label: 'Active',
      description: 'Service pleinement opérationnel',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      gradient: 'from-emerald-500 to-teal-500',
      badgeVariant: 'success',
    },
    refusee: {
      label: 'Refusée',
      description: 'Demande refusée par Coffice',
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      gradient: 'from-red-500 to-rose-500',
      badgeVariant: 'danger',
    },
    expiree: {
      label: 'Expirée',
      description: 'Contrat arrivé à expiration',
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      gradient: 'from-gray-400 to-gray-500',
      badgeVariant: 'neutral',
    },
    resiliee: {
      label: 'Résiliée',
      description: 'Domiciliation résiliée',
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      gradient: 'from-red-500 to-rose-500',
      badgeVariant: 'danger',
    },
  };
  return map[statut];
}
