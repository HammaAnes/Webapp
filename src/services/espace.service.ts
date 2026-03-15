import { apiClient } from "../lib/api-client";
import { useEspaceStore } from "../store/espace.store";
import { espaceAdapter } from "../adapters";
import type { Espace } from "../types";

class EspaceService {
  async loadEspaces(): Promise<void> {
    const store = useEspaceStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.getEspaces();

      if (response.success && response.data) {
        const espaces = Array.isArray(response.data)
          ? response.data.map((e: Record<string, unknown>) => espaceAdapter.fromAPI(e))
          : [];
        store.setEspaces(espaces);
      } else {
        throw new Error(response.error || "Erreur lors du chargement des espaces");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async createEspace(data: Partial<Espace>): Promise<Espace> {
    const store = useEspaceStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.createEspace(data);

      if (response.success && response.data) {
        const espace = espaceAdapter.fromAPI(response.data as Record<string, unknown>);
        store.addEspace(espace);
        return espace;
      } else {
        throw new Error(response.error || "Erreur lors de la création de l'espace");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async updateEspace(id: string, data: Partial<Espace>): Promise<Espace> {
    const store = useEspaceStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.updateEspace(id, data);

      if (response.success && response.data) {
        const espace = espaceAdapter.fromAPI(response.data as Record<string, unknown>);
        store.updateEspace(id, espace);
        return espace;
      } else {
        throw new Error(response.error || "Erreur lors de la mise à jour de l'espace");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async deleteEspace(id: string): Promise<void> {
    const store = useEspaceStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.deleteEspace(id);

      if (response.success) {
        store.removeEspace(id);
      } else {
        throw new Error(response.error || "Erreur lors de la suppression de l'espace");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  getEspaces(): Espace[] {
    return useEspaceStore.getState().espaces;
  }

  getEspaceById(id: string): Espace | undefined {
    return useEspaceStore.getState().espaces.find(e => e.id === id);
  }

  getEspacesByType(type: string): Espace[] {
    return useEspaceStore.getState().espaces.filter(e => e.type === type);
  }

  getAvailableEspaces(): Espace[] {
    return useEspaceStore.getState().espaces.filter(e => e.disponible);
  }
}

export const espaceService = new EspaceService();
