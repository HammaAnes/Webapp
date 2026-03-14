import { useEffect, useCallback } from "react";

type KeyboardEventHandler = (event: KeyboardEvent) => void;

interface UseKeyboardOptions {
  key: string | string[];
  onKeyDown?: KeyboardEventHandler;
  onKeyUp?: KeyboardEventHandler;
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export function useKeyboard({
  key,
  onKeyDown,
  onKeyUp,
  enabled = true,
  preventDefault = false,
  stopPropagation = false,
}: UseKeyboardOptions) {
  const keys = Array.isArray(key) ? key : [key];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !keys.includes(event.key)) return;

      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();

      onKeyDown?.(event);
    },
    [enabled, keys, onKeyDown, preventDefault, stopPropagation]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !keys.includes(event.key)) return;

      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();

      onKeyUp?.(event);
    },
    [enabled, keys, onKeyUp, preventDefault, stopPropagation]
  );

  useEffect(() => {
    if (onKeyDown) {
      window.addEventListener("keydown", handleKeyDown);
    }

    if (onKeyUp) {
      window.addEventListener("keyup", handleKeyUp);
    }

    return () => {
      if (onKeyDown) {
        window.removeEventListener("keydown", handleKeyDown);
      }

      if (onKeyUp) {
        window.removeEventListener("keyup", handleKeyUp);
      }
    };
  }, [handleKeyDown, handleKeyUp, onKeyDown, onKeyUp]);
}

export function useEscapeKey(handler: () => void, enabled: boolean = true) {
  useKeyboard({
    key: "Escape",
    onKeyDown: handler,
    enabled,
  });
}
