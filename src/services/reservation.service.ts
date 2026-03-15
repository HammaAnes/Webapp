import { apiClient } from "../lib/api-client";
import { reservationAdapter } from "../adapters";
import type { Reservation, CreateReservationData } from "../types";

class ReservationService {
  async loadReservations(): Promise<Reservation[]> {
    const response = await apiClient.getReservations();
    if (response.success && response.data) {
      const raw = Array.isArray(response.data) ? response.data : [];
      return raw.map((r: Record<string, unknown>) => reservationAdapter.fromAPI(r));
    }
    throw new Error(response.error || "Erreur lors du chargement des réservations");
  }

  async createReservation(data: CreateReservationData): Promise<Reservation> {
    const response = await apiClient.createReservation(data);
    if (response.success && response.data) {
      return reservationAdapter.fromAPI(response.data as Record<string, unknown>);
    }
    throw new Error(response.error || "Erreur lors de la création de la réservation");
  }

  async updateReservation(id: string, data: Partial<Reservation>): Promise<Reservation> {
    const response = await apiClient.updateReservation(id, data);
    if (response.success && response.data) {
      return reservationAdapter.fromAPI(response.data as Record<string, unknown>);
    }
    throw new Error(response.error || "Erreur lors de la mise à jour de la réservation");
  }

  async cancelReservation(id: string, raison?: string): Promise<void> {
    await this.updateReservation(id, {
      statut: "annulee",
      raisonAnnulation: raison,
      dateAnnulation: new Date(),
    });
  }
}

export const reservationService = new ReservationService();
