import { apiClient } from "../lib/api-client";
import { abonnementAdapter } from "../adapters";
import type { Abonnement, AbonnementUtilisateur } from "../types";

class AbonnementService {
  async loadAbonnements(): Promise<Abonnement[]> {
    const response = await apiClient.getAbonnements();
    if (response.success && response.data) {
      const raw = Array.isArray(response.data) ? response.data : [];
      return raw.map((a: Record<string, unknown>) => abonnementAdapter.fromAPI(a));
    }
    throw new Error(response.error || "Erreur lors du chargement des abonnements");
  }

  async createAbonnement(data: Partial<Abonnement>): Promise<Abonnement> {
    const response = await apiClient.createAbonnement(data);
    if (response.success && response.data) {
      return abonnementAdapter.fromAPI(response.data as Record<string, unknown>);
    }
    throw new Error(response.error || "Erreur lors de la création de l'abonnement");
  }

  async updateAbonnement(id: string, data: Partial<Abonnement>): Promise<Abonnement> {
    const response = await apiClient.updateAbonnement(id, data);
    if (response.success && response.data) {
      return abonnementAdapter.fromAPI(response.data as Record<string, unknown>);
    }
    throw new Error(response.error || "Erreur lors de la mise à jour de l'abonnement");
  }

  async loadSouscriptions(): Promise<AbonnementUtilisateur[]> {
    const response = await apiClient.getAbonnementsUtilisateurs();
    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    throw new Error(response.error || "Erreur lors du chargement des souscriptions");
  }

  async subscribe(abonnementId: string, userId: string): Promise<AbonnementUtilisateur> {
    const response = await apiClient.souscrireAbonnement({ abonnementId, userId });
    if (response.success && response.data) {
      return response.data as AbonnementUtilisateur;
    }
    throw new Error(response.error || "Erreur lors de la souscription");
  }
}

export const abonnementService = new AbonnementService();
