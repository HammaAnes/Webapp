import { useState, useEffect, useCallback, useRef } from "react";
import { AppError, handleApiError } from "../utils/error-handler";

export interface UseAsyncOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
}

export interface UseAsyncState<T> {
  data: T | null;
  error: AppError | null;
  loading: boolean;
  called: boolean;
}

export interface UseAsyncReturn<T, Args extends unknown[]> {
  execute: (...args: Args) => Promise<T | null>;
  data: T | null;
  error: AppError | null;
  loading: boolean;
  called: boolean;
  reset: () => void;
}

export function useAsync<T, Args extends unknown[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, Args> {
  const { immediate = false, onSuccess, onError } = options;

  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    loading: false,
    called: false,
  });

  const isMountedRef = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      if (loadingRef.current) {
        return null;
      }

      loadingRef.current = true;

      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
          called: true,
        }));
      }

      try {
        const result = await asyncFunction(...args);

        if (isMountedRef.current) {
          setState({
            data: result,
            error: null,
            loading: false,
            called: true,
          });

          if (onSuccess) {
            onSuccess(result);
          }
        }

        return result;
      } catch (error) {
        const appError = handleApiError(error);

        if (isMountedRef.current) {
          setState({
            data: null,
            error: appError,
            loading: false,
            called: true,
          });

          if (onError) {
            onError(appError);
          }
        }

        return null;
      } finally {
        loadingRef.current = false;
      }
    },
    [asyncFunction, onSuccess, onError]
  );

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setState({
        data: null,
        error: null,
        loading: false,
        called: false,
      });
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // execute is stable (useCallback with asyncFunction), intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  return {
    execute,
    data: state.data,
    error: state.error,
    loading: state.loading,
    called: state.called,
    reset,
  };
}
