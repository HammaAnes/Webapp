import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

interface UseFormPersistenceOptions<T> {
  key: string;
  defaultValues?: T;
  enabled?: boolean;
  debounceMs?: number;
}

export function useFormPersistence<T extends Record<string, unknown>>({
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
      logger.warn('Error loading form draft:', error instanceof Error ? error.message : String(error));
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
        logger.warn('Error saving form draft:', error instanceof Error ? error.message : String(error));
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [formData, storageKey, enabled, debounceMs]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      logger.warn('Error clearing form draft:', error instanceof Error ? error.message : String(error));
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
