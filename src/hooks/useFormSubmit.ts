import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseFormSubmitOptions<T> {
  onSubmit: (data: T) => Promise<void>;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseFormSubmitReturn {
  isSubmitting: boolean;
  submitError: string | null;
  handleSubmit: (data: any) => Promise<void>;
  reset: () => void;
}

export function useFormSubmit<T = any>({
  onSubmit,
  successMessage = 'Opération réussie',
  errorMessage = 'Une erreur est survenue',
  onSuccess,
  onError,
}: UseFormSubmitOptions<T>): UseFormSubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (data: T) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        await onSubmit(data);
        toast.success(successMessage);
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : errorMessage;
        setSubmitError(message);
        toast.error(message);
        onError?.(error instanceof Error ? error : new Error(errorMessage));
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, successMessage, errorMessage, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
  }, []);

  return {
    isSubmitting,
    submitError,
    handleSubmit,
    reset,
  };
}
