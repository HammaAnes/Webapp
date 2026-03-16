import { apiClient } from "../lib/api-client";
import { userAdapter } from "../adapters";
import type { User } from "../types";

export interface AdminCreateUserData {
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  profession?: string;
  entreprise?: string;
  password?: string;
  role?: 'user' | 'admin';
}

export interface AdminCreateUserResult {
  success: boolean;
  user?: User;
  tempPassword?: string;
  error?: string;
}

class UserService {
  async adminCreateUser(data: AdminCreateUserData): Promise<AdminCreateUserResult> {
    try {
      const apiData = userAdapter.toAPI(data);
      const response = await apiClient.adminCreateUser(apiData as {
        email: string;
        nom: string;
        prenom: string;
        telephone?: string;
        password?: string;
      });

      if (response.success && response.data) {
        const userData = response.data as Record<string, unknown>;
        const user = userAdapter.fromAPI(userData);
        const tempPassword = userData.temp_password as string | undefined;
        return { success: true, user, tempPassword };
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

  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await apiClient.searchUsers(query);
      if (response.success && response.data) {
        const rawData = Array.isArray(response.data)
          ? response.data
          : (response.data as Record<string, unknown>).data || [];
        return (rawData as Record<string, unknown>[]).map((u) => userAdapter.fromAPI(u));
      }
      return [];
    } catch {
      return [];
    }
  }
}

export const userService = new UserService();
