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
  const { reservations, demandesDomiciliation, abonnementsUtilisateurs } = useAppStore();

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
      (r) =>
        (r.userId === user?.id || r.personId === user?.id) &&
        (r.statut === "confirmee" || r.statut === "terminee" || r.statut === "en_cours")
    );
  }, [reservations, user?.id]);

  const hasDomiciliation = useMemo(() => {
    return demandesDomiciliation.some(
      (d) => d.userId === user?.id || d.personId === user?.id
    );
  }, [demandesDomiciliation, user?.id]);

  const hasAbonnement = useMemo(() => {
    return abonnementsUtilisateurs.some(
      (a) =>
        (a.personId === user?.id || a.userId === user?.id) &&
        a.statut === "actif"
    );
  }, [abonnementsUtilisateurs, user?.id]);

  const hasIdCard = useMemo(() => !!(user?.carteIdentiteUrl), [user?.carteIdentiteUrl]);

  const steps: OnboardingStep[] = useMemo(() => [
    {
      id: "identite",
      label: "Télécharger votre carte d'identité",
      description: "Document requis pour effectuer vos réservations.",
      completed: hasIdCard,
      link: "/app/profil",
      linkLabel: "Aller à mon profil",
    },
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
  ], [hasIdCard, profileComplete, hasReservation, hasDomiciliation, hasAbonnement]);

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const isComplete = completedCount === totalCount;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return { steps, completedCount, totalCount, isComplete, progressPercent, isDismissed, dismiss };
}
