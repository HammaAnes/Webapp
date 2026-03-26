import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  CreditCard,
  Banknote,
  Receipt,
  Lock,
  Plus,
  X,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import AdminTabBar from "../../../components/admin/AdminTabBar";
import Card from "../../../components/ui/Card";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import Badge from "../../../components/ui/Badge";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useConfirm } from "../../../hooks/useConfirm";
import { logger } from "../../../utils/logger";
import EncaisserModal, { EncaisserData } from "../../../components/admin/EncaisserModal";
import { useAppStore } from "../../../store/store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  type_transaction: string;
  montant: number;
  mode_paiement: string;
  numero_recu: string;
  reference_paiement?: string;
  notes?: string;
  statut: string;
  created_at: string;
  admin_prenom?: string;
  admin_nom?: string;
  client_prenom?: string;
  client_nom?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

type CaisseTab = "journal" | "historique";

interface Totaux {
  mode_paiement: string;
  total: number;
  nombre: number;
}

interface Cloture {
  id: string;
  date_cloture: string;
  total_general: number;
  notes?: string;
  admin_nom?: string;
  admin_prenom?: string;
  created_at: string;
}

interface StatsKpis {
  total: number;
  nb_transactions: number;
  moyenne: number;
  prev_total: number;
  prev_nb: number;
  evolution_pct: number | null;
}

interface StatsByMode  { mode: string;  nb: number; total: number }
interface StatsByType  { type: string;  nb: number; total: number }
interface TrendPoint   { date: string;  nb: number; total: number }

interface CaisseStats {
  period: string;
  kpis: StatsKpis;
  by_mode: StatsByMode[];
  by_type: StatsByType[];
  trend: TrendPoint[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIODS = [
  { value: "day",   label: "Aujourd'hui" },
  { value: "week",  label: "7 jours" },
  { value: "month", label: "Ce mois" },
  { value: "all",   label: "Tout" },
];

const MODE_LABELS: Record<string, string> = {
  cash: "Espèces", virement: "Virement", cheque: "Chèque", tpe: "TPE", credit: "Crédit",
};

const MODE_COLORS: Record<string, string> = {
  cash: "bg-emerald-500", virement: "bg-blue-500", cheque: "bg-violet-500", tpe: "bg-amber-500", credit: "bg-rose-500",
};

const MODE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  cash: Banknote, virement: CreditCard, cheque: Receipt, tpe: CreditCard, credit: CreditCard,
};

const TYPE_LABELS: Record<string, string> = {
  reservation: "Réservation", abonnement: "Abonnement", domiciliation: "Domiciliation",
  impression: "Impression", boisson: "Boisson", autre: "Autre", remboursement: "Remboursement",
};

const TYPE_COLORS: Record<string, string> = {
  reservation: "bg-sky-500", abonnement: "bg-violet-500", domiciliation: "bg-amber-500",
  impression: "bg-gray-400", boisson: "bg-teal-500", autre: "bg-orange-400", remboursement: "bg-rose-500",
};

const TYPE_OPTIONS = [
  { value: "reservation",   label: "Réservation" },
  { value: "abonnement",    label: "Abonnement" },
  { value: "domiciliation", label: "Domiciliation" },
  { value: "impression",    label: "Impression" },
  { value: "boisson",       label: "Boisson" },
  { value: "remboursement", label: "Remboursement" },
  { value: "autre",         label: "Autre" },
];

const MODE_OPTIONS = [
  { value: "cash",     label: "Espèces" },
  { value: "virement", label: "Virement" },
  { value: "cheque",   label: "Chèque" },
  { value: "tpe",      label: "TPE" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 0 }).format(n);

const fmtShort = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
  n >= 1_000     ? `${(n / 1_000).toFixed(0)}k`     : String(n);

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ label, value, total, color, nb }: { label: string; value: number; total: number; color: string; nb: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500 text-xs">{fmt(value)} <span className="text-gray-400">· {nb} op.</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-right text-xs text-gray-400">{pct}%</div>
    </div>
  );
}

function TrendChart({ data }: { data: TrendPoint[] }) {
  const max = Math.max(...data.map(d => d.total), 1);
  const W = 8, GAP = 3, H = 56;
  const totalW = data.length * (W + GAP);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${totalW} ${H + 16}`} className="w-full" style={{ height: 80 }}>
        {data.map((d, i) => {
          const barH = Math.max(2, (d.total / max) * H);
          const x = i * (W + GAP);
          const y = H - barH;
          const isToday = d.date === new Date().toISOString().split("T")[0];
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={W} height={barH}
                fill={d.total > 0 ? (isToday ? "#0284c7" : "#34d399") : "#e5e7eb"}
                rx={2} />
              {d.total > 0 && (
                <title>{new Date(d.date + "T00:00:00").toLocaleDateString("fr-FR")} — {fmt(d.total)}</title>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-gray-400 -mt-1">
        <span>{data[0]?.date ? new Date(data[0].date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}</span>
        <span>Aujourd'hui</span>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, color, evolution }: {
  label: string; value: string; sub?: string;
  icon: React.FC<{ className?: string }>; color: string; evolution?: number | null;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {evolution !== null && evolution !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${evolution >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {evolution > 0 ? <TrendingUp className="w-3 h-3" /> : evolution < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {evolution > 0 ? "+" : ""}{evolution}% vs période précédente
        </div>
      )}
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Caisse() {
  const [activeTab, setActiveTab]     = useState<CaisseTab>("journal");
  const [period, setPeriod]           = useState<string>("month");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [stats, setStats]             = useState<CaisseStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totaux, setTotaux]           = useState<Totaux[]>([]);
  const [totalGeneral, setTotalGeneral] = useState(0);
  const [clotures, setClotures]       = useState<Cloture[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showClotureModal, setShowClotureModal] = useState(false);
  const [clotureNotes, setClotureNotes] = useState("");

  // ── Historique complet ────────────────────────────────────────────────────
  const [histTx, setHistTx]           = useState<Transaction[]>([]);
  const [histTotaux, setHistTotaux]   = useState<Totaux[]>([]);
  const [histTotalGeneral, setHistTotalGeneral] = useState(0);
  const [histPagination, setHistPagination] = useState<Pagination>({ total: 0, page: 1, limit: 50, pages: 1 });
  const [histLoading, setHistLoading] = useState(false);
  const [histPage, setHistPage]       = useState(1);
  const [histFilters, setHistFilters] = useState({
    date_from: "", date_to: "", type: "", mode: "", search: "",
  });
  const [searchInput, setSearchInput] = useState("");

  const { confirm, isOpen: confirmOpen, options: confirmOptions, handleConfirm, handleCancel } = useConfirm();
  const { reservations, loadReservations } = useAppStore();
  const [encaisserData, setEncaisserData] = useState<EncaisserData | null>(null);

  useEffect(() => { loadStats(); }, [period]);
  useEffect(() => { loadTransactions(); }, [selectedDate]);
  useEffect(() => { loadClotures(); }, []);
  useEffect(() => { if (activeTab === "historique") loadHistorique(); }, [activeTab, histPage, histFilters]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const res = await apiClient.get(`/caisse/stats.php?period=${period}`);
      if (res.success && res.data) setStats(res.data as CaisseStats);
    } catch (e) {
      logger.error("Erreur stats caisse:", e as Error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getTransactionsCaisse(selectedDate);
      if (res.success && res.data) {
        const d = res.data as { transactions: Transaction[]; totaux: Totaux[]; total_general: number };
        setTransactions(d.transactions || []);
        setTotaux(d.totaux || []);
        setTotalGeneral(d.total_general || 0);
      }
    } catch (e) {
      logger.error("Erreur transactions:", e as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadClotures = async () => {
    try {
      const res = await apiClient.getClotures();
      if (res.success && res.data) {
        const d = res.data as { clotures?: Cloture[] } | Cloture[];
        setClotures(Array.isArray(d) ? d : (d as { clotures?: Cloture[] }).clotures || []);
      }
    } catch (e) { logger.error("Erreur clôtures:", e as Error); }
  };

  const loadHistorique = async () => {
    setHistLoading(true);
    try {
      const res = await apiClient.getAllTransactionsCaisse({ ...histFilters, page: histPage, limit: 50 });
      if (res.success && res.data) {
        const d = res.data as { transactions: Transaction[]; totaux: Totaux[]; total_general: number; pagination: Pagination };
        setHistTx(d.transactions || []);
        setHistTotaux(d.totaux || []);
        setHistTotalGeneral(d.total_general || 0);
        if (d.pagination) setHistPagination(d.pagination);
      }
    } catch (e) { logger.error("Erreur historique:", e as Error); }
    finally { setHistLoading(false); }
  };

  const applyHistFilters = () => {
    setHistFilters(f => ({ ...f, search: searchInput }));
    setHistPage(1);
  };

  const handleCloture = useCallback(async () => {
    const dateLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR");
    const ok = await confirm({
      title: "Clôturer la caisse",
      message: `Clôturer la caisse pour le ${dateLabel} ?`,
      confirmLabel: "Clôturer",
      variant: "warning",
    });
    if (!ok) return;
    try {
      const res = await apiClient.cloturerCaisse(selectedDate, clotureNotes);
      if (res.success) {
        toast.success("Clôture enregistrée");
        setShowClotureModal(false);
        setClotureNotes("");
        loadTransactions();
        loadClotures();
        loadStats();
      } else {
        toast.error(res.error || "Erreur lors de la clôture");
      }
    } catch (e) {
      logger.error("Erreur clôture:", e as Error);
      toast.error("Erreur lors de la clôture");
    }
  }, [confirm, selectedDate, clotureNotes]);

  const pendingReservations = useMemo(() => {
    return reservations.filter(r => {
      const rDate = new Date(r.dateDebut).toISOString().split("T")[0];
      const reste = r.montantTotal - (r.montantPaye ?? 0);
      return (
        rDate === selectedDate &&
        (r.statut === "confirmee" || r.statut === "en_attente" || r.statut === "en_cours") &&
        r.montantTotal > 0 &&
        reste > 0
      );
    });
  }, [reservations, selectedDate]);

  const kpis = stats?.kpis;
  const totalModes = stats?.by_mode.reduce((s, m) => s + m.total, 0) || 0;
  const totalTypes = stats?.by_type.reduce((s, t) => s + t.total, 0) || 0;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <AdminPageHeader
        title="Caisse"
        subtitle="Vue globale des encaissements"
        actions={
          <>
            <Button onClick={() => setEncaisserData({ typeTransaction: "reservation", montantSuggere: 0 })} variant="success" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Encaisser
            </Button>
            <Button onClick={() => setShowClotureModal(true)} size="sm" className="gap-1.5 bg-gray-900 hover:bg-gray-800 text-white">
              <Lock className="w-4 h-4" /> Clôturer
            </Button>
          </>
        }
      />

      {/* ── Tabs ── */}
      <AdminTabBar
        variant="pill"
        tabs={[
          { key: "journal",    label: "Journal" },
          { key: "historique", label: "Toutes les transactions" },
        ]}
        active={activeTab}
        onChange={(key) => setActiveTab(key as "journal" | "historique")}
      />

      {/* ── Period selector (journal only) ── */}
      {activeTab === "journal" && (
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === p.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      )}

      {activeTab === "journal" && (<>

      {/* ── KPI Cards ── */}
      {loadingStats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <Card key={i} className="p-5 h-28 animate-pulse bg-gray-50">{" "}</Card>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Chiffre d'affaires"
            value={kpis ? fmtShort(kpis.total) + " DA" : "—"}
            sub={kpis ? fmt(kpis.total) : ""}
            icon={DollarSign}
            color="bg-emerald-500"
            evolution={kpis?.evolution_pct ?? null}
          />
          <KpiCard
            label="Transactions"
            value={String(kpis?.nb_transactions ?? "—")}
            sub={kpis?.prev_nb ? `vs ${kpis.prev_nb} période préc.` : undefined}
            icon={Receipt}
            color="bg-blue-500"
          />
          <KpiCard
            label="Panier moyen"
            value={kpis ? fmt(kpis.moyenne) : "—"}
            icon={BarChart3}
            color="bg-violet-500"
          />
          <KpiCard
            label="Meilleure période"
            value={stats?.trend ? fmt(Math.max(...stats.trend.map(d => d.total))) : "—"}
            sub="max journalier (30j)"
            icon={ArrowUpRight}
            color="bg-amber-500"
          />
        </div>
      )}

      {/* ── Breakdown + Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* By mode */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-500" /> Modes de paiement
          </h3>
          {loadingStats ? (
            <div className="space-y-4">{[0,1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : stats?.by_mode.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune donnée</p>
          ) : (
            <div className="space-y-4">
              {(stats?.by_mode ?? []).map(m => (
                <ProgressBar
                  key={m.mode}
                  label={MODE_LABELS[m.mode] ?? m.mode}
                  value={m.total}
                  total={totalModes}
                  color={MODE_COLORS[m.mode] ?? "bg-gray-400"}
                  nb={m.nb}
                />
              ))}
            </div>
          )}
        </Card>

        {/* By type */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-violet-500" /> Types de transaction
          </h3>
          {loadingStats ? (
            <div className="space-y-4">{[0,1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : stats?.by_type.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune donnée</p>
          ) : (
            <div className="space-y-4">
              {(stats?.by_type ?? []).map(t => (
                <ProgressBar
                  key={t.type}
                  label={TYPE_LABELS[t.type] ?? t.type}
                  value={t.total}
                  total={totalTypes}
                  color={TYPE_COLORS[t.type] ?? "bg-gray-400"}
                  nb={t.nb}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Trend 30 days */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Tendance 30 jours
          </h3>
          <p className="text-xs text-gray-400 mb-4">Encaissements journaliers</p>
          {loadingStats ? (
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <TrendChart data={stats?.trend ?? []} />
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" /> Jours passés</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-sky-500 inline-block" /> Aujourd'hui</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-gray-200 inline-block" /> Vide</span>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── Paiements en attente ── */}
      {pendingReservations.length > 0 && (
        <Card className="overflow-hidden border-amber-200">
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-amber-900">
              À encaisser pour cette journée
            </h2>
            <span className="ml-auto text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
              {pendingReservations.length}
            </span>
          </div>
          <div className="divide-y divide-amber-50">
            {pendingReservations.map(r => {
              const reste = r.montantTotal - (r.montantPaye ?? 0);
              const person = r.person ?? r.utilisateur ?? r.contact;
              const clientName = person
                ? `${(person as { prenom?: string }).prenom ?? ""} ${(person as { nom?: string }).nom ?? ""}`.trim()
                : "";
              const espaceName = r.espace?.nom ?? "";
              const label = [clientName, espaceName].filter(Boolean).join(" — ");
              return (
                <div key={r.id} className="px-6 py-3 flex items-center gap-4 hover:bg-amber-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {clientName || <span className="text-gray-400 font-normal">Client inconnu</span>}
                      {espaceName && <span className="text-gray-400 font-normal"> · {espaceName}</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(r.dateDebut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      {"–"}
                      {new Date(r.dateFin).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      {(r.montantPaye ?? 0) > 0 && (
                        <span className="ml-2 text-emerald-600">· Acompte {fmt(r.montantPaye!)}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-amber-700">{fmt(reste)}</span>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => setEncaisserData({
                        reservationId: r.id,
                        typeTransaction: "reservation",
                        montantSuggere: reste,
                        label: label || undefined,
                      })}
                    >
                      Encaisser
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Daily journal ── */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <History className="w-4 h-4 text-gray-400" />
              Journal du {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </h2>
            <div className="flex items-center gap-2">
              {/* Date navigation */}
              <button
                onClick={() => {
                  const d = new Date(selectedDate + "T00:00:00");
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().split("T")[0]);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
              <button
                onClick={() => {
                  const d = new Date(selectedDate + "T00:00:00");
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d.toISOString().split("T")[0]);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {selectedDate !== new Date().toISOString().split("T")[0] && (
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 transition-colors font-medium"
                >
                  Aujourd'hui
                </button>
              )}
              {totalGeneral > 0 && (
                <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  {fmt(totalGeneral)}
                </span>
              )}
            </div>
          </div>
          {/* Quick action buttons */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-gray-400 mr-1">Encaissement rapide :</span>
            {([
              { label: "Boisson",     type: "boisson"    as const, montant: 200 },
              { label: "Impression",  type: "impression" as const, montant: 50  },
              { label: "Autre",       type: "autre"      as const, montant: 0   },
            ]).map(q => (
              <button
                key={q.label}
                onClick={() => setEncaisserData({ typeTransaction: q.type, montantSuggere: q.montant, label: q.label })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <Plus className="w-3 h-3" />
                {q.label}{q.montant > 0 ? ` · ${q.montant} DA` : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Payment mode mini-summary */}
        {totaux.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex gap-4 flex-wrap">
            {totaux.map(t => {
              const Icon = MODE_ICONS[t.mode_paiement] ?? Banknote;
              return (
                <div key={t.mode_paiement} className="flex items-center gap-2 text-sm">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">{MODE_LABELS[t.mode_paiement]}:</span>
                  <span className="font-semibold text-gray-800">{fmt(t.total)}</span>
                  <span className="text-gray-400 text-xs">({t.nombre})</span>
                </div>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune transaction pour cette date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {["Heure", "Client", "Type", "Mode", "Référence", "N° Reçu", "Montant", "Statut"].map(h => (
                    <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase ${h === "Montant" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {(t.client_prenom || t.client_nom)
                        ? `${t.client_prenom ?? ""} ${t.client_nom ?? ""}`.trim()
                        : <span className="text-gray-400 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-white ${TYPE_COLORS[t.type_transaction] ?? "bg-gray-400"}`}>
                        {TYPE_LABELS[t.type_transaction] ?? t.type_transaction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="info">{MODE_LABELS[t.mode_paiement] ?? t.mode_paiement}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.reference_paiement || t.notes || "—"}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-700">{t.numero_recu}</td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-gray-900 whitespace-nowrap">{fmt(t.montant)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={t.statut === "encaisse" ? "success" : "warning"}>{t.statut}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Clôtures ── */}
      {clotures.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              Historique des clôtures
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{clotures.length}</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {["Date", "Admin", "Notes", "Total"].map(h => (
                    <th key={h} className={`px-5 py-3 text-xs font-medium text-gray-500 uppercase ${h === "Total" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clotures.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {new Date(c.date_cloture + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {c.admin_prenom && c.admin_nom ? `${c.admin_prenom} ${c.admin_nom}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400 max-w-xs truncate">{c.notes || "—"}</td>
                    <td className="px-5 py-3 text-sm font-bold text-right text-gray-900 whitespace-nowrap">{fmt(c.total_general)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      </>)}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB — HISTORIQUE COMPLET
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "historique" && (
        <div className="space-y-4">

          {/* Filtres */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Du</label>
                <input type="date" value={histFilters.date_from}
                  onChange={e => { setHistFilters(f => ({ ...f, date_from: e.target.value })); setHistPage(1); }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Au</label>
                <input type="date" value={histFilters.date_to}
                  onChange={e => { setHistFilters(f => ({ ...f, date_to: e.target.value })); setHistPage(1); }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Type</label>
                <select value={histFilters.type}
                  onChange={e => { setHistFilters(f => ({ ...f, type: e.target.value })); setHistPage(1); }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="">Tous les types</option>
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Mode</label>
                <select value={histFilters.mode}
                  onChange={e => { setHistFilters(f => ({ ...f, mode: e.target.value })); setHistPage(1); }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="">Tous les modes</option>
                  {MODE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-48">
                <label className="text-xs font-medium text-gray-500">Recherche</label>
                <div className="flex gap-2">
                  <input type="text" value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && applyHistFilters()}
                    placeholder="N° reçu, référence..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <button onClick={applyHistFilters}
                    className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {(histFilters.date_from || histFilters.date_to || histFilters.type || histFilters.mode || histFilters.search) && (
                <button
                  onClick={() => { setHistFilters({ date_from: "", date_to: "", type: "", mode: "", search: "" }); setSearchInput(""); setHistPage(1); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors self-end">
                  <X className="w-3.5 h-3.5" /> Réinitialiser
                </button>
              )}
            </div>
          </Card>

          {/* Résumé totaux */}
          {histTotaux.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {histTotaux.map(t => {
                const Icon = MODE_ICONS[t.mode_paiement] ?? Banknote;
                return (
                  <div key={t.mode_paiement} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm shadow-sm">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">{MODE_LABELS[t.mode_paiement] ?? t.mode_paiement}</span>
                    <span className="font-bold text-gray-900">{fmt(t.total)}</span>
                    <span className="text-gray-400 text-xs">({t.nombre})</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm shadow-sm">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-700 font-medium">Total</span>
                <span className="font-bold text-emerald-800">{fmt(histTotalGeneral)}</span>
              </div>
            </div>
          )}

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                {histPagination.total > 0
                  ? `${histPagination.total} transaction${histPagination.total > 1 ? "s" : ""}`
                  : "Toutes les transactions"}
              </h2>
              {histPagination.total > 0 && (
                <span className="text-xs text-gray-400">
                  Page {histPagination.page} / {histPagination.pages}
                </span>
              )}
            </div>

            {histLoading ? (
              <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
            ) : histTx.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune transaction trouvée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Date", "Type", "Mode", "Référence", "N° Reçu", "Client", "Montant", "Statut"].map(h => (
                        <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase ${h === "Montant" ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {histTx.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(t.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                          <span className="block text-gray-400">
                            {new Date(t.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-white ${TYPE_COLORS[t.type_transaction] ?? "bg-gray-400"}`}>
                            {TYPE_LABELS[t.type_transaction] ?? t.type_transaction}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant="info">{MODE_LABELS[t.mode_paiement] ?? t.mode_paiement}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-32 truncate">{t.reference_paiement || t.notes || "—"}</td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-700">{t.numero_recu}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {(t.client_prenom || t.client_nom)
                            ? `${t.client_prenom ?? ""} ${t.client_nom ?? ""}`.trim()
                            : <span className="text-gray-400 font-normal">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-gray-900 whitespace-nowrap">{fmt(t.montant)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={t.statut === "encaisse" ? "success" : "warning"}>{t.statut}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {histPagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {((histPagination.page - 1) * histPagination.limit) + 1}–{Math.min(histPagination.page * histPagination.limit, histPagination.total)} sur {histPagination.total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHistPage(p => Math.max(1, p - 1))}
                    disabled={histPagination.page <= 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(histPagination.pages, 7) }, (_, i) => {
                    const p = histPagination.pages <= 7 ? i + 1
                      : histPagination.page <= 4 ? i + 1
                      : histPagination.page >= histPagination.pages - 3 ? histPagination.pages - 6 + i
                      : histPagination.page - 3 + i;
                    return (
                      <button key={p} onClick={() => setHistPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          p === histPagination.page
                            ? "bg-primary text-white"
                            : "border border-gray-200 hover:bg-gray-50 text-gray-700"
                        }`}>
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setHistPage(p => Math.min(histPagination.pages, p + 1))}
                    disabled={histPagination.page >= histPagination.pages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Clôture Modal ── */}
      {showClotureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Clôturer la journée</h3>
            <p className="text-sm text-gray-500 mb-4">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
              {totaux.map(t => (
                <div key={t.mode_paiement} className="flex justify-between text-sm">
                  <span className="text-gray-600">{MODE_LABELS[t.mode_paiement]}</span>
                  <span className="font-semibold">{fmt(t.total)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span className="text-emerald-700">{fmt(totalGeneral)}</span>
              </div>
            </div>
            <textarea value={clotureNotes} onChange={e => setClotureNotes(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-4 text-sm" rows={3}
              placeholder="Notes (optionnel)..." />
            <div className="flex gap-3">
              <Button onClick={() => setShowClotureModal(false)} variant="outline" className="flex-1">Annuler</Button>
              <Button onClick={handleCloture} variant="primary" className="flex-1">Confirmer la clôture</Button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmDialog isOpen={confirmOpen} onClose={handleCancel} onConfirm={handleConfirm}
        title={confirmOptions.title} message={confirmOptions.message}
        confirmLabel={confirmOptions.confirmLabel} cancelLabel={confirmOptions.cancelLabel}
        variant={confirmOptions.variant} />

      {/* ── EncaisserModal (paiements liés) ── */}
      {encaisserData && (
        <EncaisserModal
          data={encaisserData}
          onClose={() => setEncaisserData(null)}
          onSuccess={(num) => {
            toast.success(`Encaissé · Reçu ${num}`);
            setEncaisserData(null);
            loadTransactions();
            loadStats();
            loadReservations();
          }}
        />
      )}
    </div>
  );
}
