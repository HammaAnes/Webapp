import { useCallback, useRef } from 'react';
import type { WizardFormData } from '../domain/types';

interface DraftState {
  formData: WizardFormData;
  step: number;
}

function reviveDates(data: WizardFormData): WizardFormData {
  const revived = { ...data };
  if (revived.dateDebutSouhaitee && typeof revived.dateDebutSouhaitee === 'string') {
    revived.dateDebutSouhaitee = new Date(revived.dateDebutSouhaitee);
  }
  if (revived.entreprise) {
    const e = revived.entreprise as Record<string, unknown>;
    if (e.dateCreationEntreprise && typeof e.dateCreationEntreprise === 'string') {
      e.dateCreationEntreprise = new Date(e.dateCreationEntreprise as string);
    }
    if (e.dateInscriptionAutoEntrepreneur && typeof e.dateInscriptionAutoEntrepreneur === 'string') {
      e.dateInscriptionAutoEntrepreneur = new Date(e.dateInscriptionAutoEntrepreneur as string);
    }
    revived.entreprise = e as WizardFormData['entreprise'];
  }
  return revived;
}

export function useDraft(userId: string) {
  const key = `coffice_dom_draft_${userId}`;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback((state: DraftState) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        // storage full or unavailable
      }
    }, 300);
  }, [key]);

  const load = useCallback((): DraftState | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DraftState;
      parsed.formData = reviveDates(parsed.formData);
      return parsed;
    } catch {
      return null;
    }
  }, [key]);

  const clear = useCallback(() => {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  }, [key]);

  const hasDraft = useCallback((): boolean => {
    try { return !!localStorage.getItem(key); } catch { return false; }
  }, [key]);

  return { save, load, clear, hasDraft };
}
