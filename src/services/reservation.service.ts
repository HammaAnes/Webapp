import { apiClient } from "../lib/api-client";
import { useReservationStore } from "../store/reservation.store";
import { reservationAdapter } from "../adapters";
import type { Reservation, CreateReservationData } from "../types";

class ReservationService {
  async loadReservations(): Promise<void> {
    const store = useReservationStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.getReservations();

      if (response.success && response.data) {
        const reservations = Array.isArray(response.data)
          ? response.data.map((r: Record<string, unknown>) => reservationAdapter.fromAPI(r))
          : [];
        store.setReservations(reservations);
      } else {
        throw new Error(response.error || "Erreur lors du chargement des réservations");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async createReservation(data: CreateReservationData): Promise<Reservation> {
    const store = useReservationStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.createReservation(data);

      if (response.success && response.data) {
        const reservation = reservationAdapter.fromAPI(response.data as Record<string, unknown>);
        store.addReservation(reservation);
        return reservation;
      } else {
        throw new Error(response.error || "Erreur lors de la création de la réservation");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async updateReservation(id: string, data: Partial<Reservation>): Promise<Reservation> {
    const store = useReservationStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.updateReservation(id, data);

      if (response.success && response.data) {
        const reservation = reservationAdapter.fromAPI(response.data as Record<string, unknown>);
        store.updateReservation(id, reservation);
        return reservation;
      } else {
        throw new Error(response.error || "Erreur lors de la mise à jour de la réservation");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async cancelReservation(id: string, raison?: string): Promise<void> {
    return this.updateReservation(id, {
      statut: "annulee",
      raisonAnnulation: raison,
      dateAnnulation: new Date(),
    }).then(() => {});
  }

  getReservations(): Reservation[] {
    return useReservationStore.getState().reservations;
  }

  getReservationById(id: string): Reservation | undefined {
    return useReservationStore.getState().reservations.find(r => r.id === id);
  }

  getUserReservations(userId: string): Reservation[] {
    return useReservationStore.getState().reservations.filter(r => r.userId === userId);
  }

  getEspaceReservations(espaceId: string): Reservation[] {
    return useReservationStore.getState().reservations.filter(r => r.espaceId === espaceId);
  }

  getActiveReservations(): Reservation[] {
    return useReservationStore.getState().reservations.filter(r =>
      ["confirmee", "en_cours"].includes(r.statut)
    );
  }
}

export const reservationService = new ReservationService();
