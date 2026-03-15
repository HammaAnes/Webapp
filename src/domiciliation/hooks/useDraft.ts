import { useCallback, useRef } from 'react';
import type { WizardFormData } from '../domain/types';

interface DraftData {
  formData: WizardFormData;
  step: number;
  savedAt: string;
}

function reviveDates(formData: WizardFormData): WizardFormData {
  const revived = { ...formData };

  if (revived.dateDebutSouhaitee && typeof revived.dateDebutSouhaitee === 'string') {
    revived.dateDebutSouhaitee = new Date(revived.dateDebutSouhaitee);
  }

  if (revived.entreprise) {
    const e = { ...revived.entreprise } as Record<string, unknown>;
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
  const key = `coffice_wizard_draft_${userId}`;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (formData: WizardFormData, step: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        try {
          const draft: DraftData = { formData, step, savedAt: new Date().toISOString() };
          localStorage.setItem(key, JSON.stringify(draft));
        } catch {
        }
      }, 300);
    },
    [key]
  );

  const load = useCallback((): { formData: WizardFormData; step: number } | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const draft = JSON.parse(raw) as DraftData;
      if (!draft.formData) return null;
      return {
        formData: reviveDates(draft.formData),
        step: draft.step ?? 1,
      };
    } catch {
      return null;
    }
  }, [key]);

  const clear = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  const hasDraft = useCallback((): boolean => {
    return localStorage.getItem(key) !== null;
  }, [key]);

  return { save, load, clear, hasDraft };
}
