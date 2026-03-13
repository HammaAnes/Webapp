import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { DemandeDomiciliation } from "../types";

interface DomiciliationState {
  demandes: DemandeDomiciliation[];
  loading: boolean;
  error: string | null;

  setDemandes: (demandes: DemandeDomiciliation[]) => void;
  addDemande: (demande: DemandeDomiciliation) => void;
  updateDemande: (id: string, data: Partial<DemandeDomiciliation>) => void;
  removeDemande: (id: string) => void;
  getUserDemande: (userId: string) => DemandeDomiciliation | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  demandes: [],
  loading: false,
  error: null,
};

export const useDomiciliationStore = create<DomiciliationState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setDemandes: (demandes) => set({ demandes, error: null }),

      addDemande: (demande) => set((state) => ({
        demandes: [...state.demandes, demande],
        error: null,
      })),

      updateDemande: (id, data) => set((state) => ({
        demandes: state.demandes.map((demande) =>
          demande.id === id ? { ...demande, ...data } : demande
        ),
        error: null,
      })),

      removeDemande: (id) => set((state) => ({
        demandes: state.demandes.filter((demande) => demande.id !== id),
        error: null,
      })),

      getUserDemande: (userId) => {
        const demandes = get().demandes;
        return demandes.find(d => d.userId === userId) || null;
      },

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    { name: "DomiciliationStore" }
  )
);
