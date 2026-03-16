import type { DemandeDomiciliation } from '../../types';
import type { DocumentRecord, CourrierItem } from '../domain/types';
import { domiciliationAdapter } from '../../adapters/index';

function str(v: unknown): string {
  return v != null ? String(v) : '';
}

function strOrUndefined(v: unknown): string | undefined {
  return v != null && v !== '' ? String(v) : undefined;
}

function numOrUndefined(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export function fromAPI(raw: Record<string, unknown>): DemandeDomiciliation {
  return domiciliationAdapter.fromAPI(raw);
}

export function toAPI(data: Partial<DemandeDomiciliation>): Record<string, unknown> {
  return domiciliationAdapter.toAPI(data);
}

export function documentFromAPI(raw: Record<string, unknown>): DocumentRecord {
  return {
    id: str(raw.id),
    documentType: str(raw.document_type ?? raw.type),
    fileName: str(raw.file_name ?? raw.nom_fichier ?? raw.fileName),
    fileSize: numOrUndefined(raw.file_size ?? raw.taille),
    createdAt: str(raw.created_at ?? raw.date_upload),
    url: strOrUndefined(raw.url ?? raw.file_url),
    status: (raw.status ?? raw.statut ?? 'en_attente') as DocumentRecord['status'],
    commentaireRejet: strOrUndefined(raw.commentaire_rejet),
  };
}

export function courrierFromAPI(raw: Record<string, unknown>): CourrierItem {
  return {
    id: str(raw.id),
    type: (raw.type ?? 'autre') as CourrierItem['type'],
    expediteur: str(raw.expediteur),
    description: str(raw.description ?? raw.objet ?? ''),
    statut: (raw.statut ?? 'recu') as CourrierItem['statut'],
    dateReception: str(raw.date_reception ?? raw.created_at),
    dateRetrait: strOrUndefined(raw.date_retrait),
    instructionClient: strOrUndefined(raw.instruction_client),
  };
}
