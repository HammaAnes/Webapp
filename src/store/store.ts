import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "../lib/api-client";
import { logger } from "../utils/logger";
import { userService } from "../services/user.service";
import { useAuthStore } from "./authStore";
import toast from "react-hot-toast";
import {
  espaceAdapter,
  reservationAdapter,
  abonnementAdapter,
  userAdapter,
  domiciliationAdapter,
  codePromoAdapter,
} from "../adapters/index";
import type {
  User,
  Espace,
  Reservation,
  Transaction,
  DemandeDomiciliation,
  DomiciliationService,
  CodePromo,
  CreateReservationData,
  CreateDomiciliationData,
  Abonnement,
  AbonnementUtilisateur,
  NotificationSettings,
} from "../types";
import type { TypeEntreprise } from "../types";

function toLocalISOString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

interface AppState {
  users: User[];
  espaces: Espace[];
  reservations: Reservation[];
  transactions: Transaction[];
  demandesDomiciliation: DemandeDomiciliation[];
  domiciliationServices: DomiciliationService[];
  codesPromo: CodePromo[];
  abonnements: Abonnement[];
  abonnementsUtilisateurs: AbonnementUtilisateur[];
  notificationSettings: NotificationSettings;
  initialized: boolean;
  loading: boolean;
  initError: string | null;

  initializeData: (force?: boolean) => Promise<void>;

  loadAbonnements: () => Promise<void>;
  loadAbonnementsUtilisateurs: () => Promise<void>;
  addAbonnement: (
    data: Partial<Abonnement>,
  ) => Promise<{ success: boolean; error?: string }>;
  updateAbonnement: (
    id: string,
    data: Partial<Abonnement>,
  ) => Promise<{ success: boolean; error?: string }>;

  loadEspaces: () => Promise<void>;
  addEspace: (
    data: Partial<Espace>,
  ) => Promise<{ success: boolean; error?: string }>;
  updateEspace: (
    id: string,
    data: Partial<Espace>,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteEspace: (id: string) => Promise<{ success: boolean; error?: string }>;

  loadReservations: () => Promise<void>;
  createReservation: (
    data: CreateReservationData,
  ) => Promise<{ success: boolean; error?: string; id?: string }>;
  updateReservation: (
    id: string,
    data: Partial<Reservation>,
  ) => Promise<{ success: boolean; error?: string }>;

  loadCodesPromo: () => Promise<void>;

  loadDemandesDomiciliation: () => Promise<void>;
  getUserDemandeDomiciliation: (userId: string) => DemandeDomiciliation | null;
  createDemandeDomiciliation: (
    data: CreateDomiciliationData,
  ) => Promise<{ success: boolean; error?: string; id?: string }>;

  loadUsers: () => Promise<void>;
  addUser: (
    data: Partial<User>,
  ) => Promise<{ success: boolean; error?: string }>;
  updateUser: (userId: string, data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;

  getNotificationSettings: () => NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
}

const defaultNotificationSettings: NotificationSettings = {
  emailNotificationsEnabled: true,
  reservationReminders: true,
  paymentNotifications: true,
  maintenanceAlerts: true,
};

function extractArray(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") {
    const rd = data as Record<string, unknown>;
    if (Array.isArray(rd.data)) return rd.data as Record<string, unknown>[];
  }
  return [];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: [],
      espaces: [],
      reservations: [],
      transactions: [],
      demandesDomiciliation: [],
      domiciliationServices: [],
      codesPromo: [],
      abonnements: [],
      abonnementsUtilisateurs: [],
      notificationSettings: defaultNotificationSettings,
      initialized: false,
      loading: false,
      initError: null,

      initializeData: async (force = false) => {
        const state = get();
        if (!force && (state.loading || state.initialized)) return;
        set({ loading: true, initError: null });

        try {
          await get().loadEspaces();

          const user = useAuthStore.getState().user;
          const isAdmin = user?.role === "admin";

          await Promise.all([
            get().loadReservations(),
            get().loadDemandesDomiciliation(),
            get().loadAbonnements(),
            get().loadAbonnementsUtilisateurs(),
            isAdmin ? get().loadUsers() : Promise.resolve(),
            isAdmin ? get().loadCodesPromo() : Promise.resolve(),
          ]);

          set({ initialized: true, loading: false, initError: null });
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          logger.error("Erreur initialisation:", msg);
          set({ initialized: true, loading: false, initError: msg });
          if (msg.includes("Failed to fetch") || msg.includes("Impossible de contacter")) {
            toast.error("Impossible de contacter le serveur. Vérifiez votre connexion.");
          } else {
            toast.error("Erreur lors du chargement des données");
          }
        }
      },

      loadEspaces: async () => {
        try {
          const response = await apiClient.getEspaces();
          if (response.success && response.data) {
            const dataArray = extractArray(response.data);
            if (dataArray.length > 0 || Array.isArray(response.data)) {
              const espaces = dataArray.map((e) => espaceAdapter.fromAPI(e));
              set({ espaces });
            }
          }
        } catch (error) {
          logger.error("Erreur chargement espaces:", error instanceof Error ? error.message : String(error));
        }
      },

      addEspace: async (data) => {
        try {
          const apiData = espaceAdapter.toAPI(data);
          const response = await apiClient.createEspace(apiData as Record<string, unknown>);
          if (response.success) {
            await get().loadEspaces();
            return { success: true };
          }
          return { success: false, error: response.error };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      },

      updateEspace: async (id, data) => {
        try {
          const apiData = espaceAdapter.toAPI(data);
          const response = await apiClient.updateEspace(id, apiData as Record<string, unknown>);
          if (response.success) {
            await get().loadEspaces();
            return { success: true };
          }
          return { success: false, error: response.error };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      },

      deleteEspace: async (id) => {
        try {
          const response = await apiClient.deleteEspace(id);
          if (response.success) {
            await get().loadEspaces();
            return { success: true };
          }
          return { success: false, error: response.error };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      },

      loadAbonnements: async () => {
        try {
          const response = await apiClient.getAbonnements();
          if (response.success && response.data) {
            const rawData = extractArray(response.data);
            const abonnements = rawData.map((a: Record<string, unknown>) =>
              abonnementAdapter.fromAPI(a),
            );
            set({ abonnements });
          }
        } catch (error) {
          logger.error("Erreur chargement abonnements:", error instanceof Error ? error.message : String(error));
        }
      },

      loadAbonnementsUtilisateurs: async () => {
        try {
          const response = await apiClient.getAbonnementsUtilisateurs();
          if (response.success && response.data) {
            const rawData = extractArray(response.data);
            const abonnementsUtilisateurs = rawData.map((a: Record<string, unknown>) => ({
              id: String(a.id || ""),
              userId: String(a.user_id || ""),
              abonnementId: String(a.abonnement_id || ""),
              dateDebut: String(a.date_debut || ""),
              dateFin: String(a.date_fin || ""),
              statut: String(a.statut || "en_attente") as AbonnementUtilisateur["statut"],
              autoRenouvellement: Boolean(a.auto_renouvellement),
              commentaire: a.commentaire as string | undefined,
              dateDebutSouhaitee: a.date_debut_souhaitee as string | undefined,
              entreprise: a.entreprise as string | undefined,
              createdAt: a.created_at as string | undefined,
              updatedAt: a.updated_at as string | undefined,
            }));
            set({ abonnementsUtilisateurs });
          }
        } catch (error) {
          logger.error("Erreur chargement souscriptions:", error instanceof Error ? error.message : String(error));
        }
      },

      addAbonnement: async (data) => {
        try {
          const apiData = abonnementAdapter.toAPI(data);
          const response = await apiClient.createAbonnement(apiData);
          if (response.success) {
            await get().loadAbonnements();
            return { success: true };
          }
          return { success: false, error: response.error };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      },

      updateAbonnement: async (id, data) => {
        try {
          const apiData = abonnementAdapter.toAPI(data);
          const response = await apiClient.updateAbonnement(id, apiData);
          if (response.success) {
            await get().loadAbonnements();
            return { success: true };
          }
          return { success: false, error: response.error };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      },

      loadReservations: async () => {
        try {
          const response = await apiClient.getReservations();
          if (response.success && response.data) {
            const rawData = extractArray(response.data);
            const reservations = rawData.map((r: Record<string, unknown>) =>
              reservationAdapter.fromAPI(r),
            );
            set({ reservations });
          }
        } catch (error) {
          logger.error("Erreur chargement r\u00e9servations:", error instanceof Error ? error.message : String(error));
        }
      },

      createReservation: async (data: CreateReservationData) => {
        try {
          const response = await apiClient.createReservation({
            espaceId: data.espaceId,
            dateDebut: toLocalISOString(data.dateDebut),
            dateFin: toLocalISOString(data.dateFin),
            participants: data.participants,
            notes: data.notes,
            codePromo: data.codePromo,
          });

          if (response.success) {
            await get().loadReservations();
            const responseData = response.data as { id?: string } | undefined;
            return { success: true, id: responseData?.id };
          }
          return {
            success: false,
            error: response.error || "Erreur lors de la cr\u00e9ation",
          };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      },

      updateReservation: async (id, data) => {
        try {
          const apiData = reservationAdapter.toAPI(data);
          const response = await apiClient.updateReservation(id, apiData);
          if (response.success) {
            await get().loadReservations();
            return { success: true };
          }
          return { success: false, error: response.error };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      },

      loadCodesPromo: async () => {
        const user = useAuthStore.getState().user;
        if (user?.role !== "admin") return;
        try {
          const response = await apiClient.getCodesPromo();
          if (response.success && response.data) {
            const rawData = extractArray(response.data);
            const codesPromo = rawData.map((c) => codePromoAdapter.fromAPI(c));
            set({ codesPromo });
          }
        } catch (error) {
          logger.error("Erreur chargement codes promo:", error instanceof Error ? error.message : String(error));
        }
      },

      loadDemandesDomiciliation: async () => {
        try {
          const response = await apiClient.getDomiciliations();

          if (response.success && response.data) {
            const rawData = extractArray(response.data);

            const demandesDomiciliation = rawData.map((d) =>
              domiciliationAdapter.fromAPI(d),
            );

            const domiciliationServices = demandesDomiciliation
              .filter((d) => d.statut === "active" || d.statut === "domiciliation_creee")
              .map((d) => {
                const startDateStr = d.dateDebutContrat || d.dateValidation || d.dateCreation;
                const startDateRaw = startDateStr ? new Date(startDateStr as string) : null;
                const startDate = startDateRaw && !isNaN(startDateRaw.getTime()) ? startDateRaw : new Date(d.dateCreation as string);
                const endDateStr = d.dateFinContrat || null;
                let endDate: Date;
                if (endDateStr) {
                  const parsed = new Date(endDateStr as string);
                  endDate = !isNaN(parsed.getTime()) ? parsed : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
                } else if (!isNaN(startDate.getTime())) {
                  endDate = new Date(startDate);
                  endDate.setFullYear(endDate.getFullYear() + 1);
                } else {
                  endDate = new Date();
                  endDate.setFullYear(endDate.getFullYear() + 1);
                }

                return {
                  id: d.id,
                  userId: d.userId || "",
                  demande: d,
                  companyName: d.raisonSociale,
                  legalForm: d.formeJuridique || "",
                  identification: {
                    typeEntreprise: (d.formeJuridique?.toLowerCase() || "autre") as TypeEntreprise,
                    nif: d.nif,
                    nis: d.nis,
                    registreCommerce: d.registreCommerce,
                    articleImposition: d.articleImposition,
                    raisonSociale: d.raisonSociale,
                    dateCreation: d.dateCreationEntreprise ? new Date(d.dateCreationEntreprise as string) : undefined,
                    capital: d.capital,
                    siegeSocial: d.adresseSiegeSocial,
                    activitePrincipale: d.domaineActivite,
                  },
                  startDate,
                  endDate,
                  status: (d.statut === "active" ? "active" : "pending") as DomiciliationService["status"],
                  address: d.numeroBureau
                    ? `Bureau ${d.numeroBureau}, Mohammadia Mall, 4ème étage, Alger`
                    : "Mohammadia Mall, 4ème étage, Alger",
                  services: [
                    "Domiciliation",
                    "Courrier",
                    "Support administratif",
                  ],
                  monthlyFee: d.montantMensuel || 0,
                  setupFee: 0,
                  documentsLegaux: [],
                  representantLegal: {
                    nom: d.representantLegal?.nom || "",
                    prenom: d.representantLegal?.prenom || "",
                    fonction: d.representantLegal?.fonction,
                    telephone: d.representantLegal?.telephone || "",
                    email: d.representantLegal?.email || "",
                  },
                  activityDomain: d.domaineActivite,
                  dateSignatureContrat: d.dateValidation ? new Date(d.dateValidation as string) : undefined,
                  numeroContrat: `DOM-${d.id.substring(0, 8).toUpperCase()}`,
                  visibleSurSite: d.visibleSurSite || false,
                  createdAt: d.dateCreation ? new Date(d.dateCreation as string) : new Date(),
                  updatedAt: d.updatedAt ? new Date(d.updatedAt as string) : new Date(),
                };
              });

            set({ demandesDomiciliation, domiciliationServices });
          } else {
            set({ demandesDomiciliation: [], domiciliationServices: [] });
          }
        } catch (error) {
          logger.error("Erreur chargement domiciliations:", error instanceof Error ? error.message : String(error));
          set({ demandesDomiciliation: [], domiciliationServices: [] });
        }
      },

      getUserDemandeDomiciliation: (userId) => {
        if (!userId) return null;
        const userDemandes = get().demandesDomiciliation.filter((d) => d.userId === userId);
        if (userDemandes.length === 0) return null;
        const activePriority = ["active", "domiciliation_creee", "en_attente_complements", "en_attente_signature", "dossier_preparatoire"];
        for (const statut of activePriority) {
          const found = userDemandes.find((d) => d.statut === statut);
          if (found) return found;
        }
        const sorted = [...userDemandes].sort((a, b) => {
          const da = new Date(a.dateCreation || 0).getTime();
          const db = new Date(b.dateCreation || 0).getTime();
          return db - da;
        });
        return sorted[0] || null;
      },

      createDemandeDomiciliation: async (data) => {
        try {
          const response = await apiClient.createDemandeDomiciliation(data as unknown as Record<string, unknown>);
          if (response.success) {
            const responseData = response.data as Record<string, unknown> | undefined;
            const createdId = String(responseData?.id || responseData?.domiciliation_id || "");
            if (!createdId) {
              return { success: false, error: "L'identifiant de la domiciliation créée est manquant dans la réponse" };
            }
            await get().loadDemandesDomiciliation();
            return { success: true, id: createdId };
          }
          return { success: false, error: response.error || "Erreur création" };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      },

      loadUsers: async () => {
        try {
          const response = await apiClient.getUsers();
          if (response.success && response.data) {
            const rawData = extractArray(response.data);
            const users = rawData.map((u) => userAdapter.fromAPI(u));
            set({ users });
          }
        } catch (error) {
          logger.error("Erreur chargement utilisateurs:", error instanceof Error ? error.message : String(error));
        }
      },

      addUser: async (data) => {
        const result = await userService.adminCreateUser(data as { email: string; nom: string; prenom: string; telephone?: string; password?: string });

        if (result.success && result.user) {
          set({ users: [...get().users, result.user] });
        }

        return {
          success: result.success,
          error: result.error,
        };
      },

      updateUser: async (userId, data) => {
        try {
          const response = await apiClient.updateUser(userId, data);
          if (!response.success) {
            const errorMsg = response.error || "Erreur mise a jour";
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
          }

          const authState = useAuthStore.getState();
          const user = authState.user;
          const loadUser = authState.loadUser;

          if (user?.id === userId) {
            await loadUser();
          }

          if (user?.role === "admin") {
            await get().loadUsers();
          }

          toast.success("Informations mises a jour");
          return { success: true };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Erreur";
          toast.error(errorMsg);
          return { success: false, error: errorMsg };
        }
      },

      deleteUser: async (userId) => {
        try {
          const response = await apiClient.deleteUser(userId);
          if (response.success) {
            await get().loadUsers();
            return { success: true };
          }
          return { success: false, error: response.error };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      },

      getNotificationSettings: () => {
        return get().notificationSettings;
      },

      updateNotificationSettings: (settings) => {
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...settings },
        }));
      },
    }),
    {
      name: "coffice-app-storage",
      partialize: (state) => ({
        notificationSettings: state.notificationSettings,
      }),
    },
  ),
);
