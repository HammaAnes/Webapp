import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Abonnement, AbonnementUtilisateur } from "../types";

interface AbonnementState {
  abonnements: Abonnement[];
  souscriptions: AbonnementUtilisateur[];
  loading: boolean;
  error: string | null;

  setAbonnements: (abonnements: Abonnement[]) => void;
  addAbonnement: (abonnement: Abonnement) => void;
  updateAbonnement: (id: string, data: Partial<Abonnement>) => void;
  removeAbonnement: (id: string) => void;

  setSouscriptions: (souscriptions: AbonnementUtilisateur[]) => void;
  addSouscription: (souscription: AbonnementUtilisateur) => void;
  updateSouscription: (id: string, data: Partial<AbonnementUtilisateur>) => void;
  removeSouscription: (id: string) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  abonnements: [],
  souscriptions: [],
  loading: false,
  error: null,
};

export const useAbonnementStore = create<AbonnementState>()(
  devtools(
    (set) => ({
      ...initialState,

      setAbonnements: (abonnements) => set({ abonnements, error: null }),

      addAbonnement: (abonnement) => set((state) => ({
        abonnements: [...state.abonnements, abonnement],
        error: null,
      })),

      updateAbonnement: (id, data) => set((state) => ({
        abonnements: state.abonnements.map((abonnement) =>
          abonnement.id === id ? { ...abonnement, ...data } : abonnement
        ),
        error: null,
      })),

      removeAbonnement: (id) => set((state) => ({
        abonnements: state.abonnements.filter((abonnement) => abonnement.id !== id),
        error: null,
      })),

      setSouscriptions: (souscriptions) => set({ souscriptions, error: null }),

      addSouscription: (souscription) => set((state) => ({
        souscriptions: [...state.souscriptions, souscription],
        error: null,
      })),

      updateSouscription: (id, data) => set((state) => ({
        souscriptions: state.souscriptions.map((souscription) =>
          souscription.id === id ? { ...souscription, ...data } : souscription
        ),
        error: null,
      })),

      removeSouscription: (id) => set((state) => ({
        souscriptions: state.souscriptions.filter((souscription) => souscription.id !== id),
        error: null,
      })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    { name: "AbonnementStore" }
  )
);
