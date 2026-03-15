import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../lib/api-client";
import { mapApiDocument } from "./utils";
import type { CourrierItem, DocumentRecord } from "./types";
import { STATUTS_ACTIFS } from "./constants";

export function useOccupiedBureaux(excludeId?: string) {
  const [occupied, setOccupied] = useState<number[]>([]);

  useEffect(() => {
    apiClient
      .getDomiciliations()
      .then((res) => {
        if (res.success && res.data) {
          const all = (
            Array.isArray(res.data)
              ? res.data
              : ((res.data as Record<string, unknown>).data as unknown[]) || []
          ) as Record<string, unknown>[];
          const nums = all
            .filter(
              (d) =>
                STATUTS_ACTIFS.includes(d.statut as string as typeof STATUTS_ACTIFS[number]) &&
                d.numero_bureau &&
                (!excludeId || String(d.id) !== excludeId)
            )
            .map((d) => Number(d.numero_bureau));
          setOccupied(nums);
        }
      })
      .catch(() => setOccupied([]));
  }, [excludeId]);

  return occupied;
}

export function useCourrier(domiciliationId: string) {
  const [courriers, setCourriers] = useState<CourrierItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiClient.getUserCourrier(domiciliationId);
      const data = r.data as Record<string, unknown> | undefined;
      setCourriers((data?.courriers || []) as CourrierItem[]);
    } catch {
      setCourriers([]);
    } finally {
      setLoading(false);
    }
  }, [domiciliationId]);

  useEffect(() => {
    load();
  }, [load]);

  return { courriers, loading, reload: load };
}

export function useDocuments(domiciliationId: string) {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getDocuments("domiciliation", domiciliationId);
      const data = response.data;
      let raw: Record<string, unknown>[] = [];
      if (Array.isArray(data)) raw = data as Record<string, unknown>[];
      else if (data && typeof data === "object" && "documents" in data)
        raw = ((data as Record<string, unknown>).documents || []) as Record<string, unknown>[];
      setDocs(raw.map(mapApiDocument));
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [domiciliationId]);

  useEffect(() => {
    load();
  }, [load]);

  return { docs, loading, reload: load };
}
