import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "../lib/api-client";
import { logger } from "../utils/logger";
import toast from "react-hot-toast";
import {
  espaceAdapter,
  reservationAdapter,
  abonnementAdapter,
  userAdapter,
  domiciliationAdapter,
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
  AdminStats,
  Abonnement,
  AbonnementUtilisateur,
  NotificationSettings,
} from "../types";
import type { TypeEntreprise } from "../types";

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

  initializeData: () => Promise<void>;

  loadAbonnements: () => Promise<void>;
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
  calculateReservationAmount: (
    espaceId: string,
    dateDebut: Date,
    dateFin: Date,
    codePromo?: string,
  ) => number;

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
  updateUser: (userId: string, data: Record<string, unknown>) => Promise<void>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;

  getAdminStats: () => AdminStats;
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

      initializeData: async () => {
        const state = get();
        if (state.loading) return;

        set({ loading: true });

        try {
          await get().loadEspaces();

          await Promise.all([
            get().loadReservations(),
            get().loadUsers(),
            get().loadDemandesDomiciliation(),
            get().loadCodesPromo(),
            get().loadAbonnements(),
          ]);

          set({ initialized: true });
        } catch (error) {
          logger.error("Erreur initialisation:", error instanceof Error ? error.message : String(error));
          toast.error("Erreur lors du chargement des donn\u00e9es");
        } finally {
          set({ loading: false });
        }
      },

      loadEspaces: async () => {
        try {
          const response = await apiClient.getEspaces();
          if (response.success && response.data) {
            const raw = response.data;
            const dataArray = Array.isArray(raw) ? raw : (raw as Record<string, unknown>)?.espaces || (raw as Record<string, unknown>)?.data;
            if (Array.isArray(dataArray)) {
              const espaces = dataArray.map((e: Record<string, unknown>) =>
                espaceAdapter.fromAPI(e),
              );
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
          if (response.success && response.data && Array.isArray(response.data)) {
            const abonnements = response.data.map((a: Record<string, unknown>) =>
              abonnementAdapter.fromAPI(a),
            );
            set({ abonnements });
          }
        } catch (error) {
          logger.error("Erreur chargement abonnements:", error instanceof Error ? error.message : String(error));
        }
      },

      addAbonnement: async (data) => {
        try {
          const response = await apiClient.createAbonnement(data as Record<string, unknown>);
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
          const response = await apiClient.updateAbonnement(id, data as Record<string, unknown>);
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
          if (response.success && response.data && Array.isArray(response.data)) {
            const reservations = response.data.map((r: Record<string, unknown>) =>
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
            dateDebut: data.dateDebut.toISOString(),
            dateFin: data.dateFin.toISOString(),
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
          const response = await apiClient.updateReservation(id, data as Record<string, unknown>);
          if (response.success) {
            await get().loadReservations();
            return { success: true };
          }
          return { success: false, error: response.error };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      },

      calculateReservationAmount: (espaceId, dateDebut, dateFin, codePromo) => {
        const espace = get().espaces.find((e) => e.id === espaceId);
        if (!espace) return 0;

        const diffMs = dateFin.getTime() - dateDebut.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        let amount = 0;

        if (diffHours <= 4 && espace.prixDemiJournee > 0) {
          amount = espace.prixDemiJournee;
        } else if (diffHours < 24) {
          amount = Math.ceil(diffHours) * espace.prixHeure;
        } else {
          const diffDays = Math.ceil(diffHours / 24);

          if (diffDays >= 7 && espace.prixSemaine) {
            const weeks = Math.floor(diffDays / 7);
            const remainingDays = diffDays % 7;
            amount =
              weeks * espace.prixSemaine + remainingDays * espace.prixJour;
          } else {
            amount = diffDays * espace.prixJour;
          }
        }

        amount = Math.round(amount);

        if (codePromo) {
          const now = new Date();
          const promo = get().codesPromo.find(
            (c) =>
              c.code === codePromo &&
              c.actif &&
              c.utilisationsActuelles < c.utilisationsMax &&
              (!c.dateDebut || new Date(c.dateDebut) <= now) &&
              (!c.dateFin || new Date(c.dateFin) >= now),
          );

          if (promo) {
            if (promo.montantMin && amount < promo.montantMin) {
              return amount;
            }

            let reduction = 0;
            if (promo.type === "pourcentage") {
              reduction = amount * (promo.valeur / 100);
            } else {
              reduction = promo.valeur;
            }

            if (promo.montantMaxReduction) {
              reduction = Math.min(reduction, promo.montantMaxReduction);
            }

            amount = Math.max(0, amount - Math.round(reduction));
          }
        }

        return amount;
      },

      loadCodesPromo: async () => {
        try {
          const response = await apiClient.getCodesPromo();
          if (response.success && response.data) {
            const rawData = extractArray(response.data);
            const codesPromo = rawData.map((c) => ({
              id: String(c.id || ""),
              code: String(c.code || ""),
              type: String(c.type || "pourcentage") as CodePromo["type"],
              valeur: Number(c.valeur || 0),
              dateDebut: c.date_debut ? new Date(String(c.date_debut)) : new Date(),
              dateFin: c.date_fin ? new Date(String(c.date_fin)) : new Date(),
              utilisationsMax: Number(c.utilisations_max || 0),
              utilisationsActuelles: Number(c.utilisations_actuelles || 0),
              actif: Boolean(c.actif),
              description: c.description as string | undefined,
              conditions: c.conditions as string | undefined,
              montantMin: c.montant_min != null ? Number(c.montant_min) : undefined,
              montantMaxReduction: c.montant_max_reduction != null ? Number(c.montant_max_reduction) : undefined,
              utilisationsParUser: c.utilisations_par_user != null ? Number(c.utilisations_par_user) : undefined,
              createdAt: c.created_at ? new Date(String(c.created_at)) : new Date(),
              updatedAt: c.updated_at ? new Date(String(c.updated_at)) : new Date(),
            })) as CodePromo[];
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
                const startDate = new Date(startDateStr as string);
                const endDateStr = d.dateFinContrat || null;
                let endDate: Date;
                if (endDateStr) {
                  endDate = new Date(endDateStr as string);
                } else if (!isNaN(startDate.getTime())) {
                  endDate = new Date(startDate);
                  endDate.setFullYear(endDate.getFullYear() + 1);
                } else {
                  endDate = new Date();
                  endDate.setFullYear(endDate.getFullYear() + 1);
                }

                return {
                  id: d.id,
                  userId: d.userId,
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
                  address: "Mohammadia Mall, 4\u00e8me \u00e9tage, Bureau 1178, Alger",
                  services: [
                    "Domiciliation",
                    "Courrier",
                    "Support administratif",
                  ],
                  monthlyFee: d.montantMensuel || 12000,
                  setupFee: 0,
                  documentsLegaux: [],
                  representantLegal: d.representantLegal,
                  activityDomain: d.domaineActivite,
                  dateSignatureContrat: d.dateValidation ? new Date(d.dateValidation as string) : undefined,
                  numeroContrat: `DOM-${d.id.substring(0, 8).toUpperCase()}`,
                  visibleSurSite: d.visibleSurSite || false,
                  createdAt: d.dateCreation ? new Date(d.dateCreation as string) : new Date(),
                  updatedAt: d.updatedAt ? new Date(d.updatedAt as string) : new Date(),
                };
              });

            set({ demandesDomiciliation, domiciliationServices: domiciliationServices as unknown as DomiciliationService[] });
          } else {
            set({ demandesDomiciliation: [], domiciliationServices: [] });
          }
        } catch (error) {
          logger.error("Erreur chargement domiciliations:", error instanceof Error ? error.message : String(error));
          set({ demandesDomiciliation: [], domiciliationServices: [] });
        }
      },

      getUserDemandeDomiciliation: (userId) => {
        const userDemandes = get().demandesDomiciliation.filter((d) => d.userId === userId);
        if (userDemandes.length === 0) return null;
        const activePriority = ["active", "domiciliation_creee", "en_attente_complements", "en_attente_signature", "dossier_preparatoire"];
        for (const statut of activePriority) {
          const found = userDemandes.find((d) => d.statut === statut);
          if (found) return found;
        }
        return userDemandes[userDemandes.length - 1];
      },

      createDemandeDomiciliation: async (data) => {
        try {
          const response = await apiClient.createDemandeDomiciliation(data as unknown as Record<string, unknown>);
          if (response.success) {
            const responseData = response.data as Record<string, unknown> | undefined;
            const createdId = String(responseData?.id || responseData?.domiciliation_id || "");
            await get().loadDemandesDomiciliation();
            if (!createdId) {
              const userDemandes = get().demandesDomiciliation.filter(d => d.userId === (data as unknown as Record<string, unknown>).userId);
              const latest = userDemandes.sort((a, b) => new Date(b.dateCreation as string).getTime() - new Date(a.dateCreation as string).getTime())[0];
              return { success: true, id: latest?.id || "" };
            }
            return { success: true, id: createdId };
          }
          return { success: false, error: response.error || "Erreur cr\u00e9ation" };
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
        try {
          const response = await apiClient.register({
            email: data.email || "",
            password: data.password || "",
            nom: data.nom || "",
            prenom: data.prenom || "",
            telephone: data.telephone,
            profession: data.profession,
            entreprise: data.entreprise,
          });

          if (response.success) {
            await get().loadUsers();
            return { success: true };
          }
          return { success: false, error: response.error };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      },

      updateUser: async (userId, data) => {
        try {
          const response = await apiClient.updateUser(userId, data);
          if (!response.success) {
            throw new Error(response.error || "Erreur mise \u00e0 jour");
          }

          const { useAuthStore: authStoreRef } = await import("./authStore");
          const { user, loadUser } = authStoreRef.getState();

          if (user?.id === userId) {
            await loadUser();
          }

          if (user?.role === "admin") {
            await get().loadUsers();
          }

          toast.success("Informations mises \u00e0 jour");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Erreur");
          throw error;
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

      getAdminStats: () => {
        const state = get();
        const today = new Date();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();

        const now = new Date();
        const activeReservations = state.reservations.filter((r) => {
          const start = new Date(r.dateDebut);
          const end = new Date(r.dateFin);
          return r.statut === "confirmee" && start <= now && end >= now;
        });

        const reservationsCeMois = state.reservations.filter((r) => {
          const date = new Date(r.dateCreation || r.createdAt || new Date());
          return (
            date.getMonth() === thisMonth && date.getFullYear() === thisYear
          );
        });

        const caMois = reservationsCeMois.reduce(
          (sum, r) => sum + (r.montantTotal || 0),
          0,
        );

        const totalCapacity = state.espaces.reduce((sum, e) => sum + (e.capacite || 1), 0);
        const occupiedCapacity = activeReservations.reduce((sum, r) => {
          const espace = state.espaces.find((e) => e.id === r.espaceId || e.id === r.espace?.id);
          return sum + (espace?.capacite || 1);
        }, 0);
        const tauxOccupation = totalCapacity > 0
          ? Math.round((occupiedCapacity / totalCapacity) * 100)
          : 0;

        return {
          totalRevenue: state.reservations.reduce(
            (sum, r) => sum + (r.montantTotal || 0),
            0,
          ),
          totalReservations: state.reservations.length,
          totalUsers: state.users.length,
          activeUsers: state.users.filter((u) => u.statut === "actif").length,
          occupancyRate: Math.min(tauxOccupation, 100),
          tauxOccupation: Math.min(tauxOccupation, 100),
          monthlyRevenue: caMois,
          caMois,
          reservationsCeMois: reservationsCeMois.length,
          popularSpaces: state.espaces.map((e) => ({
            name: e.nom,
            count: state.reservations.filter((r) => r.espaceId === e.id).length,
          })).sort((a, b) => b.count - a.count).slice(0, 5),
          recentActivity: state.reservations
            .slice()
            .sort((a, b) => {
              const da = new Date(a.dateCreation || a.createdAt || 0).getTime();
              const db = new Date(b.dateCreation || b.createdAt || 0).getTime();
              return db - da;
            })
            .slice(0, 10)
            .map((r) => ({
              type: "reservation",
              description: `R\u00e9servation ${r.espace?.nom || "Espace"}`,
              date: new Date(r.dateCreation || r.createdAt || new Date()),
            })),
        };
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
