import React from "react";
import { Loader2 } from "lucide-react";
import { logger } from "../../utils/logger";

interface GoogleButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (error: string) => void;
  text?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; getNotDisplayedReason: () => string }) => void) => void;
          renderButton: (parent: HTMLElement, options: { theme?: string; size?: string; width?: number; text?: string; shape?: string }) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const baseButtonClass =
  "w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium shadow-sm transition-all duration-200";

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  onSuccess,
  onError,
  text = "Continuer avec Google",
  className = "",
  disabled = false,
  loading = false,
}) => {
  const nativeButtonRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = React.useState(false);
  const [scriptError, setScriptError] = React.useState(false);

  const hasClientId = Boolean(GOOGLE_CLIENT_ID);

  // Charger le script GSI de Google
  React.useEffect(() => {
    if (!hasClientId) return;

    if (window.google?.accounts?.id) {
      setIsScriptLoaded(true);
      return;
    }

    if (document.getElementById("google-gsi-script")) {
      const checkLoaded = setInterval(() => {
        if (window.google?.accounts?.id) {
          setIsScriptLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      const timeout = setTimeout(() => {
        clearInterval(checkLoaded);
        if (!window.google?.accounts?.id) setScriptError(true);
      }, 5000);
      return () => {
        clearInterval(checkLoaded);
        clearTimeout(timeout);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.id = "google-gsi-script";
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => setScriptError(true);
    document.body.appendChild(script);
  }, [hasClientId]);

  // Initialiser et rendre le bouton natif Google (invisible, en overlay)
  React.useEffect(() => {
    if (!isScriptLoaded || !window.google || !nativeButtonRef.current || disabled || !hasClientId) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          onSuccess(response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      const width = containerRef.current?.offsetWidth || 400;
      window.google.accounts.id.renderButton(nativeButtonRef.current, {
        theme: "outline",
        size: "large",
        width,
        text: "continue_with",
        shape: "rectangular",
      });
    } catch (error) {
      logger.error(
        "Error initializing Google Sign-In:",
        error instanceof Error ? error.message : String(error)
      );
      setScriptError(true);
    }
  }, [isScriptLoaded, onSuccess, onError, disabled, hasClientId]);

  // État chargement
  if (loading) {
    return (
      <button
        type="button"
        className={`${baseButtonClass} opacity-70 cursor-not-allowed ${className}`}
        disabled
      >
        <Loader2 className="w-5 h-5 animate-spin text-gray-500 flex-shrink-0" />
        <span>Connexion en cours...</span>
      </button>
    );
  }

  // État erreur ou pas de client ID : bouton désactivé
  if (!hasClientId || scriptError) {
    return (
      <button
        type="button"
        className={`${baseButtonClass} opacity-50 cursor-not-allowed ${className}`}
        disabled
      >
        <GoogleIcon />
        <span>{text}</span>
      </button>
    );
  }

  // État script en cours de chargement : squelette avec icône
  if (!isScriptLoaded) {
    return (
      <button
        type="button"
        className={`${baseButtonClass} opacity-60 cursor-wait ${className}`}
        disabled
      >
        <GoogleIcon />
        <span>{text}</span>
      </button>
    );
  }

  // État actif : bouton custom visible + bouton natif Google invisible en overlay
  // (le bouton Google gère le clic, le bouton custom est purement décoratif)
  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Bouton visible (décoratif, non interactif) */}
      <div
        className={`${baseButtonClass} hover:bg-gray-50 hover:border-gray-400`}
        style={{ pointerEvents: "none" }}
        aria-hidden="true"
      >
        <GoogleIcon />
        <span>{text}</span>
      </div>

      {/* Bouton natif Google en overlay invisible — gère le vrai clic */}
      <div
        ref={nativeButtonRef}
        className="absolute inset-0 overflow-hidden rounded-lg"
        style={{ opacity: 0 }}
      />
    </div>
  );
};
