import { objectToSnakeCase } from "../utils/case-converter";
import { logger } from "../utils/logger";
import {
  AppError,
  ErrorCode,
  ApiResponse,
  createErrorResponse,
  createSuccessResponse,
} from "../utils/error-handler";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/api";

const PUBLIC_ENDPOINTS = [
  "/auth/login.php",
  "/auth/register.php",
  "/auth/forgot-password.php",
  "/auth/reset-password.php",
  "/auth/verify-reset-token.php",
  "/espaces/index.php",
  "/auth/google.php",
];

interface TokenPayload {
  exp: number;
  user_id: string;
  role: string;
}

class ApiClientV2 {
  private static instance: ApiClientV2;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  private constructor() {
    this.initializeTokens();
    logger.info("API Client V2 initialized");
  }

  static getInstance(): ApiClientV2 {
    if (!ApiClientV2.instance) {
      ApiClientV2.instance = new ApiClientV2();
    }
    return ApiClientV2.instance;
  }

  private initializeTokens(): void {
    if (typeof window !== "undefined") {
      this.token = this.getStoredToken();
      this.refreshToken = this.getStoredRefreshToken();
    }
  }

  private get storage(): Storage {
    if (typeof window === "undefined") {
      throw new Error("Storage not available");
    }
    return sessionStorage.getItem("coffice-session-only") === "1"
      ? sessionStorage
      : localStorage;
  }

  private getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token")
    );
  }

  private getStoredRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("refresh_token") ||
      sessionStorage.getItem("refresh_token")
    );
  }

  setToken(token: string | null, refreshToken?: string | null): void {
    this.token = token;

    if (typeof window !== "undefined") {
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
  }

  getToken(): string | null {
    if (typeof window !== "undefined" && !this.token) {
      this.token = this.getStoredToken();
    }
    return this.token;
  }

  clearAuth(): void {
    this.token = null;
    this.refreshToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("refresh_token");
    }
  }

  private decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );

      return payload;
    } catch (error) {
      logger.error("Failed to decode token", error);
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return true;

    const exp = payload.exp * 1000;
    const now = Date.now();

    return now >= exp;
  }

  private isTokenExpiringSoon(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return false;

    const exp = payload.exp * 1000;
    const now = Date.now();
    const timeLeft = exp - now;

    return timeLeft < 5 * 60 * 1000;
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getStoredRefreshToken();

        if (!refreshToken) {
          throw new AppError(
            "Session expirée",
            ErrorCode.UNAUTHORIZED
          );
        }

        const response = await fetch(`${API_URL}/auth/refresh.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
          throw new AppError(
            "Impossible de renouveler la session",
            ErrorCode.UNAUTHORIZED
          );
        }

        const data = await response.json();

        if (!data.success || !data.data?.token) {
          throw new AppError(
            data.error || "Échec du renouvellement de session",
            ErrorCode.UNAUTHORIZED
          );
        }

        this.setToken(data.data.token, data.data.refresh_token);
        return data.data.token;
      } catch (error) {
        this.clearAuth();
        throw error instanceof AppError
          ? error
          : new AppError("Erreur de renouvellement de session", ErrorCode.UNAUTHORIZED);
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private isPublicEndpoint(url: string): boolean {
    return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
  }

  async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_URL}${endpoint}`;
      const isPublic = this.isPublicEndpoint(url);

      let token = this.getToken();

      if (!isPublic) {
        if (!token) {
          this.clearAuth();
          window.location.href = "/connexion?session_expired=1";
          throw new AppError("Session expirée", ErrorCode.UNAUTHORIZED);
        }
        if (this.isTokenExpired(token)) {
          token = await this.refreshAccessToken();
        } else if (this.isTokenExpiringSoon(token)) {
          this.refreshAccessToken().catch(() => {});
        }
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      if (!isPublic && token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401 && !isPublic) {
        try {
          token = await this.refreshAccessToken();
          headers["Authorization"] = `Bearer ${token}`;

          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });

          return this.handleResponse<T>(retryResponse);
        } catch (error) {
          this.clearAuth();
          window.location.href = "/connexion?session_expired=1";
          throw new AppError("Session expirée", ErrorCode.UNAUTHORIZED);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof AppError) {
        return createErrorResponse(error.message, error.code);
      }

      logger.error("API request failed", error);

      if (error instanceof TypeError && error.message.includes("fetch")) {
        return createErrorResponse(
          "Erreur de connexion au serveur",
          ErrorCode.NETWORK_ERROR
        );
      }

      return createErrorResponse(
        "Une erreur inattendue s'est produite",
        ErrorCode.UNKNOWN_ERROR
      );
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new AppError(
          "Réponse invalide du serveur",
          ErrorCode.SERVER_ERROR
        );
      }

      const data = await response.json();

      if (!response.ok) {
        const errorCode = this.mapHttpStatusToErrorCode(response.status);
        return createErrorResponse(
          data.error || data.message || "Erreur serveur",
          errorCode,
          data
        );
      }

      if (data.success === false) {
        return createErrorResponse(
          data.error || data.message || "Opération échouée",
          ErrorCode.UNKNOWN_ERROR,
          data
        );
      }

      return createSuccessResponse<T>(data.data ?? data);
    } catch (error) {
      logger.error("Failed to handle response", error);

      if (error instanceof AppError) {
        return createErrorResponse(error.message, error.code);
      }

      return createErrorResponse(
        "Erreur lors du traitement de la réponse",
        ErrorCode.SERVER_ERROR
      );
    }
  }

  private mapHttpStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case 400:
        return ErrorCode.VALIDATION_ERROR;
      case 401:
        return ErrorCode.UNAUTHORIZED;
      case 403:
        return ErrorCode.FORBIDDEN;
      case 404:
        return ErrorCode.NOT_FOUND;
      case 500:
      case 502:
      case 503:
        return ErrorCode.SERVER_ERROR;
      default:
        return ErrorCode.UNKNOWN_ERROR;
    }
  }

  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T = unknown>(
    endpoint: string,
    data: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(objectToSnakeCase(data)),
    });
  }

  async put<T = unknown>(
    endpoint: string,
    data: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(objectToSnakeCase(data)),
    });
  }

  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async uploadFile<T = unknown>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_URL}${endpoint}`;
      const token = this.getToken();

      const formData = new FormData();
      formData.append("file", file);

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      logger.error("File upload failed", error);
      return createErrorResponse(
        "Erreur lors de l'envoi du fichier",
        ErrorCode.NETWORK_ERROR
      );
    }
  }
}

export const apiClientV2 = ApiClientV2.getInstance();
