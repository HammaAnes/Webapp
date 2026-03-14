import { apiClient } from "../lib/api-client";
import { useDomiciliationStore } from "../store/domiciliation.store";
import { domiciliationAdapter } from "../adapters";
import type { DemandeDomiciliation, CreateDomiciliationData } from "../types";

class DomiciliationService {
  async loadDemandes(): Promise<void> {
    const store = useDomiciliationStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.getDemandesDomiciliation();

      if (response.success && response.data) {
        const demandes = Array.isArray(response.data)
          ? response.data.map(domiciliationAdapter)
          : [];
        store.setDemandes(demandes);
      } else {
        throw new Error(response.error || "Erreur lors du chargement des demandes de domiciliation");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async createDemande(data: CreateDomiciliationData): Promise<DemandeDomiciliation> {
    const store = useDomiciliationStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.createDemandeDomiciliation(data);

      if (response.success && response.data) {
        const demande = domiciliationAdapter(response.data);
        store.addDemande(demande);
        return demande;
      } else {
        throw new Error(response.error || "Erreur lors de la création de la demande de domiciliation");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async updateDemande(id: string, data: Partial<DemandeDomiciliation>): Promise<DemandeDomiciliation> {
    const store = useDomiciliationStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.updateDemandeDomiciliation(id, data);

      if (response.success && response.data) {
        const demande = domiciliationAdapter(response.data);
        store.updateDemande(id, demande);
        return demande;
      } else {
        throw new Error(response.error || "Erreur lors de la mise à jour de la demande");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async validateDemande(id: string, commentaire?: string): Promise<void> {
    const store = useDomiciliationStore.getState();
    store.setLoading(true);
    store.setError(null);
    try {
      const response = await apiClient.validateDomiciliation(id, commentaire);
      if (response.success) {
        await this.loadDemandes();
      } else {
        throw new Error(response.error || "Erreur lors de la validation");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async rejectDemande(id: string, motif: string): Promise<void> {
    const store = useDomiciliationStore.getState();
    store.setLoading(true);
    store.setError(null);
    try {
      const response = await apiClient.rejectDomiciliation(id, motif);
      if (response.success) {
        await this.loadDemandes();
      } else {
        throw new Error(response.error || "Erreur lors du refus");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async activateDemande(id: string, numeroBureau: number): Promise<void> {
    if (numeroBureau < 1 || numeroBureau > 60) {
      throw new Error("Le numéro de bureau doit être compris entre 1 et 60");
    }
    const store = useDomiciliationStore.getState();
    store.setLoading(true);
    store.setError(null);
    try {
      const response = await apiClient.activateDomiciliation(id);
      if (response.success) {
        await this.loadDemandes();
      } else {
        throw new Error(response.error || "Erreur lors de l'activation");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async requestComplements(id: string, commentaire: string): Promise<void> {
    return this.updateDemande(id, {
      statut: "en_attente_complements",
    } as Partial<DemandeDomiciliation>).then(() => {});
  }

  getDemandes(): DemandeDomiciliation[] {
    return useDomiciliationStore.getState().demandes;
  }

  getDemandeById(id: string): DemandeDomiciliation | undefined {
    return useDomiciliationStore.getState().demandes.find(d => d.id === id);
  }

  getUserDemande(userId: string): DemandeDomiciliation | null {
    return useDomiciliationStore.getState().getUserDemande(userId);
  }

  getActiveDemandes(): DemandeDomiciliation[] {
    return useDomiciliationStore.getState().demandes.filter(d => d.statut === "active");
  }

  getPendingDemandes(): DemandeDomiciliation[] {
    return useDomiciliationStore.getState().demandes.filter(d =>
      ["dossier_preparatoire", "en_attente_signature", "en_attente_complements"].includes(d.statut)
    );
  }
}

export const domiciliationService = new DomiciliationService();
