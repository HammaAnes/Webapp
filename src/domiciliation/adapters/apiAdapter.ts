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

// Normalise les anciens noms de types de documents vers les noms actuels
const DOC_TYPE_ALIASES: Record<string, string> = {
  rc: 'registre_commerce',
  carte_identite: 'cni',
};

function normalizeDocType(raw: string): string {
  return DOC_TYPE_ALIASES[raw] ?? raw;
}

export function fromAPI(raw: Record<string, unknown>): DemandeDomiciliation {
  return domiciliationAdapter.fromAPI(raw);
}

export function toAPI(data: Partial<DemandeDomiciliation>): Record<string, unknown> {
  return domiciliationAdapter.toAPI(data);
}

export function documentFromAPI(raw: Record<string, unknown>): DocumentRecord {
  const rawType = str(raw.type_document ?? raw.document_type ?? raw.documentType ?? raw.type ?? 'autre');
  return {
    id: str(raw.id),
    documentType: normalizeDocType(rawType),
    fileName: str(raw.nom_original ?? raw.nom_fichier ?? raw.file_name ?? raw.fileName),
    fileSize: numOrUndefined(raw.taille ?? raw.file_size ?? raw.fileSize),
    createdAt: str(raw.created_at ?? raw.uploaded_at ?? raw.createdAt ?? raw.date_upload),
    url: strOrUndefined(raw.download_url ?? raw.url ?? raw.file_url),
    status: ((raw.statut ?? raw.status ?? 'en_attente') as DocumentRecord['status']),
    commentaireRejet: strOrUndefined(raw.commentaire_rejet ?? raw.commentaireRejet),
  };
}

export function courrierFromAPI(raw: Record<string, unknown>): CourrierItem {
  return {
    id: str(raw.id),
    type: (raw.type ?? 'autre') as CourrierItem['type'],
    expediteur: str(raw.expediteur),
    description: strOrUndefined(raw.description ?? raw.objet),
    statut: (raw.statut ?? 'recu') as CourrierItem['statut'],
    dateReception: str(raw.date_reception ?? raw.dateReception ?? raw.created_at),
    dateRetrait: strOrUndefined(raw.date_retrait),
    dateTraitement: strOrUndefined(raw.date_traitement),
    notesAdmin: strOrUndefined(raw.notes_admin),
    instructionClient: strOrUndefined(raw.instruction_client),
  };
}

// Aliases for features/domiciliation/utils consumers
export { documentFromAPI as mapApiDocument, courrierFromAPI as mapApiCourrier };
