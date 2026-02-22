import { useState, useMemo, useCallback } from "react";
import {
  Banknote,
  Calendar,
  Users,
  Building,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Download,
  Clock,
  XCircle,
  CreditCard,
  Target,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import RevenueChart from "../charts/RevenueChart";
import SpacePerformanceChart from "../charts/SpacePerformanceChart";
import StatusPieChart from "../charts/StatusPieChart";
import { useAppStore } from "../../store/store";
import { formatCurrency, formatNumber } from "../../utils/formatters";
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
} from "../../services/statistics";
import type { Period } from "../../services/statistics";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const PERIOD_LABELS: Record<Period, string> = {
  day: "Aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois",
  year: "Cette annee",
};

export default function AnalyticsAndReporting() {
  const [period, setPeriod] = useState<Period>("month");

  const {
    reservations,
    espaces,
    users,
    demandesDomiciliation,
    abonnementsUtilisateurs,
    transactions,
  } = useAppStore();

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

  const spacePerformance = useMemo(() => calcSpacePerformance(espaces, reservations, range), [espaces, reservations, range]);
  const statusBreakdown = useMemo(() => calcReservationStatus(reservations, range), [reservations, range]);
  const topClients = useMemo(() => calcTopClients(users, reservations, range, 10), [users, reservations, range]);
  const revenueTrend = useMemo(() => calcRevenueTrend(reservations, period), [reservations, period]);
  const cancellationStats = useMemo(() => calcCancellationStats(reservations, range), [reservations, range]);
  const hoursBooked = useMemo(() => calcHoursBooked(reservations, range), [reservations, range]);
  const averageTicket = useMemo(() => calcAverageTicket(reservations, range), [reservations, range]);
  const confirmationRate = useMemo(() => calcConfirmationRate(reservations, range), [reservations, range]);
  const domiciliationStats = useMemo(() => calcDomiciliationStats(demandesDomiciliation), [demandesDomiciliation]);
  const subscriptionStats = useMemo(() => calcSubscriptionStats(abonnementsUtilisateurs), [abonnementsUtilisateurs]);
  const occupancyRate = useMemo(() => calcOccupancyRate(espaces, reservations), [espaces, reservations]);
  const newUsers = useMemo(() => calcNewUsers(users, range), [users, range]);

  const totalExpenses = useMemo(
    () => transactions.filter((t) => t.type === "remboursement").reduce((sum, t) => sum + t.montant, 0),
    [transactions],
  );

  const profit = currentRevenue.total - totalExpenses;
  const profitMargin = currentRevenue.total > 0 ? Math.round((profit / currentRevenue.total) * 100) : 0;

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Coffice ERP - Rapport " + PERIOD_LABELS[period], 14, 22);
    doc.setFontSize(10);
    doc.text(`Genere le ${new Date().toLocaleDateString("fr-FR")}`, 14, 30);

    autoTable(doc, {
      startY: 38,
      head: [["Indicateur", "Valeur"]],
      body: [
        ["Revenus totaux", `${formatNumber(currentRevenue.total)} DA`],
        ["Reservations", `${formatNumber(currentRevenue.reservations)} DA`],
        ["Abonnements", `${formatNumber(currentRevenue.abonnements)} DA`],
        ["Domiciliations", `${formatNumber(currentRevenue.domiciliations)} DA`],
        ["Depenses (remboursements)", `${formatNumber(totalExpenses)} DA`],
        ["Profit net", `${formatNumber(profit)} DA`],
        ["Marge", `${profitMargin}%`],
        ["Taux d'occupation", `${occupancyRate}%`],
        ["Ticket moyen", `${formatNumber(averageTicket)} DA`],
        ["Taux confirmation", `${confirmationRate}%`],
        ["Heures reservees", `${hoursBooked}h`],
        ["Utilisateurs actifs", `${users.filter((u) => u.statut === "actif").length}`],
        ["Abonnes actifs", `${subscriptionStats.activeCount}`],
        ["Domiciliations actives", `${domiciliationStats.active}`],
      ],
    });

    if (topClients.length > 0) {
      const prevY = (doc as unknown as Record<string, { finalY?: number }>).lastAutoTable?.finalY || 140;
      doc.setFontSize(14);
      doc.text("Top 10 Clients", 14, prevY + 10);
      autoTable(doc, {
        startY: prevY + 15,
        head: [["Client", "Email", "Reservations", "CA"]],
        body: topClients.map((c) => [
          `${c.prenom} ${c.nom}`,
          c.email,
          `${c.reservationCount}`,
          `${formatNumber(c.totalSpent)} DA`,
        ]),
      });
    }

    doc.save(`coffice-erp-rapport-${period}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [period, currentRevenue, totalExpenses, profit, profitMargin, occupancyRate, averageTicket, confirmationRate, hoursBooked, users, subscriptionStats, domiciliationStats, topClients]);

  const exportExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { Indicateur: "Revenus totaux", Valeur: currentRevenue.total },
      { Indicateur: "Reservations", Valeur: currentRevenue.reservations },
      { Indicateur: "Abonnements", Valeur: currentRevenue.abonnements },
      { Indicateur: "Domiciliations", Valeur: currentRevenue.domiciliations },
      { Indicateur: "Depenses", Valeur: totalExpenses },
      { Indicateur: "Profit net", Valeur: profit },
      { Indicateur: "Marge", Valeur: `${profitMargin}%` },
      { Indicateur: "Taux occupation", Valeur: `${occupancyRate}%` },
      { Indicateur: "Ticket moyen", Valeur: averageTicket },
      { Indicateur: "Heures reservees", Valeur: hoursBooked },
    ]), "Synthese");

    if (topClients.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        topClients.map((c) => ({ Client: `${c.prenom} ${c.nom}`, Email: c.email, Reservations: c.reservationCount, CA: c.totalSpent }))
      ), "Clients");
    }

    if (spacePerformance.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        spacePerformance.map((s) => ({ Espace: s.name, Reservations: s.reservations, CA: s.revenue, Part: `${s.percentage}%` }))
      ), "Espaces");
    }

    XLSX.writeFile(wb, `coffice-erp-rapport-${period}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [period, currentRevenue, totalExpenses, profit, profitMargin, occupancyRate, averageTicket, hoursBooked, topClients, spacePerformance]);

  const VariationBadge = ({ value }: { value: number }) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
      <span className={`inline-flex items-center text-xs font-semibold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
        {isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
        {isPositive ? "+" : ""}{value}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Rapports & Analytiques ERP</h2>
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
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <Banknote className="w-5 h-5 text-emerald-600" />
            <VariationBadge value={revenueVariation} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentRevenue.total)}</p>
          <p className="text-xs text-gray-600 mt-1">Revenus</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-gray-600 mt-1">Depenses</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center mb-2">
            <Banknote className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(profit)}</p>
          <p className="text-xs text-gray-600 mt-1">Profit net</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center mb-2">
            <Target className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{profitMargin}%</p>
          <p className="text-xs text-gray-600 mt-1">Marge</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { icon: Building, label: "Occupation", value: `${occupancyRate}%`, color: "text-teal-500" },
          { icon: Calendar, label: "Reservations", value: `${statusBreakdown.total}`, color: "text-amber-500" },
          { icon: Clock, label: "Heures", value: `${hoursBooked}h`, color: "text-blue-500" },
          { icon: Target, label: "Ticket moy.", value: formatCurrency(averageTicket), color: "text-emerald-500" },
          { icon: TrendingUp, label: "Confirmation", value: `${confirmationRate}%`, color: "text-emerald-500" },
          { icon: XCircle, label: "Annulations", value: `${cancellationStats.total}`, color: "text-red-500" },
          { icon: Users, label: "Nouveaux", value: `${newUsers}`, color: "text-blue-500" },
          { icon: CreditCard, label: "Abonnes", value: `${subscriptionStats.activeCount}`, color: "text-teal-500" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-3 text-center">
            <kpi.icon className={`w-4 h-4 ${kpi.color} mx-auto mb-1`} />
            <p className="text-sm font-bold text-gray-900">{kpi.value}</p>
            <p className="text-[10px] text-gray-500">{kpi.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tendance des revenus</h3>
          <RevenueChart data={revenueTrend} />
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Performance par espace</h3>
          {spacePerformance.length > 0 ? (
            <SpacePerformanceChart data={spacePerformance} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">Aucune donnee</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Statut reservations</h3>
          <StatusPieChart data={statusBreakdown} />
        </Card>

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
                    <span className="text-sm text-gray-700">{source.label}</span>
                    <span className="text-sm font-semibold">{formatCurrency(source.value)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${source.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Domiciliation & Abonnements</h3>
          <div className="space-y-4">
            <div className="p-3 bg-teal-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Domiciliations actives</span>
                <span className="text-lg font-bold text-teal-600">{domiciliationStats.active}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{domiciliationStats.pending} en attente / {domiciliationStats.total} total</p>
              <p className="text-xs text-emerald-600 mt-1">Revenus: {formatCurrency(domiciliationStats.revenue)}/mois</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Abonnes actifs</span>
                <span className="text-lg font-bold text-amber-600">{subscriptionStats.activeCount}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{subscriptionStats.total} total</p>
              <p className="text-xs text-emerald-600 mt-1">Revenus: {formatCurrency(subscriptionStats.monthlyRevenue)}/mois</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Clients</h3>
        {topClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reservations</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topClients.map((client, idx) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{idx + 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{client.prenom} {client.nom}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{client.email}</td>
                    <td className="px-4 py-3 text-right text-sm">{client.reservationCount}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatCurrency(client.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">Aucun client pour cette periode</p>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Exporter le rapport ERP</h3>
            <p className="text-sm text-gray-500 mt-1">{PERIOD_LABELS[period]} - Rapport complet avec synthese financiere</p>
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
    </div>
  );
}
