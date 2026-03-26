import React, { useState, useEffect, useCallback } from "react";
import { version as APP_VERSION } from "../../../../../package.json";
import { Wrench, RefreshCw, CheckCircle, XCircle, BookOpen, Activity, Clock, AlertTriangle } from "lucide-react";
import Card from "../../../../components/ui/Card";
import Button from "../../../../components/ui/Button";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { useConfirm } from "../../../../hooks/useConfirm";
import { apiClient } from "../../../../lib/api-client";
import toast from "react-hot-toast";
import { logger } from "../../../../utils/logger";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// idle = pas encore testé, pending = en cours, ok = 2xx, auth = 401/403, accessible = 400/405, notfound = 404, error = 500+, timeout = réseau/timeout
type CheckStatus = "idle" | "pending" | "ok" | "auth" | "accessible" | "notfound" | "error" | "timeout";

interface EndpointDef {
  label: string;
  path: string;
  category: string;
  method: string;
}

interface EndpointResult extends EndpointDef {
  status: CheckStatus;
  statusCode?: number;
  latencyMs?: number;
  message?: string;
}

const DIAGNOSTIC_ENDPOINTS: EndpointDef[] = [
  // Système
  { label: "Health Check", path: "/health.php", category: "Système", method: "GET" },
  // Auth
  { label: "Profil courant (me)", path: "/auth/me.php", category: "Auth", method: "GET" },
  { label: "Login", path: "/auth/login.php", category: "Auth", method: "POST" },
  { label: "Register", path: "/auth/register.php", category: "Auth", method: "POST" },
  { label: "Logout", path: "/auth/logout.php", category: "Auth", method: "POST" },
  { label: "Refresh token", path: "/auth/refresh.php", category: "Auth", method: "POST" },
  { label: "Mot de passe oublié", path: "/auth/forgot-password.php", category: "Auth", method: "POST" },
  { label: "Réinitialiser MDP", path: "/auth/reset-password.php", category: "Auth", method: "POST" },
  { label: "Vérifier token reset", path: "/auth/verify-reset-token.php", category: "Auth", method: "POST" },
  { label: "Google OAuth", path: "/auth/google.php", category: "Auth", method: "POST" },
  // Admin
  { label: "Statistiques", path: "/admin/stats.php", category: "Admin", method: "GET" },
  { label: "Analytics", path: "/admin/analytics.php", category: "Admin", method: "GET" },
  { label: "Paramètres", path: "/admin/settings.php", category: "Admin", method: "GET" },
  { label: "Revenus", path: "/admin/revenue.php", category: "Admin", method: "GET" },
  { label: "Courrier admin", path: "/admin/courrier.php", category: "Admin", method: "GET" },
  { label: "Réception", path: "/admin/reception.php", category: "Admin", method: "GET" },
  { label: "Créer utilisateur", path: "/admin/users-create.php", category: "Admin", method: "POST" },
  // Utilisateurs
  { label: "Liste", path: "/users/index.php", category: "Utilisateurs", method: "GET" },
  { label: "Détail", path: "/users/show.php", category: "Utilisateurs", method: "GET" },
  { label: "Modifier", path: "/users/update.php", category: "Utilisateurs", method: "PUT" },
  { label: "Supprimer", path: "/users/delete.php", category: "Utilisateurs", method: "DELETE" },
  { label: "Profil 360°", path: "/users/profile360.php", category: "Utilisateurs", method: "GET" },
  { label: "Reset MDP (admin)", path: "/users/reset-password.php", category: "Utilisateurs", method: "POST" },
  // Personnes
  { label: "Liste", path: "/persons/index.php", category: "Personnes", method: "GET" },
  { label: "Détail", path: "/persons/show.php", category: "Personnes", method: "GET" },
  { label: "Créer", path: "/persons/create.php", category: "Personnes", method: "POST" },
  { label: "Modifier", path: "/persons/update.php", category: "Personnes", method: "PUT" },
  { label: "Supprimer", path: "/persons/delete.php", category: "Personnes", method: "DELETE" },
  { label: "Convertir en user", path: "/persons/convert-to-user.php", category: "Personnes", method: "POST" },
  // Contacts (legacy)
  { label: "Liste", path: "/contacts/index.php", category: "Contacts", method: "GET" },
  { label: "Détail", path: "/contacts/show.php", category: "Contacts", method: "GET" },
  { label: "Créer", path: "/contacts/create.php", category: "Contacts", method: "POST" },
  { label: "Modifier", path: "/contacts/update.php", category: "Contacts", method: "PUT" },
  { label: "Supprimer", path: "/contacts/delete.php", category: "Contacts", method: "DELETE" },
  { label: "Convertir en user", path: "/contacts/convert-to-user.php", category: "Contacts", method: "POST" },
  // Recherche
  { label: "Recherche personnes", path: "/search/persons.php", category: "Recherche", method: "GET" },
  // Espaces
  { label: "Liste", path: "/espaces/index.php", category: "Espaces", method: "GET" },
  { label: "Détail", path: "/espaces/show.php", category: "Espaces", method: "GET" },
  { label: "Créer", path: "/espaces/create.php", category: "Espaces", method: "POST" },
  { label: "Modifier", path: "/espaces/update.php", category: "Espaces", method: "PUT" },
  { label: "Supprimer", path: "/espaces/delete.php", category: "Espaces", method: "DELETE" },
  // Réservations
  { label: "Liste", path: "/reservations/index.php", category: "Réservations", method: "GET" },
  { label: "Détail", path: "/reservations/show.php", category: "Réservations", method: "GET" },
  { label: "Disponibilité", path: "/reservations/availability.php", category: "Réservations", method: "GET" },
  { label: "Créer", path: "/reservations/create.php", category: "Réservations", method: "POST" },
  { label: "Modifier", path: "/reservations/update.php", category: "Réservations", method: "PUT" },
  { label: "Annuler", path: "/reservations/cancel.php", category: "Réservations", method: "PUT" },
  // Check-ins
  { label: "Liste", path: "/checkins/index.php", category: "Check-ins", method: "GET" },
  { label: "Créer", path: "/checkins/create.php", category: "Check-ins", method: "POST" },
  { label: "Checkout", path: "/checkins/checkout.php", category: "Check-ins", method: "POST" },
  // Abonnements
  { label: "Liste", path: "/abonnements/index.php", category: "Abonnements", method: "GET" },
  { label: "Créer", path: "/abonnements/create.php", category: "Abonnements", method: "POST" },
  { label: "Modifier", path: "/abonnements/update.php", category: "Abonnements", method: "PUT" },
  { label: "Supprimer", path: "/abonnements/delete.php", category: "Abonnements", method: "DELETE" },
  { label: "Souscrire (client)", path: "/abonnements/souscrire.php", category: "Abonnements", method: "POST" },
  { label: "Admin souscription", path: "/abonnements/admin-souscription.php", category: "Abonnements", method: "POST" },
  { label: "Valider souscription", path: "/abonnements/valider-souscription.php", category: "Abonnements", method: "POST" },
  // Domiciliations
  { label: "Liste", path: "/domiciliations/index.php", category: "Domiciliations", method: "GET" },
  { label: "Mes domiciliations", path: "/domiciliations/user.php", category: "Domiciliations", method: "GET" },
  { label: "Stats publiques", path: "/domiciliations/public-stats.php", category: "Domiciliations", method: "GET" },
  { label: "Créer", path: "/domiciliations/create.php", category: "Domiciliations", method: "POST" },
  { label: "Modifier", path: "/domiciliations/update.php", category: "Domiciliations", method: "PUT" },
  { label: "Valider dossier", path: "/domiciliations/validate.php", category: "Domiciliations", method: "PUT" },
  { label: "Activer", path: "/domiciliations/activate.php", category: "Domiciliations", method: "PUT" },
  { label: "Rejeter", path: "/domiciliations/reject.php", category: "Domiciliations", method: "PUT" },
  // Documents
  { label: "Liste", path: "/documents/index.php", category: "Documents", method: "GET" },
  { label: "Télécharger", path: "/documents/download.php", category: "Documents", method: "GET" },
  { label: "Uploader", path: "/documents/upload.php", category: "Documents", method: "POST" },
  { label: "Modifier statut", path: "/documents/update.php", category: "Documents", method: "PUT" },
  { label: "Supprimer", path: "/documents/delete.php", category: "Documents", method: "DELETE" },
  // Notifications
  { label: "Liste", path: "/notifications/index.php", category: "Notifications", method: "GET" },
  { label: "Marquer lu", path: "/notifications/read.php", category: "Notifications", method: "POST" },
  { label: "Tout marquer lu", path: "/notifications/read-all.php", category: "Notifications", method: "POST" },
  { label: "Supprimer", path: "/notifications/delete.php", category: "Notifications", method: "DELETE" },
  // Codes Promo
  { label: "Liste", path: "/codes-promo/index.php", category: "Codes Promo", method: "GET" },
  { label: "Créer", path: "/codes-promo/create.php", category: "Codes Promo", method: "POST" },
  { label: "Modifier", path: "/codes-promo/update.php", category: "Codes Promo", method: "PUT" },
  { label: "Supprimer", path: "/codes-promo/delete.php", category: "Codes Promo", method: "DELETE" },
  { label: "Valider code", path: "/codes-promo/validate.php", category: "Codes Promo", method: "POST" },
  // Parrainages
  { label: "Liste", path: "/parrainages/index.php", category: "Parrainages", method: "GET" },
  { label: "Modifier", path: "/parrainages/update.php", category: "Parrainages", method: "PUT" },
  { label: "Vérifier code", path: "/parrainages/verify.php", category: "Parrainages", method: "POST" },
  // Caisse
  { label: "Transactions", path: "/caisse/transactions.php", category: "Caisse", method: "GET" },
  { label: "Statistiques caisse", path: "/caisse/stats.php", category: "Caisse", method: "GET" },
  { label: "Clôture journée", path: "/caisse/cloture.php", category: "Caisse", method: "POST" },
  // Email
  { label: "Queue status", path: "/email/queue-status.php", category: "Email", method: "GET" },
  { label: "Logs", path: "/email/logs.php", category: "Email", method: "GET" },
  { label: "Diagnostic SMTP", path: "/email/diagnose.php", category: "Email", method: "GET" },
  { label: "Préférences", path: "/email/preferences.php", category: "Email", method: "GET" },
  { label: "Aperçu template", path: "/email/preview.php", category: "Email", method: "GET" },
  { label: "Envoyer", path: "/email/send.php", category: "Email", method: "POST" },
  { label: "Dispatcher queue", path: "/email/dispatch.php", category: "Email", method: "POST" },
  { label: "Relancer échecs", path: "/email/retry.php", category: "Email", method: "POST" },
  { label: "Désabonnement", path: "/email/unsubscribe.php", category: "Email", method: "GET" },
];

function getCheckStatus(statusCode: number, message?: string): CheckStatus {
  if (statusCode === 0) return message?.includes("Timeout") ? "timeout" : "error";
  if (statusCode >= 200 && statusCode < 300) return "ok";
  if (statusCode === 401 || statusCode === 403) return "auth";
  if (statusCode === 400 || statusCode === 405 || statusCode === 422) return "accessible";
  if (statusCode === 404) return "notfound";
  if (statusCode >= 500) return "error";
  return "accessible";
}

async function checkEndpoint(path: string): Promise<{ statusCode: number; latencyMs: number; message?: string }> {
  const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${API_BASE}${path}`, { method: "GET", headers, signal: controller.signal });
    const latencyMs = Math.round(performance.now() - start);
    let message: string | undefined;
    try {
      const json = await res.json();
      if (json?.message) message = json.message;
      if (json?.error) message = json.error;
    } catch { /* not JSON */ }
    return { statusCode: res.status, latencyMs, message };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    if (err instanceof Error && err.name === "AbortError") {
      return { statusCode: 0, latencyMs, message: "Timeout (>8s)" };
    }
    return { statusCode: 0, latencyMs, message: err instanceof Error ? err.message : "Erreur réseau" };
  } finally {
    clearTimeout(timeoutId);
  }
}

const STATUS_CONFIG: Record<CheckStatus, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  idle:       { label: "—",           bg: "", text: "text-gray-400", border: "", icon: null },
  pending:    { label: "...",         bg: "", text: "text-gray-400", border: "", icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" /> },
  ok:         { label: "OK",          bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  auth:       { label: "Auth",        bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200",     icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  accessible: { label: "Accessible",  bg: "bg-gray-100",   text: "text-gray-600",    border: "border-gray-200",    icon: <CheckCircle className="w-3.5 h-3.5" /> },
  notfound:   { label: "404",         bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  icon: <XCircle className="w-3.5 h-3.5" /> },
  error:      { label: "Erreur",      bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     icon: <XCircle className="w-3.5 h-3.5" /> },
  timeout:    { label: "Timeout",     bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   icon: <Clock className="w-3.5 h-3.5" /> },
};

function StatusBadge({ result }: { result: EndpointResult }) {
  const cfg = STATUS_CONFIG[result.status];
  if (result.status === "idle") return <span className="text-xs text-gray-400">—</span>;
  if (result.status === "pending") return <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon}
      <span>{result.statusCode && result.statusCode > 0 ? result.statusCode : cfg.label}</span>
      {result.latencyMs !== undefined && <span className="opacity-60 font-normal">{result.latencyMs}ms</span>}
    </div>
  );
}

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-emerald-100 text-emerald-700",
  POST:   "bg-sky-100 text-sky-700",
  PUT:    "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
};

function ApiDiagnostic() {
  const [results, setResults] = useState<EndpointResult[]>(
    DIAGNOSTIC_ENDPOINTS.map((e) => ({ ...e, status: "idle" as CheckStatus }))
  );
  const [running, setRunning] = useState(false);
  const [errorsOnly, setErrorsOnly] = useState(false);

  const runDiagnostic = async () => {
    setRunning(true);
    setErrorsOnly(false);
    setResults(DIAGNOSTIC_ENDPOINTS.map((e) => ({ ...e, status: "pending" })));

    // Concurrence limitée à 6 pour ne pas saturer les connexions MySQL/PHP-FPM
    const CONCURRENCY = 6;
    let idx = 0;
    const worker = async () => {
      while (idx < DIAGNOSTIC_ENDPOINTS.length) {
        const i = idx++;
        const endpoint = DIAGNOSTIC_ENDPOINTS[i];
        const raw = await checkEndpoint(endpoint.path);
        const status = getCheckStatus(raw.statusCode, raw.message);
        setResults((prev) => {
          const next = [...prev];
          next[i] = { ...endpoint, status, ...raw };
          return next;
        });
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    setRunning(false);
  };

  const errorCount   = results.filter((r) => r.status === "error" || r.status === "notfound" || r.status === "timeout").length;
  const okCount      = results.filter((r) => r.status === "ok").length;
  const hasRun       = results.some((r) => r.status !== "idle");
  const categories   = [...new Set(DIAGNOSTIC_ENDPOINTS.map((e) => e.category))];

  const displayResults = errorsOnly
    ? results.filter((r) => r.status === "error" || r.status === "notfound" || r.status === "timeout")
    : results;

  const displayCategories = errorsOnly
    ? [...new Set(displayResults.map((r) => r.category))]
    : categories;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-600" />
          Diagnostic API
          <span className="text-xs font-normal text-gray-400 ml-1">({DIAGNOSTIC_ENDPOINTS.length} endpoints)</span>
        </h2>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {hasRun && !running && (
            <>
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border ${
                errorCount === 0
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                {errorCount === 0 ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {errorCount === 0 ? `${okCount}/${results.length} OK` : `${errorCount} erreur${errorCount > 1 ? "s" : ""} · ${okCount} OK`}
              </div>
              {errorCount > 0 && (
                <button
                  onClick={() => setErrorsOnly((v) => !v)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                    errorsOnly
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                  }`}
                >
                  {errorsOnly ? "Tout afficher" : "Erreurs seulement"}
                </button>
              )}
            </>
          )}
          <Button variant="outline" size="sm" onClick={runDiagnostic} disabled={running}>
            {running ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <Activity className="w-4 h-4 mr-1.5" />}
            {running ? "En cours…" : hasRun ? "Relancer" : "Lancer le diagnostic"}
          </Button>
        </div>
      </div>

      {/* Légende */}
      {hasRun && !running && (
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
          {[
            { status: "ok" as CheckStatus, label: "OK (2xx)" },
            { status: "auth" as CheckStatus, label: "Auth 401/403" },
            { status: "accessible" as CheckStatus, label: "Accessible 400/405" },
            { status: "notfound" as CheckStatus, label: "404 Introuvable" },
            { status: "error" as CheckStatus, label: "Erreur 500" },
            { status: "timeout" as CheckStatus, label: "Timeout" },
          ].map(({ status, label }) => {
            const cfg = STATUS_CONFIG[status];
            const count = results.filter((r) => r.status === status).length;
            if (count === 0) return null;
            return (
              <span key={status} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                {cfg.icon} {label} <span className="font-bold">({count})</span>
              </span>
            );
          })}
        </div>
      )}

      {!hasRun ? (
        <p className="text-sm text-gray-500 text-center py-8">
          Cliquez sur "Lancer le diagnostic" pour tester tous les endpoints PHP en parallèle.
        </p>
      ) : displayResults.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-8 text-emerald-600">
          <CheckCircle className="w-5 h-5" />
          <p className="text-sm font-medium">Aucune erreur détectée</p>
        </div>
      ) : (
        <div className="space-y-5">
          {displayCategories.map((cat) => {
            const catResults = displayResults.filter((r) => r.category === cat);
            if (catResults.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{cat}</p>
                <div className="space-y-1">
                  {catResults.map((r) => (
                    <div
                      key={r.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                        r.status === "error" || r.status === "notfound" ? "bg-red-50/60" :
                        r.status === "timeout" ? "bg-amber-50/60" : "bg-gray-50"
                      }`}
                    >
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded font-mono ${METHOD_COLORS[r.method] ?? "bg-gray-100 text-gray-600"}`}>
                        {r.method}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-800">{r.label}</span>
                        <span className="text-xs text-gray-400 ml-1.5 font-mono truncate">{r.path}</span>
                        {r.message && (r.status === "error" || r.status === "notfound" || r.status === "timeout") && (
                          <p className="text-xs text-red-600 mt-0.5 truncate">{r.message}</p>
                        )}
                      </div>
                      <StatusBadge result={r} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

interface EmailConfig {
  MAIL_MAILER: string;
  MAIL_HOST: string;
  MAIL_PORT: string;
  MAIL_ENCRYPTION: string;
  MAIL_USERNAME: string;
}

const MaintenanceTab: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<"connected" | "disconnected" | "checking">("checking");
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    setApiStatus("checking");
    apiClient.get("/health.php")
      .then(() => setApiStatus("connected"))
      .catch(() => setApiStatus("disconnected"));

    apiClient.get<{ config: EmailConfig }>("/email/diagnose.php")
      .then((res) => {
        if (res.data?.config) setEmailConfig(res.data.config);
      })
      .catch(() => { /* non bloquant */ });
  }, []);

  const handleClearCache = useCallback(async () => {
    const ok = await confirm({
      title: "Effacer le cache",
      message: "Êtes-vous sûr de vouloir effacer le cache ? Vous allez être déconnecté.",
      confirmLabel: "Effacer",
      variant: "warning",
    });
    if (!ok) return;
    try {
      localStorage.removeItem("coffice-app-storage");
      toast.success("Cache effacé avec succès");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      logger.error("Erreur suppression cache:", error as Error);
      toast.error("Erreur lors de la suppression du cache");
    }
  }, [confirm]);

  const recheckApi = () => {
    setApiStatus("checking");
    apiClient.get("/health.php")
      .then(() => setApiStatus("connected"))
      .catch(() => setApiStatus("disconnected"));
  };

  return (
    <>
      <ApiDiagnostic />

      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-gray-600" />
          Maintenance & Système
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">État du système</p>
              <p className="text-sm text-gray-500">Connexion à l'API backend</p>
            </div>
            <div className="flex items-center gap-2">
              {apiStatus === "checking" ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Vérification...</span>
                </div>
              ) : apiStatus === "connected" ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Connecté</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Déconnecté</span>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={recheckApi}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Effacer le cache local</p>
              <p className="text-sm text-gray-500">Vider les données en cache du navigateur</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearCache}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Effacer
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Recharger les données</p>
              <p className="text-sm text-gray-500">Forcer le rechargement depuis le serveur</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recharger
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Manuel d'utilisation ERP/CRM</p>
              <p className="text-sm text-gray-500">Guide complet pour les employés — noir & blanc, impression optimisée</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { const a = document.createElement("a"); a.href = "/coffice_erp_crm_manual.pdf"; a.download = "Manuel_Coffice_ERP_CRM.pdf"; a.click(); }}>
              <BookOpen className="w-4 h-4 mr-2" />
              Télécharger le PDF
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Version</p>
              <p className="text-sm text-gray-500">Version actuelle de l'application</p>
            </div>
            <span className="text-sm font-mono bg-gray-200 px-3 py-1 rounded">v{APP_VERSION}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Transport email</p>
              <p className="text-sm text-gray-500">
                {emailConfig
                  ? `${emailConfig.MAIL_HOST}:${emailConfig.MAIL_PORT} (${emailConfig.MAIL_ENCRYPTION.toUpperCase()})`
                  : "Chargement…"}
              </p>
            </div>
            {emailConfig ? (
              <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg ${
                emailConfig.MAIL_MAILER === "log"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-emerald-50 border-emerald-200"
              }`}>
                <div className={`w-2 h-2 rounded-full ${emailConfig.MAIL_MAILER === "log" ? "bg-amber-500" : "bg-emerald-500"}`} />
                <span className={`text-xs font-semibold ${emailConfig.MAIL_MAILER === "log" ? "text-amber-700" : "text-emerald-700"}`}>
                  {emailConfig.MAIL_MAILER === "log" ? "Log uniquement (pas d'envoi)" : `SMTP — ${emailConfig.MAIL_USERNAME}`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-xs">Chargement…</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}
        variant={options.variant}
      />
    </>
  );
};

export default MaintenanceTab;
