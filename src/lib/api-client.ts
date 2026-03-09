/**
 * Client API pour MySQL/PHP Backend
 * Version optimisée sans console.log
 */

import { objectToSnakeCase } from "../utils/case-converter";
import { logger } from "../utils/logger";
import { ERROR_MESSAGES } from "../constants/messages";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/api";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;
  private lastAuthErrorTime = 0;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
      this.refreshToken = localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token");
    }

    if (!import.meta.env.VITE_API_URL) {
      logger.warn(`[API] VITE_API_URL non configuré, utilisation par défaut: ${API_URL}`);
    } else {
      logger.info(`[API] URL configurée: ${API_URL}`);
    }

    logger.info("API Client initialized");
  }

  private get storage(): Storage {
    if (typeof window !== "undefined" && sessionStorage.getItem("coffice-session-only") === "1") {
      return sessionStorage;
    }
    return localStorage;
  }

  setToken(token: string | null, refreshToken?: string | null) {
    this.token = token;
    if (token) {
      this.storage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
      sessionStorage.removeItem("auth_token");
    }

    if (refreshToken !== undefined) {
      this.refreshToken = refreshToken;
      if (refreshToken) {
        this.storage.setItem("refresh_token", refreshToken);
      } else {
        localStorage.removeItem("refresh_token");
        sessionStorage.removeItem("refresh_token");
      }
    }
  }

  getToken(): string | null {
    if (typeof window !== "undefined") {
      this.token = this.storage.getItem("auth_token") || localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    }
    return this.token;
  }

  getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      this.refreshToken = this.storage.getItem("refresh_token") || localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token");
    }
    return this.refreshToken;
  }

  private isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const parts = token.split(".");
      if (parts.length !== 3) return true;

      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      const exp = payload.exp * 1000;
      const now = Date.now();

      return now >= exp;
    } catch {
      return true;
    }
  }

  private isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const parts = token.split(".");
      if (parts.length !== 3) return false;

      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      const exp = payload.exp * 1000;
      const now = Date.now();
      const timeLeft = exp - now;

      return timeLeft < 5 * 60 * 1000;
    } catch {
      return false;
    }
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await fetch(`${API_URL}/auth/refresh.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
          throw new Error("Failed to refresh token");
        }

        const data = await response.json();

        if (data.success && data.data) {
          const newToken = data.data.token || data.data.access_token;
          const newRefresh = data.data.refresh_token || data.data.refreshToken;
          this.setToken(newToken, newRefresh);
          return newToken;
        }

        throw new Error("Invalid refresh response");
      } catch (error) {
        this.handleAuthError();
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryWithRefresh = true,
    retryCount = 0,
  ): Promise<ApiResponse<T>> {
    const MAX_RETRIES = 3;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    const publicEndpoints = ["/auth/login.php", "/auth/register.php", "/auth/forgot-password.php", "/auth/verify-reset-token.php", "/auth/reset-password.php", "/domiciliations/public-stats.php", "/espaces/index.php", "/parrainages/verify.php"];
    const isPublicEndpoint = publicEndpoints.some((ep) =>
      endpoint.includes(ep),
    );

    if (!isPublicEndpoint) {
      if (this.isTokenExpired()) {
        logger.debug("Token expired, refreshing before request");
        try {
          await this.refreshAccessToken();
        } catch (error) {
          logger.error("Cannot refresh expired token:", error instanceof Error ? error.message : String(error));
          this.handleAuthError();
          return {
            success: false,
            error: ERROR_MESSAGES.SESSION_EXPIRED,
          };
        }
      } else if (this.isTokenExpiringSoon() && retryWithRefresh) {
        logger.debug("Token expires soon, refreshing proactively");
        try {
          await this.refreshAccessToken();
        } catch (error) {
          logger.warn(
            "Proactive refresh failed, continuing with current token",
          );
        }
      }

      const currentToken = this.getToken();
      if (!currentToken) {
        logger.error("No token available for authenticated endpoint");
        this.handleAuthError();
        return {
          success: false,
          error: ERROR_MESSAGES.UNAUTHORIZED,
        };
      }

      headers["Authorization"] = `Bearer ${currentToken}`;
    }

    const url = `${API_URL}${endpoint}`;
    logger.debug(`Request: ${options.method || "GET"} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      logger.debug(`Response status: ${response.status}`);

      let data: Record<string, unknown>;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          if (response.ok) {
            data = { success: true };
          } else {
            throw new Error(
              `Erreur serveur (${response.status}): Réponse vide du serveur`,
            );
          }
        } else {
          try {
            data = JSON.parse(text);
          } catch {
            logger.error("[API] Invalid JSON response:", {
              url,
              status: response.status,
              preview: text.substring(0, 200),
            });
            throw new Error(
              `Erreur serveur (${response.status}): Réponse JSON invalide`,
            );
          }
        }
      } else {
        const text = await response.text();
        logger.error("[API] Non-JSON response:", {
          url,
          status: response.status,
          contentType,
          preview: text.substring(0, 200),
        });

        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          logger.debug(
            `Server error, retrying... (${retryCount + 1}/${MAX_RETRIES})`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retryCount + 1)),
          );
          return this.request<T>(
            endpoint,
            options,
            retryWithRefresh,
            retryCount + 1,
          );
        }

        throw new Error(
          `Erreur serveur (${response.status}): Le serveur n'a pas renvoyé de réponse JSON valide`,
        );
      }

      if (response.status === 401) {
        logger.error("401 Unauthorized received");

        if (retryWithRefresh && !isPublicEndpoint) {
          logger.debug("Attempting token refresh after 401");
          try {
            await this.refreshAccessToken();
            logger.debug("Token refreshed successfully, retrying request");
            return this.request<T>(endpoint, options, false, retryCount);
          } catch (refreshError) {
            logger.error("Refresh failed after 401:", refreshError instanceof Error ? refreshError.message : String(refreshError));
            this.handleAuthError();
            throw new Error((data.error as string) || ERROR_MESSAGES.SESSION_EXPIRED);
          }
        } else {
          this.handleAuthError();
          throw new Error((data.error as string) || ERROR_MESSAGES.SESSION_EXPIRED);
        }
      }

      if (!response.ok) {
        throw new Error(
          (data.error as string) || (data.message as string) || ERROR_MESSAGES.SERVER_ERROR,
        );
      }

      return data as unknown as ApiResponse<T>;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("[API] Request failed:", {
        url,
        method: options.method || "GET",
        error: errorMessage,
      });

      if (errorMessage === "Failed to fetch" && retryCount < MAX_RETRIES) {
        logger.debug(
          `Network error, retrying... (${retryCount + 1}/${MAX_RETRIES})`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1)),
        );
        return this.request<T>(
          endpoint,
          options,
          retryWithRefresh,
          retryCount + 1,
        );
      }

      if (errorMessage === "Failed to fetch") {
        return {
          success: false,
          error: `Impossible de contacter l'API (${API_URL}). Vérifiez que le serveur est accessible.`,
        };
      }

      return {
        success: false,
        error: errorMessage || ERROR_MESSAGES.UNKNOWN_ERROR,
      };
    }
  }

  private handleAuthError() {
    const now = Date.now();
    if (now - this.lastAuthErrorTime < 2000) return;
    this.lastAuthErrorTime = now;

    logger.warn("Session expired - cleaning up");
    this.setToken(null, null);

    if (typeof window !== "undefined") {
      localStorage.removeItem("coffice-auth");

      const protectedPaths = [
        "/app",
        "/erp",
        "/dashboard",
        "/tableau-de-bord",
        "/admin",
        "/profil",
        "/reservations",
        "/mes-reservations",
      ];
      const currentPath = window.location.pathname;
      const isProtectedPage = protectedPaths.some(
        (path) => currentPath.startsWith(path) || currentPath.includes(path),
      );

      if (isProtectedPage && !currentPath.includes("/connexion")) {
        logger.info("Redirecting to login - session expired");
        window.location.href = "/connexion?session_expired=1";
      }
    }
  }

  async login(email: string, password: string) {
    return this.request("/auth/login.php", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    nom: string;
    prenom: string;
    telephone?: string;
    profession?: string;
    entreprise?: string;
    codeParrainage?: string;
  }) {
    const snakeCaseData = objectToSnakeCase(data);
    return this.request("/auth/register.php", {
      method: "POST",
      body: JSON.stringify(snakeCaseData),
    });
  }

  async me() {
    return this.request("/auth/me.php");
  }

  async logout() {
    try {
      await this.request("/auth/logout.php", {
        method: "POST",
      });
    } catch (error) {
      logger.warn("Error calling logout API:", error instanceof Error ? error.message : String(error));
    } finally {
      this.setToken(null, null);
    }
    return { success: true, message: "Déconnexion réussie" };
  }

  // ============= UTILISATEURS =============
  async getUsers() {
    return this.request("/users/index.php");
  }

  async getUser(id: string) {
    return this.request(`/users/show.php?id=${id}`);
  }

  async updateUser(id: string, data: Record<string, unknown>) {
    const snakeCaseData = objectToSnakeCase(data);
    return this.request(`/users/update.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(snakeCaseData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/delete.php?id=${id}`, {
      method: "DELETE",
    });
  }

  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint);
  }

  // ============= ESPACES =============
  async getEspaces() {
    return this.request("/espaces/index.php");
  }

  async getEspace(id: string) {
    return this.request(`/espaces/show.php?id=${id}`);
  }

  async createEspace(data: Record<string, unknown>) {
    const snakeCaseData = objectToSnakeCase(data);
    return this.request("/espaces/create.php", {
      method: "POST",
      body: JSON.stringify(snakeCaseData),
    });
  }

  async updateEspace(id: string, data: Record<string, unknown>) {
    const snakeCaseData = objectToSnakeCase(data);
    return this.request("/espaces/update.php", {
      method: "PUT",
      body: JSON.stringify({ id, ...snakeCaseData }),
    });
  }

  async deleteEspace(id: string) {
    return this.request("/espaces/delete.php", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  }

  // ============= RÉSERVATIONS =============
  async getReservations(userId?: string) {
    const query = userId ? `?user_id=${userId}` : "";
    return this.request(`/reservations/index.php${query}`);
  }

  async getReservation(id: string) {
    return this.request(`/reservations/show.php?id=${id}`);
  }

  async createReservation(data: {
    espaceId: string;
    dateDebut: string;
    dateFin: string;
    participants?: number;
    notes?: string;
    codePromo?: string;
  }) {
    const apiData: Record<string, unknown> = {
      espace_id: data.espaceId,
      date_debut: data.dateDebut,
      date_fin: data.dateFin,
      participants: data.participants || 1,
      notes: data.notes || "",
    };

    if (data.codePromo) {
      apiData.code_promo = data.codePromo;
    }

    return this.request("/reservations/create.php", {
      method: "POST",
      body: JSON.stringify(apiData),
    });
  }

  async updateReservation(id: string, data: Record<string, unknown>) {
    const snakeCaseData = objectToSnakeCase(data);
    return this.request("/reservations/update.php", {
      method: "PUT",
      body: JSON.stringify({ id, ...snakeCaseData }),
    });
  }

  async cancelReservation(id: string) {
    return this.request("/reservations/cancel.php", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  }

  // ============= DOMICILIATION =============
  async getDomiciliations() {
    return this.request("/domiciliations/index.php");
  }

  async createDemandeDomiciliation(data: Record<string, unknown> & {
    representantLegal?: {
      nom: string;
      prenom: string;
      fonction?: string;
      telephone: string;
      email: string;
      adresseResidence?: string;
      ville?: string;
    };
    options?: Record<string, boolean>;
  }) {
    const transformedData: Record<string, unknown> = { ...data };

    if (data.representantLegal) {
      transformedData.representant_nom = data.representantLegal.nom;
      transformedData.representant_prenom = data.representantLegal.prenom;
      transformedData.representant_fonction = data.representantLegal.fonction || "";
      transformedData.representant_telephone = data.representantLegal.telephone;
      transformedData.representant_email = data.representantLegal.email;
      transformedData.representant_adresse_residence = data.representantLegal.adresseResidence || "";
      transformedData.representant_ville = data.representantLegal.ville || "";
      delete transformedData.representantLegal;
    }

    if (data.options) {
      transformedData.options = JSON.stringify(data.options);
    }

    const snakeCaseData = objectToSnakeCase(transformedData);
    return this.request("/domiciliations/create.php", {
      method: "POST",
      body: JSON.stringify(snakeCaseData),
    });
  }

  async updateDemandeDomiciliation(id: string, data: Record<string, unknown> & { representantLegal?: { nom?: string; prenom?: string; fonction?: string; telephone?: string; email?: string; adresseResidence?: string; ville?: string } }) {
    const transformedData: Record<string, unknown> = { id, ...data };

    if (data.representantLegal) {
      if (data.representantLegal.nom !== undefined) transformedData.representant_nom = data.representantLegal.nom;
      if (data.representantLegal.prenom !== undefined) transformedData.representant_prenom = data.representantLegal.prenom;
      if (data.representantLegal.fonction !== undefined) transformedData.representant_fonction = data.representantLegal.fonction;
      if (data.representantLegal.telephone !== undefined) transformedData.representant_telephone = data.representantLegal.telephone;
      if (data.representantLegal.email !== undefined) transformedData.representant_email = data.representantLegal.email;
      if (data.representantLegal.adresseResidence !== undefined) transformedData.representant_adresse_residence = data.representantLegal.adresseResidence;
      if (data.representantLegal.ville !== undefined) transformedData.representant_ville = data.representantLegal.ville;
      delete transformedData.representantLegal;
    }

    const snakeCaseData = objectToSnakeCase(transformedData);
    return this.request("/domiciliations/update.php", {
      method: "PUT",
      body: JSON.stringify(snakeCaseData),
    });
  }

  async validateDomiciliation(id: string, commentaire?: string) {
    const data: Record<string, unknown> = {
      id,
      statut: "en_attente_signature",
      date_validation: new Date().toISOString(),
    };
    if (commentaire) data.commentaire_admin = commentaire;
    return this.request("/domiciliations/update.php", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async rejectDomiciliation(id: string, motif: string) {
    return this.request("/domiciliations/update.php", {
      method: "PUT",
      body: JSON.stringify({
        id,
        statut: "refusee",
        commentaire_admin: motif,
      }),
    });
  }

  async activateDomiciliation(id: string) {
    return this.request("/domiciliations/update.php", {
      method: "PUT",
      body: JSON.stringify({
        id,
        statut: "active",
      }),
    });
  }

  async getPublicDomiciliationStats() {
    return this.request("/domiciliations/public-stats.php", {
      method: "GET",
    });
  }

  // ============= COURRIER =============
  async getUserCourrier(domiciliationId: string) {
    return this.request(`/admin/courrier.php?domiciliation_id=${domiciliationId}`);
  }

  async updateCourrier(courrierId: string, data: Record<string, unknown>) {
    return this.request(`/admin/courrier.php`, {
      method: "PUT",
      body: JSON.stringify(objectToSnakeCase({ id: courrierId, ...data })),
    });
  }

  async createCourrier(data: Record<string, unknown>) {
    return this.request(`/admin/courrier.php`, {
      method: "POST",
      body: JSON.stringify(objectToSnakeCase(data)),
    });
  }

  // ============= DOCUMENTS =============
  private normalizeDocument(doc: Record<string, unknown>): Record<string, unknown> {
    return {
      ...doc,
      document_type: doc.document_type || doc.type_document || "",
      file_name: doc.file_name || doc.nom_original || doc.nom_fichier || "",
      file_size: doc.file_size || doc.taille || null,
      created_at: doc.created_at || doc.uploaded_at || "",
      url: doc.url || doc.chemin_fichier || "",
      status: doc.status || "en_attente",
    };
  }

  async getDocuments(entityType: string, entityId: string) {
    const response = await this.request(`/documents/index.php?entity_type=${entityType}&entity_id=${entityId}`);
    if (response.success && response.data) {
      const raw = response.data as unknown;
      if (Array.isArray(raw)) {
        response.data = raw.map((d) => this.normalizeDocument(d as Record<string, unknown>)) as typeof response.data;
      } else if (raw && typeof raw === "object" && "documents" in (raw as Record<string, unknown>)) {
        const obj = raw as Record<string, unknown>;
        if (Array.isArray(obj.documents)) {
          obj.documents = obj.documents.map((d) => this.normalizeDocument(d as Record<string, unknown>));
          response.data = obj as typeof response.data;
        }
      }
    }
    return response;
  }

  async uploadDocument(file: File, entityType: string, entityId: string, documentType: string) {
    if (this.isTokenExpired()) {
      try {
        await this.refreshAccessToken();
      } catch {
        this.handleAuthError();
        return { success: false, error: ERROR_MESSAGES.SESSION_EXPIRED };
      }
    } else if (this.isTokenExpiringSoon()) {
      try {
        await this.refreshAccessToken();
      } catch {
        logger.warn("Proactive refresh failed before upload, continuing with current token");
      }
    }

    const token = this.getToken();
    if (!token) {
      this.handleAuthError();
      return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("entity_type", entityType);
    formData.append("entity_id", entityId);
    formData.append("document_type", documentType);

    const url = `${API_URL}/documents/upload.php`;

    const doUpload = async (authToken: string): Promise<ApiResponse> => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
        },
        body: formData,
      });

      const text = await response.text();

      let data: ApiResponse;
      try {
        data = text.trim() ? JSON.parse(text) : { success: false, error: `Erreur serveur (${response.status}): reponse vide` };
      } catch {
        const errDetail = `Status ${response.status} | Body: ${text.substring(0, 500)}`;
        return { success: false, error: errDetail };
      }

      if (response.status === 401 || response.status === 403) {
        return { ...data, _authFailed: true } as ApiResponse & { _authFailed: boolean };
      }

      if (!response.ok && data.success !== true) {
        const serverMsg = data.error || data.message || JSON.stringify(data);
        return { success: false, error: `Erreur ${response.status}: ${serverMsg}` };
      }

      return data;
    };

    const result = await doUpload(token);

    if ((result as unknown as Record<string, unknown>)._authFailed) {
      try {
        const newToken = await this.refreshAccessToken();
        return doUpload(newToken);
      } catch {
        this.handleAuthError();
        return { success: false, error: ERROR_MESSAGES.SESSION_EXPIRED };
      }
    }

    return result;
  }

  async downloadDocument(documentId: string) {
    return this.request(`/documents/download.php?id=${documentId}`);
  }

  async updateDocumentStatus(documentId: string, status: string) {
    return this.request(`/documents/update.php?id=${documentId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async deleteDocument(documentId: string) {
    return this.request(`/documents/delete.php?id=${documentId}`, {
      method: "DELETE",
    });
  }

  // ============= ABONNEMENTS =============
  async getAbonnements() {
    return this.request("/abonnements/index.php");
  }

  async createAbonnement(data: Record<string, unknown>) {
    const snakeCaseData = objectToSnakeCase(data);
    return this.request("/abonnements/create.php", {
      method: "POST",
      body: JSON.stringify(snakeCaseData),
    });
  }

  async updateAbonnement(id: string, data: Record<string, unknown>) {
    const snakeCaseData = objectToSnakeCase(data);
    return this.request("/abonnements/update.php", {
      method: "PUT",
      body: JSON.stringify({ id, ...snakeCaseData }),
    });
  }

  async deleteAbonnement(id: string) {
    return this.request("/abonnements/delete.php", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  }

  async souscrireAbonnement(data: Record<string, unknown>) {
    const snakeCaseData = objectToSnakeCase(data);
    return this.request("/abonnements/souscrire.php", {
      method: "POST",
      body: JSON.stringify(snakeCaseData),
    });
  }

  // ============= CODES PROMO =============
  async validateCodePromo(code: string, montant: number, type: string) {
    return this.request("/codes-promo/validate.php", {
      method: "POST",
      body: JSON.stringify({ code, montant, type }),
    }).then((response) => {
      if (response.success && response.data) {
        const data = response.data as { id?: string; code?: string; reduction?: number };
        return {
          valid: true,
          codePromoId: data.id || data.code,
          reduction: data.reduction || 0,
        };
      }
      return {
        valid: false,
        error: response.error || "Code invalide",
      };
    });
  }

  async getCodesPromo() {
    return this.request("/codes-promo/index.php");
  }

  async createCodePromo(data: Record<string, unknown>) {
    const snakeCaseData = objectToSnakeCase(data);
    return this.request("/codes-promo/create.php", {
      method: "POST",
      body: JSON.stringify(snakeCaseData),
    });
  }

  async updateCodePromo(id: string, data: Record<string, unknown>) {
    const snakeCaseData = objectToSnakeCase(data);
    return this.request(
      `/codes-promo/update.php?id=${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(snakeCaseData),
      },
    );
  }

  async deleteCodePromo(id: string) {
    return this.request(
      `/codes-promo/delete.php?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
  }

  // ============= PARRAINAGES =============
  async getParrainages(userId?: string) {
    const query = userId ? `?user_id=${userId}` : "";
    return this.request(`/parrainages/index.php${query}`);
  }

  async verifyCodeParrainage(code: string) {
    return this.request("/parrainages/verify.php", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  // ============= STATISTIQUES =============
  async getAdminStats() {
    return this.request("/admin/stats.php");
  }

  // ============= NOTIFICATIONS =============
  async getNotifications() {
    return this.request("/notifications/index.php");
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/read.php?id=${id}`, {
      method: "PUT",
    });
  }

  async markAllNotificationsRead() {
    return this.request("/notifications/read-all.php", {
      method: "PUT",
    });
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/delete.php?id=${id}`, {
      method: "DELETE",
    });
  }

  async post<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // ============= EMAIL =============
  async sendEmail(to: string, subject: string, html: string) {
    return this.request("/email/send.php", {
      method: "POST",
      body: JSON.stringify({ to, subject, html }),
    });
  }

  // ============= WALK-INS =============
  async createWalkIn(data: Record<string, unknown>) {
    const snakeCaseData = objectToSnakeCase(data);
    return this.request("/admin/walk-ins.php", {
      method: "POST",
      body: JSON.stringify(snakeCaseData),
    });
  }

  async updateWalkIn(id: string, data: Record<string, unknown>) {
    const snakeCaseData = objectToSnakeCase(data);
    return this.request(`/admin/walk-ins.php?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(snakeCaseData),
    });
  }

  // ============= BLOCAGES =============
  async getBlocages() {
    return this.request("/admin/blocages.php");
  }
}

export const apiClient = new ApiClient();
