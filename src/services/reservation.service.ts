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
    const response = await apiClient.createReservation({
      espaceId: data.espaceId,
      dateDebut: data.dateDebut instanceof Date ? data.dateDebut.toISOString() : String(data.dateDebut),
      dateFin: data.dateFin instanceof Date ? data.dateFin.toISOString() : String(data.dateFin),
      participants: data.participants,
      notes: data.notes,
      codePromo: data.codePromo,
    });
    if (response.success && response.data) {
      return reservationAdapter.fromAPI(response.data as Record<string, unknown>);
    }
    throw new Error(response.error || "Erreur lors de la création de la réservation");
  }

  async updateReservation(id: string, data: Partial<Reservation>): Promise<Reservation> {
    const { statut, notes, participants, dateDebut, dateFin } = data;
    const payload: Record<string, unknown> = {};
    if (statut !== undefined) payload.statut = statut;
    if (notes !== undefined) payload.notes = notes;
    if (participants !== undefined) payload.participants = participants;
    if (dateDebut !== undefined) payload.date_debut = dateDebut instanceof Date ? dateDebut.toISOString() : dateDebut;
    if (dateFin !== undefined) payload.date_fin = dateFin instanceof Date ? dateFin.toISOString() : dateFin;
    const response = await apiClient.updateReservation(id, payload);
    if (response.success && response.data) {
      return reservationAdapter.fromAPI(response.data as Record<string, unknown>);
    }
    throw new Error(response.error || "Erreur lors de la mise à jour de la réservation");
  }

  async cancelReservation(id: string, _raison?: string): Promise<void> {
    await apiClient.cancelReservation(id);
  }
}

export const reservationService = new ReservationService();
