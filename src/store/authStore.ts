import { create } from "zustand";
import { apiClient } from "../lib/api-client";
import toast from "react-hot-toast";
import type { User } from "../types";
import { emailService } from "../services/email-service";
import { logger } from "../utils/logger";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAdmin: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  loadUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;
  profession?: string;
  entreprise?: string;
  codeParrainage?: string;
}

// Add this helper function at the top of the file (outside the store)
function adaptUser(rawUser: Record<string, unknown>): User {
  return {
    ...rawUser,
    id: String(rawUser.id),
    raisonSociale: rawUser.raison_sociale || rawUser.raisonSociale,
    formeJuridique: rawUser.forme_juridique || rawUser.formeJuridique,
    nif: rawUser.nif,
    nis: rawUser.nis,
    registreCommerce: rawUser.registre_commerce || rawUser.registreCommerce,
    articleImposition: rawUser.article_imposition || rawUser.articleImposition,
    activitePrincipale: rawUser.activite_principale || rawUser.activitePrincipale,
    numeroAutoEntrepreneur: rawUser.numero_auto_entrepreneur || rawUser.numeroAutoEntrepreneur,
    siegeSocial: rawUser.siege_social || rawUser.siegeSocial,
    capital: rawUser.capital,
    dateCreationEntreprise: rawUser.date_creation_entreprise || rawUser.dateCreationEntreprise,
  } as User;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  isAdmin: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const token = apiClient.getToken();

      if (!token) {
        set({
          user: null,
          isAdmin: false,
          isInitialized: true,
          isLoading: false,
        });
        return;
      }

      const response = await apiClient.me();

      if (!response.success || !response.data) {
        apiClient.setToken(null);
        set({
          user: null,
          isAdmin: false,
          isInitialized: true,
          isLoading: false,
        });
        return;
      }

      const userData = adaptUser(response.data as Record<string, unknown>); // ← was: response.data as User
      set({ user: userData, isAdmin: userData.role === "admin", isInitialized: true, isLoading: false });
    } catch {
      apiClient.setToken(null);
      set({
        user: null,
        isAdmin: false,
        isInitialized: true,
        isLoading: false,
      });
    }
  },

login: async (email: string, password: string) => {
  try {
    set({ isLoading: true });
    const response = await apiClient.login(email, password);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Erreur de connexion");
    }

    const responseData = response.data as {
      token: string;
      refreshToken?: string;
      user: any; // Use any temporarily to handle the transformation
    };
    
    apiClient.setToken(responseData.token, responseData.refreshToken);

    const adaptedUser = adaptUser(responseData.user);

    set({
      user: adaptedUser,
      isAdmin: adaptedUser.role === "admin",
      isLoading: false,
    });

    // IMPORTANT: Also trigger the loading of domiciliation data 
    // so the 'demande' prop isn't null on the first render
    await get().loadUser();
    toast.success("Connexion réussie");
  } catch (error) {
    set({ isLoading: false });
    toast.error(error instanceof Error ? error.message : "Erreur de connexion");
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

      const responseData = response.data as {
        token: string;
        refreshToken?: string;
        user: any;
      };
      apiClient.setToken(responseData.token, responseData.refreshToken);

      const adaptedUser = adaptUser(responseData.user as Record<string, unknown>);
      set({
        user: adaptedUser,
        isAdmin: adaptedUser.role === "admin",
        isLoading: false,
      });

      emailService.onUserRegistered({
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
      });

      if (data.codeParrainage) {
        toast.success("Inscription r\u00e9ussie ! Bonus parrainage appliqu\u00e9");
      } else {
        toast.success("Inscription r\u00e9ussie !");
      }
    } catch (error) {
      set({ isLoading: false });
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'inscription",
      );
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.logout();
      apiClient.setToken(null, null);

      if (typeof window !== "undefined") {
        localStorage.removeItem("coffice-auth");
      }

      set({ user: null, isAdmin: false, isInitialized: true });
      toast.success("Déconnexion réussie");
    } catch {
      apiClient.setToken(null, null);

      if (typeof window !== "undefined") {
        localStorage.removeItem("coffice-auth");
      }

      set({ user: null, isAdmin: false, isInitialized: true });
    }
  },

  updateProfile: async (data: Partial<User>) => {
    try {
      set({ isLoading: true });

      const currentUser = get().user;
      if (!currentUser) {
        throw new Error("Utilisateur non connecté");
      }

      const response = await apiClient.updateUser(currentUser.id, data);

      if (!response.success) {
        throw new Error(response.error || "Erreur lors de la mise à jour");
      }

      const updatedUser =
        response.data && typeof response.data === "object"
          ? adaptUser(response.data as Record<string, unknown>)
          : { ...currentUser, ...data };

      set({
        user: updatedUser,
        isAdmin: updatedUser.role === "admin",
        isLoading: false,
      });

      toast.success("Profil mis à jour");
    } catch (error) {
      set({ isLoading: false });
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour",
      );
      throw error;
    }
  },

  loadUser: async () => {
    try {
      const response = await apiClient.me();
      if (response.success && response.data) {
        const userData = adaptUser(response.data as Record<string, unknown>);
        set({ user: userData, isAdmin: userData.role === "admin" });
      }
    } catch (error) {
      logger.warn("loadUser failed:", error instanceof Error ? error.message : String(error));
    }
  },
}));
