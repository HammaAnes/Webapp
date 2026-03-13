import React from "react";
import Button from "./Button";

interface GoogleLoginButtonProps {
  onSuccess: (idToken: string) => void;
  onError?: (error: string) => void;
  text?: string;
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
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: string;
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  text = "Continuer avec Google",
  loading = false,
}) => {
  const [isGoogleLoaded, setIsGoogleLoaded] = React.useState(false);
  const [isManualMode, setIsManualMode] = React.useState(false);
  const googleButtonRef = React.useRef<HTMLDivElement>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  React.useEffect(() => {
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID not configured");
      setIsManualMode(true);
      return;
    }

    const loadGoogleScript = () => {
      if (window.google?.accounts?.id) {
        setIsGoogleLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setIsGoogleLoaded(true);
      script.onerror = () => {
        console.error("Failed to load Google Sign-In script");
        setIsManualMode(true);
      };
      document.body.appendChild(script);
    };

    loadGoogleScript();
  }, [clientId]);

  React.useEffect(() => {
    if (!isGoogleLoaded || !window.google || !googleButtonRef.current || !clientId) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError?.("Échec de la connexion Google");
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: googleButtonRef.current.offsetWidth,
      });
    } catch (error) {
      console.error("Error initializing Google Sign-In:", error);
      setIsManualMode(true);
    }
  }, [isGoogleLoaded, clientId, onSuccess, onError]);

  if (isManualMode || !clientId) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => {
          onError?.("Configuration Google OAuth manquante");
        }}
        disabled
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {text}
      </Button>
    );
  }

  if (loading) {
    return (
      <Button type="button" variant="outline" className="w-full" disabled loading>
        Connexion en cours...
      </Button>
    );
  }

  return (
    <div ref={googleButtonRef} className="w-full" style={{ minHeight: "40px" }} />
  );
};
