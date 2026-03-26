import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  Calendar,
  Users,
  Building,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  Clock,
  XCircle,
  CreditCard,
  FileText,
  Target,
  BarChart3,
  Zap,
  Loader2,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import RevenueChart from "../../../components/charts/RevenueChart";
import SpacePerformanceChart from "../../../components/charts/SpacePerformanceChart";
import StatusPieChart from "../../../components/charts/StatusPieChart";
import { formatCurrency, formatNumber } from "../../../utils/formatters";
import { apiClient } from "../../../lib/api-client";

type Period = "day" | "week" | "month" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  day: "Aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois",
  year: "Cette année",
};

interface AnalyticsKpi {
  revenue_total: number;
  revenue_reservations: number;
  revenue_abonnements: number;
  revenue_domiciliations: number;
  revenue_caisse: number;
  nb_reservations: number;
  nb_annulations: number;
  nb_new_users: number;
  occupancy_rate: number;
  avg_ticket: number;
  confirmation_rate: number;
  cancellation_rate: number;
  hours_booked: number;
  revenue_lost: number;
  revpar: number;
  revenue_per_hour: number;
  abo_actif_count: number;
  dom_actif_count: number;
}

interface AnalyticsData {
  period: Period;
  kpi: AnalyticsKpi;
  variations: { revenue_total: number; nb_reservations: number; nb_new_users: number };
  revenue_trend: { label: string; revenue: number; count: number }[];
  space_performance: { name: string; reservations: number; revenue: number; percentage: number }[];
  status_breakdown: { confirmee: number; en_attente: number; en_cours: number; terminee: number; annulee: number };
  top_clients: { id: string; prenom: string; nom: string; email: string; reservationCount: number; totalSpent: number }[];
  payment_methods: { name: string; count: number; amount: number }[];
}

const EMPTY_KPI: AnalyticsKpi = {
  revenue_total: 0, revenue_reservations: 0, revenue_abonnements: 0,
  revenue_domiciliations: 0, revenue_caisse: 0,
  nb_reservations: 0, nb_annulations: 0, nb_new_users: 0,
  occupancy_rate: 0, avg_ticket: 0, confirmation_rate: 0,
  cancellation_rate: 0, hours_booked: 0, revenue_lost: 0,
  revpar: 0, revenue_per_hour: 0, abo_actif_count: 0, dom_actif_count: 0,
};

async function fetchAnalytics(period: Period): Promise<AnalyticsData> {
  const res = await apiClient.getAnalytics(period);
  if (!res.success || !res.data) throw new Error(res.error ?? "Erreur API");
  return res.data as AnalyticsData;
}

export default function Reports() {
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: Period, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await fetchAnalytics(p);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  const handleRefresh = useCallback(() => load(period, true), [period, load]);

  const kpi  = data?.kpi  ?? EMPTY_KPI;
  const vars = data?.variations ?? { revenue_total: 0, nb_reservations: 0, nb_new_users: 0 };

  // Shapes pour les composants charts existants
  const statusPieData = data ? {
    confirmees: data.status_breakdown.confirmee + data.status_breakdown.en_cours,
    enAttente: data.status_breakdown.en_attente,
    terminees: data.status_breakdown.terminee,
    annulees: data.status_breakdown.annulee,
    total: data.status_breakdown.confirmee + data.status_breakdown.en_cours + data.status_breakdown.en_attente + data.status_breakdown.terminee + data.status_breakdown.annulee,
  } : { confirmees: 0, enAttente: 0, terminees: 0, annulees: 0, total: 0 };

  const revenueTrendData = (data?.revenue_trend ?? []).map((p) => ({
    label: p.label,
    revenue: p.revenue,
    reservations: p.count,
  }));

  const spacePerformanceData = (data?.space_performance ?? []).map((s) => ({
    ...s,
    type: "",
  }));

  const exportPDF = useCallback(async () => {
    if (!data) return;
    setExportingPDF(true);
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Coffice - Rapport " + PERIOD_LABELS[period], 14, 22);
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 30);

    autoTable(doc, {
      startY: 38,
      head: [["Indicateur", "Valeur", "Variation"]],
      body: [
        ["Revenus totaux",       `${formatNumber(kpi.revenue_total)} DA`,        `${vars.revenue_total > 0 ? "+" : ""}${vars.revenue_total}%`],
        ["  - Réservations",     `${formatNumber(kpi.revenue_reservations)} DA`,  ""],
        ["  - Abonnements",      `${formatNumber(kpi.revenue_abonnements)} DA`,   ""],
        ["  - Domiciliations",   `${formatNumber(kpi.revenue_domiciliations)} DA`,""],
        ["  - Caisse",           `${formatNumber(kpi.revenue_caisse)} DA`,        ""],
        ["Réservations",         `${kpi.nb_reservations}`,                        `${vars.nb_reservations > 0 ? "+" : ""}${vars.nb_reservations}%`],
        ["Nouveaux utilisateurs",`${kpi.nb_new_users}`,                           `${vars.nb_new_users > 0 ? "+" : ""}${vars.nb_new_users}%`],
        ["Taux d'occupation",    `${kpi.occupancy_rate}%`,                        ""],
        ["Ticket moyen",         `${formatNumber(kpi.avg_ticket)} DA`,            ""],
        ["Taux de confirmation", `${kpi.confirmation_rate}%`,                     ""],
        ["Heures réservées",     `${kpi.hours_booked}h`,                          ""],
        ["Annulations",          `${kpi.nb_annulations} (${kpi.cancellation_rate}%)`, `${formatNumber(kpi.revenue_lost)} DA perdus`],
        ["RevPAR",               `${formatNumber(kpi.revpar)} DA`,                ""],
        ["Rev./heure",           `${formatNumber(kpi.revenue_per_hour)} DA`,      ""],
      ],
    });

    if (data.top_clients.length > 0) {
      const prevY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 120;
      doc.setFontSize(14);
      doc.text("Top Clients", 14, prevY + 10);
      autoTable(doc, {
        startY: prevY + 15,
        head: [["Client", "Réservations", "Montant"]],
        body: data.top_clients.map((c) => [
          `${c.prenom} ${c.nom}`,
          `${c.reservationCount}`,
          `${formatNumber(c.totalSpent)} DA`,
        ]),
      });
    }

    doc.save(`coffice-rapport-${period}-${new Date().toISOString().slice(0, 10)}.pdf`);
    setExportingPDF(false);
  }, [data, period, kpi, vars]);

  const exportExcel = useCallback(async () => {
    if (!data) return;
    setExportingExcel(true);
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const kpiSheet = [
      { Indicateur: "Revenus totaux",         Valeur: kpi.revenue_total,          Variation: `${vars.revenue_total}%` },
      { Indicateur: "Revenus réservations",   Valeur: kpi.revenue_reservations,   Variation: "" },
      { Indicateur: "Revenus abonnements",    Valeur: kpi.revenue_abonnements,    Variation: "" },
      { Indicateur: "Revenus domiciliations", Valeur: kpi.revenue_domiciliations, Variation: "" },
      { Indicateur: "Encaissements caisse",   Valeur: kpi.revenue_caisse,         Variation: "" },
      { Indicateur: "Réservations",           Valeur: kpi.nb_reservations,        Variation: `${vars.nb_reservations}%` },
      { Indicateur: "Nouveaux utilisateurs",  Valeur: kpi.nb_new_users,           Variation: `${vars.nb_new_users}%` },
      { Indicateur: "Taux occupation",        Valeur: `${kpi.occupancy_rate}%`,   Variation: "" },
      { Indicateur: "Ticket moyen",           Valeur: kpi.avg_ticket,             Variation: "" },
      { Indicateur: "Taux confirmation",      Valeur: `${kpi.confirmation_rate}%`,Variation: "" },
      { Indicateur: "Heures réservées",       Valeur: kpi.hours_booked,           Variation: "" },
      { Indicateur: "Annulations",            Valeur: kpi.nb_annulations,         Variation: `${kpi.cancellation_rate}%` },
      { Indicateur: "RevPAR",                 Valeur: kpi.revpar,                 Variation: "" },
      { Indicateur: "Rev./heure",             Valeur: kpi.revenue_per_hour,       Variation: "" },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiSheet), "KPI");

    if (data.top_clients.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        data.top_clients.map((c) => ({ Client: `${c.prenom} ${c.nom}`, Email: c.email, Réservations: c.reservationCount, Montant: c.totalSpent }))
      ), "Top Clients");
    }

    if (data.space_performance.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        data.space_performance.map((s) => ({ Espace: s.name, Réservations: s.reservations, Revenus: s.revenue, Part: `${s.percentage}%` }))
      ), "Espaces");
    }

    XLSX.writeFile(wb, `coffice-rapport-${period}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setExportingExcel(false);
  }, [data, period, kpi, vars]);

  const VariationBadge = ({ value }: { value: number }) => {
    if (value === 0) return null;
    const pos = value > 0;
    return (
      <div className={`flex items-center text-xs font-semibold ${pos ? "text-emerald-600" : "text-red-600"}`}>
        {pos ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
        {pos ? "+" : ""}{value}%
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Rapports & Statistiques</h1>
          <p className="text-gray-500 mt-1">Analyse détaillée de l'activité Coffice</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["day", "week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </motion.div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Erreur API :</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Chargement des statistiques…</span>
        </div>
      ) : (
        <>
          {/* ── KPI cards ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                  </div>
                  <VariationBadge value={vars.revenue_total} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpi.revenue_total)}</p>
                <p className="text-sm text-gray-500 mt-1">Revenus totaux</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <VariationBadge value={vars.nb_reservations} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{kpi.nb_reservations}</p>
                <p className="text-sm text-gray-500 mt-1">Réservations</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <VariationBadge value={vars.nb_new_users} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{kpi.nb_new_users}</p>
                <p className="text-sm text-gray-500 mt-1">Nouveaux utilisateurs</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                    <Building className="w-5 h-5 text-teal-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{kpi.occupancy_rate}%</p>
                <p className="text-sm text-gray-500 mt-1">Taux d'occupation</p>
              </Card>
            </motion.div>
          </div>

          {/* ── Mini KPIs ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <Card className="p-4 text-center">
              <Target className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <p className="text-base font-bold text-gray-900">{formatCurrency(kpi.avg_ticket)}</p>
              <p className="text-xs text-gray-500">Ticket moyen</p>
            </Card>
            <Card className="p-4 text-center">
              <Clock className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <p className="text-base font-bold text-gray-900">{kpi.hours_booked}h</p>
              <p className="text-xs text-gray-500">Heures réservées</p>
            </Card>
            <Card className="p-4 text-center">
              <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
              <p className="text-base font-bold text-gray-900">{kpi.confirmation_rate}%</p>
              <p className="text-xs text-gray-500">Taux confirmation</p>
            </Card>
            <Card className="p-4 text-center">
              <XCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
              <p className="text-base font-bold text-gray-900">{kpi.nb_annulations}</p>
              <p className="text-xs text-gray-500">Annulations ({kpi.cancellation_rate}%)</p>
            </Card>
            <Card className="p-4 text-center">
              <CreditCard className="w-5 h-5 text-teal-500 mx-auto mb-2" />
              <p className="text-base font-bold text-gray-900">{kpi.abo_actif_count}</p>
              <p className="text-xs text-gray-500">Abonnés actifs</p>
            </Card>
            <Card className="p-4 text-center">
              <FileText className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <p className="text-base font-bold text-gray-900">{kpi.dom_actif_count}</p>
              <p className="text-xs text-gray-500">Domiciliations</p>
            </Card>
            <Card className="p-4 text-center">
              <BarChart3 className="w-5 h-5 text-orange-500 mx-auto mb-2" />
              <p className="text-base font-bold text-gray-900">{formatCurrency(kpi.revpar)}</p>
              <p className="text-xs text-gray-500">RevPAR</p>
            </Card>
            <Card className="p-4 text-center">
              <Zap className="w-5 h-5 text-rose-500 mx-auto mb-2" />
              <p className="text-base font-bold text-gray-900">{formatCurrency(kpi.revenue_per_hour)}</p>
              <p className="text-xs text-gray-500">Rev./heure</p>
            </Card>
          </div>

          {/* ── Tendance + Sources ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tendance des revenus</h3>
                <RevenueChart data={revenueTrendData} />
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Sources de revenus</h3>
                <div className="space-y-4">
                  {[
                    { label: "Réservations", value: kpi.revenue_reservations, color: "bg-emerald-500" },
                    { label: "Abonnements",  value: kpi.revenue_abonnements,  color: "bg-amber-500"  },
                    { label: "Domiciliations",value: kpi.revenue_domiciliations,color:"bg-blue-500" },
                    { label: "Caisse",        value: kpi.revenue_caisse,       color: "bg-violet-500" },
                  ].map((source) => {
                    const pct = kpi.revenue_total > 0 ? Math.round((source.value / kpi.revenue_total) * 100) : 0;
                    return (
                      <div key={source.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{source.label}</span>
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(source.value)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${source.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">Total</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(kpi.revenue_total)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ── Performance espaces + Statut ──────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Performance par espace</h3>
                {spacePerformanceData.length > 0 ? (
                  <SpacePerformanceChart data={spacePerformanceData} />
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                    Aucune donnée pour cette période
                  </div>
                )}
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Statut des réservations</h3>
                <StatusPieChart data={statusPieData} />
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span className="text-xs text-gray-700">Confirmées: {statusPieData.confirmees}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                    <div className="w-3 h-3 bg-amber-500 rounded-full" />
                    <span className="text-xs text-gray-700">En attente: {statusPieData.enAttente}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-xs text-gray-700">Terminées: {statusPieData.terminees}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-xs text-gray-700">Annulées: {statusPieData.annulees}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ── Modes de paiement + Top clients ───────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Modes de paiement</h3>
                {(data?.payment_methods.length ?? 0) > 0 ? (
                  <div className="space-y-3">
                    {data!.payment_methods.map((pm) => (
                      <div key={pm.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{pm.name}</p>
                          <p className="text-xs text-gray-500">{pm.count} transaction(s)</p>
                        </div>
                        <p className="font-semibold text-emerald-600">{formatCurrency(pm.amount)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">Aucune donnée de paiement</p>
                )}
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top clients</h3>
                {(data?.top_clients.length ?? 0) > 0 ? (
                  <div className="space-y-3">
                    {data!.top_clients.slice(0, 5).map((client, idx) => (
                      <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-white text-sm font-bold">{idx + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{client.prenom} {client.nom}</p>
                            <p className="text-xs text-gray-500">{client.reservationCount} réservation(s)</p>
                          </div>
                        </div>
                        <p className="font-semibold text-emerald-600">{formatCurrency(client.totalSpent)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">Aucun client pour cette période</p>
                )}
              </Card>
            </motion.div>
          </div>

          {/* ── Export ────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Exporter les données</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Télécharger le rapport {PERIOD_LABELS[period].toLowerCase()} en PDF ou Excel
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportPDF} disabled={!data || exportingPDF}>
                    {exportingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Export PDF
                  </Button>
                  <Button variant="outline" onClick={exportExcel} disabled={!data || exportingExcel}>
                    {exportingExcel ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Export Excel
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
