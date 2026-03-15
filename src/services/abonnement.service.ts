import { apiClient } from "../lib/api-client";
import { useAbonnementStore } from "../store/abonnement.store";
import { abonnementAdapter } from "../adapters";
import type { Abonnement, AbonnementUtilisateur } from "../types";

class AbonnementService {
  async loadAbonnements(): Promise<void> {
    const store = useAbonnementStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.getAbonnements();

      if (response.success && response.data) {
        const abonnements = Array.isArray(response.data)
          ? response.data.map((a: Record<string, unknown>) => abonnementAdapter.fromAPI(a))
          : [];
        store.setAbonnements(abonnements);
      } else {
        throw new Error(response.error || "Erreur lors du chargement des abonnements");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async createAbonnement(data: Partial<Abonnement>): Promise<Abonnement> {
    const store = useAbonnementStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.createAbonnement(data);

      if (response.success && response.data) {
        const abonnement = abonnementAdapter.fromAPI(response.data as Record<string, unknown>);
        store.addAbonnement(abonnement);
        return abonnement;
      } else {
        throw new Error(response.error || "Erreur lors de la création de l'abonnement");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async updateAbonnement(id: string, data: Partial<Abonnement>): Promise<Abonnement> {
    const store = useAbonnementStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.updateAbonnement(id, data);

      if (response.success && response.data) {
        const abonnement = abonnementAdapter.fromAPI(response.data as Record<string, unknown>);
        store.updateAbonnement(id, abonnement);
        return abonnement;
      } else {
        throw new Error(response.error || "Erreur lors de la mise à jour de l'abonnement");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async loadSouscriptions(): Promise<void> {
    const store = useAbonnementStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.getAbonnementsUtilisateurs();

      if (response.success && response.data) {
        const souscriptions = Array.isArray(response.data) ? response.data : [];
        store.setSouscriptions(souscriptions);
      } else {
        throw new Error(response.error || "Erreur lors du chargement des souscriptions");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async subscribe(abonnementId: string, userId: string): Promise<AbonnementUtilisateur> {
    const store = useAbonnementStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.souscrireAbonnement({
        abonnementId,
        userId,
      });

      if (response.success && response.data) {
        store.addSouscription(response.data);
        return response.data;
      } else {
        throw new Error(response.error || "Erreur lors de la souscription");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  getAbonnements(): Abonnement[] {
    return useAbonnementStore.getState().abonnements;
  }

  getActiveAbonnements(): Abonnement[] {
    return useAbonnementStore.getState().abonnements.filter(a => a.actif);
  }

  getAbonnementById(id: string): Abonnement | undefined {
    return useAbonnementStore.getState().abonnements.find(a => a.id === id);
  }

  getUserSouscriptions(userId: string): AbonnementUtilisateur[] {
    return useAbonnementStore.getState().souscriptions.filter(s => s.userId === userId);
  }

  getActiveSouscription(userId: string): AbonnementUtilisateur | undefined {
    return useAbonnementStore.getState().souscriptions.find(
      s => s.userId === userId && s.statut === "actif"
    );
  }
}

export const abonnementService = new AbonnementService();
