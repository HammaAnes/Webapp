import { useState, useMemo, useCallback, useEffect } from "react";
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
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import RevenueChart from "../../../components/charts/RevenueChart";
import SpacePerformanceChart from "../../../components/charts/SpacePerformanceChart";
import StatusPieChart from "../../../components/charts/StatusPieChart";
import { useAppStore } from "../../../store/store";
import { formatCurrency, formatNumber } from "../../../utils/formatters";
import {
  getPeriodRange,
  getPreviousPeriodRange,
  calcVariation,
  calcRevenueBySource,
  calcSpacePerformance,
  calcReservationStatus,
  calcOccupancyRate,
  calcTopClients,
  calcRevenueTrend,
  calcCancellationStats,
  calcNewUsers,
  calcHoursBooked,
  calcAverageTicket,
  calcConfirmationRate,
  calcDomiciliationStats,
  calcSubscriptionStats,
  calcPaymentMethods,
} from "../../../services/statistics";
import type { Period } from "../../../services/statistics";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const PERIOD_LABELS: Record<Period, string> = {
  day: "Aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois",
  year: "Cette annee",
};

export default function Reports() {
  const [period, setPeriod] = useState<Period>("month");
  const [refreshing, setRefreshing] = useState(false);

  const {
    reservations,
    espaces,
    users,
    demandesDomiciliation,
    abonnementsUtilisateurs,
    initializeData,
    loadUsers,
    loadDemandesDomiciliation,
    initialized,
  } = useAppStore();

  useEffect(() => {
    if (!initialized) {
      initializeData();
    }
  }, [initialized, initializeData]);

  const range = useMemo(() => getPeriodRange(period), [period]);
  const prevRange = useMemo(() => getPreviousPeriodRange(period), [period]);

  const currentRevenue = useMemo(
    () => calcRevenueBySource(reservations, abonnementsUtilisateurs, demandesDomiciliation, range),
    [reservations, abonnementsUtilisateurs, demandesDomiciliation, range],
  );
  const prevRevenue = useMemo(
    () => calcRevenueBySource(reservations, abonnementsUtilisateurs, demandesDomiciliation, prevRange),
    [reservations, abonnementsUtilisateurs, demandesDomiciliation, prevRange],
  );

  const revenueVariation = calcVariation(currentRevenue.total, prevRevenue.total);

  const currentReservationCount = useMemo(
    () => reservations.filter((r) => {
      const d = new Date(r.dateCreation || r.createdAt || r.dateDebut);
      return d >= range.start && d <= range.end && r.statut !== "annulee";
    }).length,
    [reservations, range],
  );
  const prevReservationCount = useMemo(
    () => reservations.filter((r) => {
      const d = new Date(r.dateCreation || r.createdAt || r.dateDebut);
      return d >= prevRange.start && d <= prevRange.end && r.statut !== "annulee";
    }).length,
    [reservations, prevRange],
  );
  const reservationVariation = calcVariation(currentReservationCount, prevReservationCount);

  const currentNewUsers = useMemo(() => calcNewUsers(users, range), [users, range]);
  const prevNewUsers = useMemo(() => calcNewUsers(users, prevRange), [users, prevRange]);
  const userVariation = calcVariation(currentNewUsers, prevNewUsers);

  const occupancyRate = useMemo(() => calcOccupancyRate(espaces, reservations), [espaces, reservations]);

  const spacePerformance = useMemo(() => calcSpacePerformance(espaces, reservations, range), [espaces, reservations, range]);
  const statusBreakdown = useMemo(() => calcReservationStatus(reservations, range), [reservations, range]);
  const topClients = useMemo(() => calcTopClients(users, reservations, range), [users, reservations, range]);
  const revenueTrend = useMemo(() => calcRevenueTrend(reservations, period), [reservations, period]);
  const cancellationStats = useMemo(() => calcCancellationStats(reservations, range), [reservations, range]);
  const hoursBooked = useMemo(() => calcHoursBooked(reservations, range), [reservations, range]);
  const averageTicket = useMemo(() => calcAverageTicket(reservations, range), [reservations, range]);
  const confirmationRate = useMemo(() => calcConfirmationRate(reservations, range), [reservations, range]);
  const domiciliationStats = useMemo(() => calcDomiciliationStats(demandesDomiciliation), [demandesDomiciliation]);
  const subscriptionStats = useMemo(() => calcSubscriptionStats(abonnementsUtilisateurs), [abonnementsUtilisateurs]);
  const paymentMethods = useMemo(() => calcPaymentMethods(reservations, range), [reservations, range]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([initializeData(), loadUsers(), loadDemandesDomiciliation()]);
    } finally {
      setRefreshing(false);
    }
  }, [initializeData, loadUsers, loadDemandesDomiciliation]);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Coffice - Rapport " + PERIOD_LABELS[period], 14, 22);
    doc.setFontSize(10);
    doc.text(`Genere le ${new Date().toLocaleDateString("fr-FR")}`, 14, 30);

    autoTable(doc, {
      startY: 38,
      head: [["Indicateur", "Valeur", "Variation"]],
      body: [
        ["Revenus totaux", `${formatNumber(currentRevenue.total)} DA`, `${revenueVariation > 0 ? "+" : ""}${revenueVariation}%`],
        ["  - Reservations", `${formatNumber(currentRevenue.reservations)} DA`, ""],
        ["  - Abonnements", `${formatNumber(currentRevenue.abonnements)} DA`, ""],
        ["  - Domiciliations", `${formatNumber(currentRevenue.domiciliations)} DA`, ""],
        ["Reservations", `${currentReservationCount}`, `${reservationVariation > 0 ? "+" : ""}${reservationVariation}%`],
        ["Nouveaux utilisateurs", `${currentNewUsers}`, `${userVariation > 0 ? "+" : ""}${userVariation}%`],
        ["Taux d'occupation", `${occupancyRate}%`, ""],
        ["Ticket moyen", `${formatNumber(averageTicket)} DA`, ""],
        ["Taux de confirmation", `${confirmationRate}%`, ""],
        ["Heures reservees", `${hoursBooked}h`, ""],
        ["Annulations", `${cancellationStats.total} (${cancellationStats.rate}%)`, `${formatNumber(cancellationStats.revenueLost)} DA perdus`],
      ],
    });

    if (topClients.length > 0) {
      const prevY = (doc as unknown as Record<string, { finalY?: number }>).lastAutoTable?.finalY || 120;
      doc.setFontSize(14);
      doc.text("Top Clients", 14, prevY + 10);
      autoTable(doc, {
        startY: prevY + 15,
        head: [["Client", "Reservations", "Montant"]],
        body: topClients.map((c) => [
          `${c.prenom} ${c.nom}`,
          `${c.reservationCount}`,
          `${formatNumber(c.totalSpent)} DA`,
        ]),
      });
    }

    doc.save(`coffice-rapport-${period}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [period, currentRevenue, revenueVariation, currentReservationCount, reservationVariation, currentNewUsers, userVariation, occupancyRate, averageTicket, confirmationRate, hoursBooked, cancellationStats, topClients]);

  const exportExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();

    const kpiData = [
      { Indicateur: "Revenus totaux", Valeur: currentRevenue.total, Variation: `${revenueVariation}%` },
      { Indicateur: "Revenus reservations", Valeur: currentRevenue.reservations, Variation: "" },
      { Indicateur: "Revenus abonnements", Valeur: currentRevenue.abonnements, Variation: "" },
      { Indicateur: "Revenus domiciliations", Valeur: currentRevenue.domiciliations, Variation: "" },
      { Indicateur: "Reservations", Valeur: currentReservationCount, Variation: `${reservationVariation}%` },
      { Indicateur: "Nouveaux utilisateurs", Valeur: currentNewUsers, Variation: `${userVariation}%` },
      { Indicateur: "Taux occupation", Valeur: `${occupancyRate}%`, Variation: "" },
      { Indicateur: "Ticket moyen", Valeur: averageTicket, Variation: "" },
      { Indicateur: "Taux confirmation", Valeur: `${confirmationRate}%`, Variation: "" },
      { Indicateur: "Heures reservees", Valeur: hoursBooked, Variation: "" },
      { Indicateur: "Annulations", Valeur: cancellationStats.total, Variation: `${cancellationStats.rate}%` },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiData), "KPI");

    if (topClients.length > 0) {
      const clientData = topClients.map((c) => ({
        Client: `${c.prenom} ${c.nom}`,
        Email: c.email,
        Reservations: c.reservationCount,
        Montant: c.totalSpent,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientData), "Top Clients");
    }

    if (spacePerformance.length > 0) {
      const spaceData = spacePerformance.map((s) => ({
        Espace: s.name,
        Reservations: s.reservations,
        Revenus: s.revenue,
        Part: `${s.percentage}%`,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(spaceData), "Espaces");
    }

    XLSX.writeFile(wb, `coffice-rapport-${period}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [period, currentRevenue, revenueVariation, currentReservationCount, reservationVariation, currentNewUsers, userVariation, occupancyRate, averageTicket, confirmationRate, hoursBooked, cancellationStats, topClients, spacePerformance]);

  const VariationBadge = ({ value }: { value: number }) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
      <div className={`flex items-center text-xs font-semibold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
        {isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
        {isPositive ? "+" : ""}{value}%
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
          <p className="text-gray-500 mt-1">Analyse detaillee de l'activite Coffice</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["day", "week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? "bg-amber-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Banknote className="w-5 h-5 text-emerald-600" />
              </div>
              <VariationBadge value={revenueVariation} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentRevenue.total)}</p>
            <p className="text-sm text-gray-500 mt-1">Revenus totaux</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <VariationBadge value={reservationVariation} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{currentReservationCount}</p>
            <p className="text-sm text-gray-500 mt-1">Reservations</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <VariationBadge value={userVariation} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{currentNewUsers}</p>
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
            <p className="text-2xl font-bold text-gray-900">{occupancyRate}%</p>
            <p className="text-sm text-gray-500 mt-1">Taux d'occupation</p>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4 text-center">
          <Target className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">{formatCurrency(averageTicket)}</p>
          <p className="text-xs text-gray-500">Ticket moyen</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">{hoursBooked}h</p>
          <p className="text-xs text-gray-500">Heures reservees</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">{confirmationRate}%</p>
          <p className="text-xs text-gray-500">Taux confirmation</p>
        </Card>
        <Card className="p-4 text-center">
          <XCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">{cancellationStats.total}</p>
          <p className="text-xs text-gray-500">Annulations ({cancellationStats.rate}%)</p>
        </Card>
        <Card className="p-4 text-center">
          <CreditCard className="w-5 h-5 text-teal-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">{subscriptionStats.activeCount}</p>
          <p className="text-xs text-gray-500">Abonnes actifs</p>
        </Card>
        <Card className="p-4 text-center">
          <FileText className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900">{domiciliationStats.active}</p>
          <p className="text-xs text-gray-500">Domiciliations actives</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tendance des revenus</h3>
            <RevenueChart data={revenueTrend} />
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Sources de revenus</h3>
            <div className="space-y-4">
              {[
                { label: "Reservations", value: currentRevenue.reservations, color: "bg-emerald-500" },
                { label: "Abonnements", value: currentRevenue.abonnements, color: "bg-amber-500" },
                { label: "Domiciliations", value: currentRevenue.domiciliations, color: "bg-blue-500" },
              ].map((source) => {
                const pct = currentRevenue.total > 0 ? Math.round((source.value / currentRevenue.total) * 100) : 0;
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
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(currentRevenue.total)}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Performance par espace</h3>
            {spacePerformance.length > 0 ? (
              <SpacePerformanceChart data={spacePerformance} />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                Aucune donnee pour cette periode
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Statut des reservations</h3>
            <StatusPieChart data={statusBreakdown} />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-xs text-gray-700">Confirmees: {statusBreakdown.confirmees}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span className="text-xs text-gray-700">En attente: {statusBreakdown.enAttente}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-xs text-gray-700">Terminees: {statusBreakdown.terminees}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-xs text-gray-700">Annulees: {statusBreakdown.annulees}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Modes de paiement</h3>
            {paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map((pm) => (
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
              <p className="text-gray-400 text-sm text-center py-8">Aucune donnee de paiement</p>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top 5 clients</h3>
            {topClients.length > 0 ? (
              <div className="space-y-3">
                {topClients.map((client, idx) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{idx + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{client.prenom} {client.nom}</p>
                        <p className="text-xs text-gray-500">{client.reservationCount} reservation(s)</p>
                      </div>
                    </div>
                    <p className="font-semibold text-emerald-600">{formatCurrency(client.totalSpent)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">Aucun client pour cette periode</p>
            )}
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Exporter les donnees</h3>
              <p className="text-sm text-gray-500 mt-1">
                Telecharger le rapport {PERIOD_LABELS[period].toLowerCase()} en PDF ou Excel
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={exportExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
