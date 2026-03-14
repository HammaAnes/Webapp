import { useMemo } from "react";
import { useAuthStore } from "../store/authStore";
import { useAppStore } from "../store/store";

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  link: string;
  linkLabel: string;
}

export function useOnboarding(): {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  progressPercent: number;
  isDismissed: boolean;
  dismiss: () => void;
} {
  const { user } = useAuthStore();
  const { reservations, demandesDomiciliation, abonnements } = useAppStore();

  const isDismissed = useMemo(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`coffice_onboarding_dismissed_${user?.id}`) === "1";
  }, [user?.id]);

  const dismiss = () => {
    if (user?.id) {
      localStorage.setItem(`coffice_onboarding_dismissed_${user.id}`, "1");
    }
  };

  const profileComplete = useMemo(() => {
    if (!user) return false;
    return !!(user.telephone && user.entreprise);
  }, [user]);

  const hasReservation = useMemo(() => {
    return reservations.some(
      (r) => r.statut === "confirmee" || r.statut === "terminee" || r.statut === "en_cours"
    );
  }, [reservations]);

  const hasDomiciliation = useMemo(() => {
    return demandesDomiciliation.length > 0;
  }, [demandesDomiciliation]);

  const hasAbonnement = useMemo(() => {
    return abonnements.some((a) => a.statut === "actif");
  }, [abonnements]);

  const steps: OnboardingStep[] = useMemo(() => [
    {
      id: "profile",
      label: "Compléter votre profil",
      description: "Ajoutez votre téléphone, entreprise et profession.",
      completed: profileComplete,
      link: "/app/profil",
      linkLabel: "Compléter mon profil",
    },
    {
      id: "reservation",
      label: "Effectuer une réservation",
      description: "Réservez votre premier espace de travail.",
      completed: hasReservation,
      link: "/app/reservations",
      linkLabel: "Réserver un espace",
    },
    {
      id: "abonnement",
      label: "Souscrire à un abonnement",
      description: "Accédez à des tarifs préférentiels avec un abonnement mensuel.",
      completed: hasAbonnement,
      link: "/app/abonnements",
      linkLabel: "Voir les abonnements",
    },
    {
      id: "domiciliation",
      label: "Découvrir la domiciliation",
      description: "Domiciliez votre entreprise à l'adresse de Coffice.",
      completed: hasDomiciliation,
      link: "/app/mon-espace",
      linkLabel: "En savoir plus",
    },
  ], [profileComplete, hasReservation, hasDomiciliation, hasAbonnement]);

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const isComplete = completedCount === totalCount;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return { steps, completedCount, totalCount, isComplete, progressPercent, isDismissed, dismiss };
}
