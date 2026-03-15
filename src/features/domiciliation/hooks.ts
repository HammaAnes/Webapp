import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "../../lib/api-client";
import { mapApiDocument, mapApiCourrier } from "./utils";
import type { CourrierItem, DocumentRecord } from "./types";
import { STATUTS_ACTIFS } from "./constants";

export function useOccupiedBureaux(excludeId?: string) {
  const [occupied, setOccupied] = useState<number[]>([]);
  const excludeIdRef = useRef(excludeId);
  excludeIdRef.current = excludeId;

  const load = useCallback(async () => {
    try {
      const res = await apiClient.getDomiciliations();
      if (res.success && res.data) {
        const all = (
          Array.isArray(res.data)
            ? res.data
            : ((res.data as Record<string, unknown>).data as unknown[]) || []
        ) as Record<string, unknown>[];
        const nums = all
          .filter(
            (d) =>
              STATUTS_ACTIFS.includes(
                d.statut as string as (typeof STATUTS_ACTIFS)[number]
              ) &&
              d.numero_bureau &&
              (!excludeIdRef.current || String(d.id) !== excludeIdRef.current)
          )
          .map((d) => Number(d.numero_bureau));
        setOccupied(nums);
      }
    } catch {
      setOccupied([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, excludeId]);

  return occupied;
}

export function useCourrier(domiciliationId: string) {
  const [courriers, setCourriers] = useState<CourrierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiClient.getUserCourrier(domiciliationId);
      const data = r.data as Record<string, unknown> | unknown[] | undefined;
      let raw: Record<string, unknown>[] = [];
      if (Array.isArray(data)) {
        raw = data as Record<string, unknown>[];
      } else if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        raw = (Array.isArray(d.courriers) ? d.courriers : []) as Record<string, unknown>[];
      }
      setCourriers(raw.map(mapApiCourrier));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
      setCourriers([]);
    } finally {
      setLoading(false);
    }
  }, [domiciliationId]);

  useEffect(() => {
    load();
  }, [load]);

  return { courriers, loading, error, reload: load };
}

export function useDocuments(domiciliationId: string) {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getDocuments("domiciliation", domiciliationId);
      const data = response.data;
      let raw: Record<string, unknown>[] = [];
      if (Array.isArray(data)) {
        raw = data as Record<string, unknown>[];
      } else if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        raw = (Array.isArray(d.documents) ? d.documents : []) as Record<string, unknown>[];
      }
      setDocs(raw.map(mapApiDocument));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [domiciliationId]);

  useEffect(() => {
    load();
  }, [load]);

  return { docs, loading, error, reload: load };
}
