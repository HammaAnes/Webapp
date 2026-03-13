import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CodePromo } from "../types";

interface PromoState {
  codesPromo: CodePromo[];
  loading: boolean;
  error: string | null;

  setCodesPromo: (codesPromo: CodePromo[]) => void;
  addCodePromo: (codePromo: CodePromo) => void;
  updateCodePromo: (id: string, data: Partial<CodePromo>) => void;
  removeCodePromo: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  codesPromo: [],
  loading: false,
  error: null,
};

export const usePromoStore = create<PromoState>()(
  devtools(
    (set) => ({
      ...initialState,

      setCodesPromo: (codesPromo) => set({ codesPromo, error: null }),

      addCodePromo: (codePromo) => set((state) => ({
        codesPromo: [...state.codesPromo, codePromo],
        error: null,
      })),

      updateCodePromo: (id, data) => set((state) => ({
        codesPromo: state.codesPromo.map((codePromo) =>
          codePromo.id === id ? { ...codePromo, ...data } : codePromo
        ),
        error: null,
      })),

      removeCodePromo: (id) => set((state) => ({
        codesPromo: state.codesPromo.filter((codePromo) => codePromo.id !== id),
        error: null,
      })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    { name: "PromoStore" }
  )
);
