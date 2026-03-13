import { apiClient } from "../lib/api-client";
import { useUserStore } from "../store/user.store";
import { userAdapter } from "../adapters";
import type { User } from "../types";

class UserService {
  async loadUsers(): Promise<void> {
    const store = useUserStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.getUsers();

      if (response.success && response.data) {
        const users = Array.isArray(response.data)
          ? response.data.map(userAdapter.fromAPI)
          : [];
        store.setUsers(users);
      } else {
        throw new Error(response.error || "Erreur lors du chargement des utilisateurs");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async createUser(data: Partial<User>): Promise<User> {
    const store = useUserStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.addUser(data);

      if (response.success && response.data) {
        const user = userAdapter.fromAPI(response.data);
        store.addUser(user);
        return user;
      } else {
        throw new Error(response.error || "Erreur lors de la création de l'utilisateur");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const store = useUserStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.updateUser(id, data);

      if (response.success && response.data) {
        const user = userAdapter.fromAPI(response.data);
        store.updateUser(id, user);
        return user;
      } else {
        throw new Error(response.error || "Erreur lors de la mise à jour de l'utilisateur");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  async deleteUser(id: string): Promise<void> {
    const store = useUserStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.deleteUser(id);

      if (response.success) {
        store.removeUser(id);
      } else {
        throw new Error(response.error || "Erreur lors de la suppression de l'utilisateur");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }

  getUsers(): User[] {
    return useUserStore.getState().users;
  }

  getUserById(id: string): User | undefined {
    return useUserStore.getState().users.find(u => u.id === id);
  }
}

export const userService = new UserService();
