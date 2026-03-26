import React, { useState, useEffect, useCallback } from "react";
import { Mail, BarChart2, List, RefreshCw, Eye, Send, AlertCircle, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, Zap, KeyRound, Bell, Building2, Gift } from "lucide-react";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import AdminTabBar from "../../../components/admin/AdminTabBar";
import { apiClient } from "../../../lib/api-client";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Tab = "logs" | "queue" | "preview" | "rapide";

interface EmailLog {
  id: string;
  user_id: string | null;
  type: string;
  template?: string;
  recipient: string;
  to_email?: string;
  subject: string;
  status: "sent" | "failed" | "bounced";
  attempts: number;
  error_message: string | null;
  sent_at: string;
  created_at?: string;
  user_name: string | null;
}

interface QueueItem {
  id: string;
  type: string;
  to_email: string;
  subject: string;
  status: string;
  priority: number;
  scheduled_at: string;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  created_at: string;
}

interface EmailStats {
  global: {
    total: number;
    sent: number;
    failed: number;
    bounced: number;
    unique_recipients: number;
    last_7_days: number;
    last_30_days: number;
  };
  by_type: Array<{ type: string; count: number; sent: number; failed: number }>;
  trend: Array<{ date: string; total: number; sent: number; failed: number }>;
}

const TEMPLATES = [
  { value: "welcome", label: "Bienvenue" },
  { value: "reservation-confirmation", label: "Confirmation réservation" },
  { value: "reservation-reminder", label: "Rappel réservation" },
  { value: "domiciliation-status", label: "Statut domiciliation" },
  { value: "password-reset", label: "Réinitialisation mot de passe" },
  { value: "courrier-recu", label: "Courrier reçu" },
  { value: "abonnement-expiration", label: "Expiration abonnement" },
  { value: "domiciliation-expiration", label: "Expiration domiciliation" },
  { value: "parrainage-bonus", label: "Bonus parrainage" },
  { value: "code-promo-attribue", label: "Code promo attribué" },
];

const API_URL = import.meta.env.VITE_API_URL || "/api";

const statusConfig = {
  sent: { label: "Envoyé", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
  failed: { label: "Échoué", icon: XCircle, color: "text-red-600 bg-red-50" },
  bounced: { label: "Rebond", icon: AlertCircle, color: "text-amber-600 bg-amber-50" },
  pending: { label: "En attente", icon: Clock, color: "text-blue-600 bg-blue-50" },
  processing: { label: "En cours", icon: RefreshCw, color: "text-sky-600 bg-sky-50" },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
};

const LogsTab: React.FC = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ type: "", status: "", date_debut: "", date_fin: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        apiClient.getEmailLogs({ page, limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }),
        apiClient.getEmailLogStats(),
      ]);

      if (logsRes.success) {
        const d = logsRes.data as { data: EmailLog[]; pages: number };
        setLogs(d.data || []);
        setTotalPages(d.pages || 1);
      }
      if (statsRes.success) {
        setStats(statsRes.data as EmailStats);
      }
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {stats?.global && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total envoyés", value: stats.global.total, color: "text-gray-900" },
            { label: "Succès", value: stats.global.sent, color: "text-emerald-600" },
            { label: "Échecs", value: stats.global.failed, color: "text-red-600" },
            { label: "7 derniers jours", value: stats.global.last_7_days, color: "text-sky-600" },
          ].map((s) => (
            <Card key={s.label} className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filters.type}
            onChange={(e) => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Tous les types</option>
            {TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Tous les statuts</option>
            <option value="sent">Envoyé</option>
            <option value="failed">Échoué</option>
            <option value="bounced">Rebond</option>
          </select>
          <input
            type="date"
            value={filters.date_debut}
            onChange={(e) => { setFilters(f => ({ ...f, date_debut: e.target.value })); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="date"
            value={filters.date_fin}
            onChange={(e) => { setFilters(f => ({ ...f, date_fin: e.target.value })); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button onClick={load} className="ml-auto flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">Chargement…</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-gray-400">Aucun log trouvé</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Date", "Type", "Destinataire", "Objet", "Statut", "Tentatives"].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(log.created_at ?? log.sent_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{log.template ?? log.type}</span>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-700 max-w-[180px] truncate">
                        {log.user_name ? <span className="block font-medium">{log.user_name}</span> : null}
                        <span className="text-gray-400">{log.to_email ?? log.recipient}</span>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-700 max-w-[220px] truncate">{log.subject}</td>
                      <td className="py-3 px-3"><StatusBadge status={log.status} /></td>
                      <td className="py-3 px-3 text-center text-xs text-gray-500">{log.attempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

const QueueTab: React.FC = () => {
  const [queueData, setQueueData] = useState<{ by_status: Record<string, number>; failed: QueueItem[]; pending: QueueItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getEmailQueueStatus();
      if (res.success) setQueueData(res.data as typeof queueData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRetry = async (id: string) => {
    setRetrying(id);
    try {
      const res = await apiClient.retryEmailQueueItem(id);
      if (res.success) {
        toast.success("Email remis en file d'attente");
        await load();
      } else {
        toast.error((res as { error?: string }).error || "Erreur lors de la relance");
      }
    } finally {
      setRetrying(null);
    }
  };

  if (loading) return <div className="py-12 text-center text-gray-400">Chargement…</div>;
  if (!queueData) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(queueData.by_status).map(([status, count]) => (
          <Card key={status} className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{count}</p>
            <StatusBadge status={status} />
          </Card>
        ))}
      </div>

      {queueData.failed.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            Emails en échec ({queueData.failed.length})
          </h3>
          <div className="space-y-3">
            {queueData.failed.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.to_email} — <span className="font-mono">{item.type}</span></p>
                  {item.error_message && (
                    <p className="text-xs text-red-600 mt-1 truncate">{item.error_message}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRetry(item.id)}
                  disabled={retrying === item.id}
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${retrying === item.id ? "animate-spin" : ""}`} />
                  Relancer
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {queueData.pending.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            En attente d'envoi ({queueData.pending.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Type", "Destinataire", "Objet", "Planifié", "Priorité"].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {queueData.pending.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3"><span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{item.type}</span></td>
                    <td className="py-2 px-3 text-xs text-gray-600">{item.to_email}</td>
                    <td className="py-2 px-3 text-xs text-gray-700 max-w-[200px] truncate">{item.subject}</td>
                    <td className="py-2 px-3 text-xs text-gray-500 whitespace-nowrap">
                      {format(new Date(item.scheduled_at), "dd/MM HH:mm", { locale: fr })}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-xs font-bold ${item.priority <= 2 ? "text-red-600" : item.priority >= 4 ? "text-gray-400" : "text-gray-600"}`}>
                        P{item.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {queueData.failed.length === 0 && queueData.pending.length === 0 && (
        <Card className="p-12 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-500">La file d'attente est vide</p>
        </Card>
      )}
    </div>
  );
};

const PreviewTab: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].value);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const openPreview = () => {
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    const url = `${API_URL}/email/preview.php?template=${selectedTemplate}`;
    const win = window.open("about:blank", "_blank");
    if (!win) return;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/html",
      },
    })
      .then(res => res.text())
      .then(html => {
        win.document.open();
        win.document.write(html);
        win.document.close();
      })
      .catch(() => {
        toast.error("Impossible de charger le preview");
        win.close();
      });

    setPreviewUrl(url);
  };

  return (
    <Card className="p-6">
      <p className="text-sm text-gray-500 mb-5">Visualisez le rendu HTML de chaque template email sans envoyer de message.</p>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Template</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <Button onClick={openPreview} className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Ouvrir le preview
        </Button>
      </div>
      {previewUrl && (
        <p className="mt-4 text-xs text-gray-400">Le preview s'ouvre dans un nouvel onglet avec des données de test.</p>
      )}
    </Card>
  );
};

const QUICK_SCENARIOS = [
  {
    id: "welcome",
    label: "Bienvenue & identifiants",
    description: "Envoie l'email de bienvenue avec le lien de connexion à l'espace Coffice.",
    icon: Mail,
    colorClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
    iconClass: "bg-emerald-100 text-emerald-600",
  },
  {
    id: "password_reset",
    label: "Réinitialisation mot de passe",
    description: "Envoie un lien sécurisé de réinitialisation de mot de passe au destinataire.",
    icon: KeyRound,
    colorClass: "bg-amber-50 border-amber-200 text-amber-700",
    iconClass: "bg-amber-100 text-amber-600",
  },
  {
    id: "abonnement_expiration",
    label: "Rappel expiration abonnement",
    description: "Rappelle à l'utilisateur que son abonnement arrive à expiration dans 7 jours.",
    icon: Bell,
    colorClass: "bg-orange-50 border-orange-200 text-orange-700",
    iconClass: "bg-orange-100 text-orange-600",
  },
  {
    id: "domiciliation_expiration",
    label: "Rappel expiration domiciliation",
    description: "Rappelle que le contrat de domiciliation expire dans 30 jours.",
    icon: Building2,
    colorClass: "bg-blue-50 border-blue-200 text-blue-700",
    iconClass: "bg-blue-100 text-blue-600",
  },
  {
    id: "code_promo_attribue",
    label: "Attribution code promo",
    description: "Informe l'utilisateur d'un code promo qui lui a été attribué.",
    icon: Gift,
    colorClass: "bg-purple-50 border-purple-200 text-purple-700",
    iconClass: "bg-purple-100 text-purple-600",
  },
];

const QuickSendTab: React.FC = () => {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [sending, setSending] = useState<string | null>(null);

  const handleSend = async (scenarioId: string) => {
    if (!recipientEmail) { toast.error("L'adresse email est requise"); return; }
    setSending(scenarioId);
    try {
      const prenom = recipientName.trim() || recipientEmail.split("@")[0];
      let result: { success: boolean; error?: string } | undefined;

      if (scenarioId === "welcome") {
        const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
        const previewRes = await fetch(`${API_URL}/email/preview.php?template=welcome`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "text/html" },
        });
        const html = await previewRes.text();
        const r = await apiClient.sendEmail(recipientEmail, "Bienvenue chez Coffice", html);
        result = { success: r.success, error: (r as { error?: string }).error };
      } else if (scenarioId === "password_reset") {
        const res = await fetch(`${API_URL}/auth/forgot-password.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: recipientEmail }),
        });
        const data = await res.json();
        result = { success: data.success, error: data.message };
      } else if (scenarioId === "abonnement_expiration") {
        const r = await apiClient.dispatchEmail("abonnement_expiration", {
          user_email: recipientEmail,
          prenom,
          plan_nom: "votre abonnement",
          jours_restants: 7,
          date_fin: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          prix_mensuel: 0,
        });
        result = { success: r.success, error: (r as { error?: string }).error };
      } else if (scenarioId === "domiciliation_expiration") {
        const r = await apiClient.dispatchEmail("domiciliation_expiration", {
          user_email: recipientEmail,
          prenom,
          raison_sociale: "",
          jours_restants: 30,
          date_fin: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        });
        result = { success: r.success, error: (r as { error?: string }).error };
      } else if (scenarioId === "code_promo_attribue") {
        const r = await apiClient.dispatchEmail("code_promo_attribue", {
          user_email: recipientEmail,
          prenom,
          code_promo: "COFFICE",
          reduction: "20",
          type_reduction: "pourcentage",
          date_expiration: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          description: "Code promo Coffice",
        });
        result = { success: r.success, error: (r as { error?: string }).error };
      }

      if (result?.success) {
        toast.success(`Email envoyé à ${recipientEmail}`);
      } else {
        toast.error(result?.error || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <p className="text-sm font-medium text-gray-700 mb-4">Destinataire</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email *</label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="client@example.com"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Prénom (optionnel)</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Karim"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_SCENARIOS.map((s) => {
          const Icon = s.icon;
          const isSending = sending === s.id;
          return (
            <Card key={s.id} className={`p-4 border ${s.colorClass}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.iconClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.description}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    disabled={isSending || !recipientEmail}
                    onClick={() => handleSend(s.id)}
                  >
                    <Send className={`w-3.5 h-3.5 mr-1.5 ${isSending ? "animate-pulse" : ""}`} />
                    {isSending ? "Envoi…" : "Envoyer"}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const AdminEmail: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("logs");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "logs", label: "Logs", icon: <List className="w-4 h-4" /> },
    { id: "queue", label: "File d'attente", icon: <Clock className="w-4 h-4" /> },
    { id: "preview", label: "Preview", icon: <Eye className="w-4 h-4" /> },
    { id: "rapide", label: "Envoi rapide", icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Emails"
        subtitle="Logs, file d'attente, prévisualisation et tests"
      />

      <AdminTabBar
        variant="pill"
        tabs={tabs.map((t) => ({ key: t.id, label: t.label, icon: t.icon }))}
        active={activeTab}
        onChange={(key) => setActiveTab(key as Tab)}
      />

      {activeTab === "logs" && <LogsTab />}
      {activeTab === "queue" && <QueueTab />}
      {activeTab === "preview" && <PreviewTab />}
      {activeTab === "rapide" && <QuickSendTab />}
    </div>
  );
};

export default AdminEmail;
