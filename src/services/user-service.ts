/**
 * Service centralisé pour la gestion des utilisateurs
 * Utilisé partout dans l'application pour créer des utilisateurs de manière cohérente
 */

import { apiClient } from "../lib/api-client";
import { userAdapter } from "../adapters";
import type { User } from "../types";

export interface CreateUserData {
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  profession?: string;
  entreprise?: string;
  password?: string;
}

export interface CreateUserResult {
  success: boolean;
  user?: User;
  tempPassword?: string;
  error?: string;
}

/**
 * Méthode centralisée pour créer un utilisateur
 * À utiliser partout dans l'application (walk-in, admin panel, etc.)
 */
export async function createUser(data: CreateUserData): Promise<CreateUserResult> {
  try {
    const apiData = userAdapter.toAPI(data);
    const response = await apiClient.adminCreateUser(
      apiData as {
        email: string;
        nom: string;
        prenom: string;
        telephone?: string;
        password?: string;
      }
    );

    if (response.success && response.data) {
      const userData = response.data as Record<string, unknown>;
      const user = userAdapter.fromAPI(userData);
      const tempPassword = userData.temp_password as string | undefined;

      return {
        success: true,
        user,
        tempPassword,
      };
    }

    return {
      success: false,
      error: response.error || "Erreur lors de la création de l'utilisateur",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Recherche d'utilisateurs par email ou nom
 */
export async function searchUsers(query: string): Promise<User[]> {
  try {
    const response = await apiClient.searchUsers(query);
    if (response.success && response.data) {
      const rawData = Array.isArray(response.data)
        ? response.data
        : (response.data as Record<string, unknown>).data || [];

      return (rawData as Record<string, unknown>[]).map((u) => userAdapter.fromAPI(u));
    }
    return [];
  } catch (error) {
    console.error("Erreur recherche utilisateurs:", error);
    return [];
  }
}
