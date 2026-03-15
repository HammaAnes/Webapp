import { apiClient } from "../lib/api-client";
import { espaceAdapter } from "../adapters";
import type { Espace } from "../types";

class EspaceService {
  async loadEspaces(): Promise<Espace[]> {
    const response = await apiClient.getEspaces();
    if (response.success && response.data) {
      const raw = Array.isArray(response.data) ? response.data : [];
      return raw.map((e: Record<string, unknown>) => espaceAdapter.fromAPI(e));
    }
    throw new Error(response.error || "Erreur lors du chargement des espaces");
  }

  async createEspace(data: Partial<Espace>): Promise<Espace> {
    const response = await apiClient.createEspace(data);
    if (response.success && response.data) {
      return espaceAdapter.fromAPI(response.data as Record<string, unknown>);
    }
    throw new Error(response.error || "Erreur lors de la création de l'espace");
  }

  async updateEspace(id: string, data: Partial<Espace>): Promise<Espace> {
    const response = await apiClient.updateEspace(id, data);
    if (response.success && response.data) {
      return espaceAdapter.fromAPI(response.data as Record<string, unknown>);
    }
    throw new Error(response.error || "Erreur lors de la mise à jour de l'espace");
  }

  async deleteEspace(id: string): Promise<void> {
    const response = await apiClient.deleteEspace(id);
    if (!response.success) {
      throw new Error(response.error || "Erreur lors de la suppression de l'espace");
    }
  }
}

export const espaceService = new EspaceService();
