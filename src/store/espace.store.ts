import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Espace } from "../types";

interface EspaceState {
  espaces: Espace[];
  loading: boolean;
  error: string | null;

  setEspaces: (espaces: Espace[]) => void;
  addEspace: (espace: Espace) => void;
  updateEspace: (id: string, data: Partial<Espace>) => void;
  removeEspace: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  espaces: [],
  loading: false,
  error: null,
};

export const useEspaceStore = create<EspaceState>()(
  devtools(
    (set) => ({
      ...initialState,

      setEspaces: (espaces) => set({ espaces, error: null }),

      addEspace: (espace) => set((state) => ({
        espaces: [...state.espaces, espace],
        error: null,
      })),

      updateEspace: (id, data) => set((state) => ({
        espaces: state.espaces.map((espace) =>
          espace.id === id ? { ...espace, ...data } : espace
        ),
        error: null,
      })),

      removeEspace: (id) => set((state) => ({
        espaces: state.espaces.filter((espace) => espace.id !== id),
        error: null,
      })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    { name: "EspaceStore" }
  )
);
