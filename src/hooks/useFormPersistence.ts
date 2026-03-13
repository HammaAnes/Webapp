import { useState, useEffect, useCallback } from 'react';

interface UseFormPersistenceOptions<T> {
  key: string;
  defaultValues?: T;
  enabled?: boolean;
  debounceMs?: number;
}

export function useFormPersistence<T extends Record<string, any>>({
  key,
  defaultValues,
  enabled = true,
  debounceMs = 500,
}: UseFormPersistenceOptions<T>) {
  const storageKey = `form_draft_${key}`;

  const loadFromStorage = useCallback((): T | null => {
    if (!enabled) return null;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.error('Error loading form draft:', error);
    }
    return null;
  }, [storageKey, enabled]);

  const [formData, setFormData] = useState<T>(() => {
    const stored = loadFromStorage();
    return stored || (defaultValues as T);
  });

  useEffect(() => {
    if (!enabled) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving form draft:', error);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [formData, storageKey, enabled, debounceMs]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing form draft:', error);
    }
  }, [storageKey]);

  const resetForm = useCallback(() => {
    setFormData(defaultValues as T);
    clearDraft();
  }, [defaultValues, clearDraft]);

  return {
    formData,
    setFormData,
    clearDraft,
    resetForm,
    hasDraft: loadFromStorage() !== null,
  };
}
