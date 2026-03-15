import { create } from "zustand";
import { apiClient } from "../lib/api-client";
import toast from "react-hot-toast";
import type { User, RegisterData } from "../types";
import { logger } from "../utils/logger";
import { userAdapter } from "../adapters";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAdmin: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  loadUser: () => Promise<void>;
}

interface AuthResponseData {
  token: string;
  refreshToken?: string;
  user: Record<string, unknown>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  isAdmin: false,

  initialize: async () => {
    const current = get();
    if (current.isInitialized) return;

    try {
      set({ isLoading: true });
      const token = apiClient.getToken();

      if (!token) {
        set({ user: null, isAdmin: false, isInitialized: true, isLoading: false });
        return;
      }

      const response = await apiClient.me();

      if (!response.success || !response.data) {
        apiClient.setToken(null);
        set({ user: null, isAdmin: false, isInitialized: true, isLoading: false });
        return;
      }

      const userData = userAdapter.fromAPI(response.data as Record<string, unknown>);
      set({ user: userData, isAdmin: userData.role === "admin", isInitialized: true, isLoading: false });
    } catch (error) {
      logger.warn("Auth initialization failed:", error instanceof Error ? error.message : String(error));
      apiClient.setToken(null);
      set({ user: null, isAdmin: false, isInitialized: true, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.login(email, password);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Erreur de connexion");
      }

      const responseData = response.data as AuthResponseData;
      apiClient.setToken(responseData.token, responseData.refreshToken);
      const adaptedUser = userAdapter.fromAPI(responseData.user);

      set({ user: adaptedUser, isAdmin: adaptedUser.role === "admin", isLoading: false });
      toast.success("Connexion réussie");
    } catch (error) {
      set({ isLoading: false });
      toast.error(error instanceof Error ? error.message : "Erreur de connexion");
      throw error;
    }
  },

  loginWithGoogle: async (credential: string) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.loginWithGoogle(credential);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Erreur de connexion Google");
      }

      const responseData = response.data as AuthResponseData;
      apiClient.setToken(responseData.token, responseData.refreshToken);
      const adaptedUser = userAdapter.fromAPI(responseData.user);

      set({ user: adaptedUser, isAdmin: adaptedUser.role === "admin", isLoading: false });
      toast.success("Connexion Google réussie");
    } catch (error) {
      set({ isLoading: false });
      toast.error(error instanceof Error ? error.message : "Erreur de connexion Google");
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    try {
      set({ isLoading: true });

      const response = await apiClient.register(data);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Erreur lors de l'inscription");
      }

      const responseData = response.data as AuthResponseData;
      apiClient.setToken(responseData.token, responseData.refreshToken);
      const adaptedUser = userAdapter.fromAPI(responseData.user);

      set({ user: adaptedUser, isAdmin: adaptedUser.role === "admin", isLoading: false });

      if (data.codeParrainage) {
        toast.success("Inscription réussie ! Bonus parrainage appliqué");
      } else {
        toast.success("Inscription réussie !");
      }
    } catch (error) {
      set({ isLoading: false });
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'inscription");
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      logger.warn("Logout API call failed:", error instanceof Error ? error.message : String(error));
    } finally {
      apiClient.setToken(null, null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("coffice-auth");
      }
      set({ user: null, isAdmin: false, isInitialized: true, isLoading: false });
    }
    toast.success("Déconnexion réussie");
  },

  updateProfile: async (data: Partial<User>) => {
    try {
      set({ isLoading: true });

      const currentUser = get().user;
      if (!currentUser) {
        throw new Error("Utilisateur non connecté");
      }

      const response = await apiClient.updateUser(currentUser.id, data as Record<string, unknown>);

      if (!response.success) {
        throw new Error(response.error || "Erreur lors de la mise à jour");
      }

      const updatedUser = response.data && typeof response.data === "object"
        ? userAdapter.fromAPI(response.data as Record<string, unknown>)
        : { ...currentUser, ...data };

      set({ user: updatedUser, isAdmin: updatedUser.role === "admin", isLoading: false });
      toast.success("Profil mis à jour");
    } catch (error) {
      set({ isLoading: false });
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour");
      throw error;
    }
  },

  loadUser: async () => {
    try {
      const response = await apiClient.me();
      if (response.success && response.data) {
        const userData = userAdapter.fromAPI(response.data as Record<string, unknown>);
        set({ user: userData, isAdmin: userData.role === "admin" });
      }
    } catch (error) {
      logger.warn("loadUser failed:", error instanceof Error ? error.message : String(error));
    }
  },
}));
