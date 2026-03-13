import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Reservation } from "../types";

interface ReservationState {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;

  setReservations: (reservations: Reservation[]) => void;
  addReservation: (reservation: Reservation) => void;
  updateReservation: (id: string, data: Partial<Reservation>) => void;
  removeReservation: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  reservations: [],
  loading: false,
  error: null,
};

export const useReservationStore = create<ReservationState>()(
  devtools(
    (set) => ({
      ...initialState,

      setReservations: (reservations) => set({ reservations, error: null }),

      addReservation: (reservation) => set((state) => ({
        reservations: [...state.reservations, reservation],
        error: null,
      })),

      updateReservation: (id, data) => set((state) => ({
        reservations: state.reservations.map((reservation) =>
          reservation.id === id ? { ...reservation, ...data } : reservation
        ),
        error: null,
      })),

      removeReservation: (id) => set((state) => ({
        reservations: state.reservations.filter((reservation) => reservation.id !== id),
        error: null,
      })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    { name: "ReservationStore" }
  )
);
