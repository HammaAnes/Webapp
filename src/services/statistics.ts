import type {
  Reservation,
  Espace,
  User,
  DemandeDomiciliation,
  AbonnementUtilisateur,
} from "../types";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  differenceInHours,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
  isWithinInterval,
} from "date-fns";
import { fr } from "date-fns/locale";

export type Period = "day" | "week" | "month" | "year";

interface PeriodRange {
  start: Date;
  end: Date;
}

export function getPeriodRange(period: Period, referenceDate = new Date()): PeriodRange {
  switch (period) {
    case "day":
      return { start: startOfDay(referenceDate), end: endOfDay(referenceDate) };
    case "week":
      return { start: startOfWeek(referenceDate, { weekStartsOn: 1 }), end: endOfWeek(referenceDate, { weekStartsOn: 1 }) };
    case "month":
      return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
    case "year":
      return { start: startOfYear(referenceDate), end: endOfYear(referenceDate) };
  }
}

export function getPreviousPeriodRange(period: Period, referenceDate = new Date()): PeriodRange {
  switch (period) {
    case "day":
      return getPeriodRange("day", subDays(referenceDate, 1));
    case "week":
      return getPeriodRange("week", subWeeks(referenceDate, 1));
    case "month":
      return getPeriodRange("month", subMonths(referenceDate, 1));
    case "year":
      return getPeriodRange("year", subYears(referenceDate, 1));
  }
}

function isInRange(date: Date | string, range: PeriodRange): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return isWithinInterval(d, { start: range.start, end: range.end });
}

function filterReservationsInRange(reservations: Reservation[], range: PeriodRange): Reservation[] {
  return reservations.filter((r) => {
    const date = new Date(r.dateCreation || r.createdAt || r.dateDebut);
    return isInRange(date, range);
  });
}

export function calcVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export interface RevenueBySource {
  reservations: number;
  abonnements: number;
  domiciliations: number;
  total: number;
}

export function calcRevenueBySource(
  reservations: Reservation[],
  abonnementsUtilisateurs: AbonnementUtilisateur[],
  domiciliations: DemandeDomiciliation[],
  range: PeriodRange,
): RevenueBySource {
  const resRevenue = filterReservationsInRange(reservations, range)
    .filter((r) => r.statut !== "annulee")
    .reduce((sum, r) => sum + (r.montantTotal || 0), 0);

  const abRevenue = abonnementsUtilisateurs
    .filter((a) => a.statut === "actif")
    .reduce((sum, a) => sum + (a.abonnement?.prix ?? 0), 0);

  const domRevenue = domiciliations
    .filter((d) => d.statut === "active")
    .reduce((sum, d) => sum + (d.montantMensuel || 15000), 0);

  return {
    reservations: resRevenue,
    abonnements: abRevenue,
    domiciliations: domRevenue,
    total: resRevenue + abRevenue + domRevenue,
  };
}

export interface SpacePerformance {
  name: string;
  type: string;
  reservations: number;
  revenue: number;
  percentage: number;
}

export function calcSpacePerformance(
  espaces: Espace[],
  reservations: Reservation[],
  range: PeriodRange,
): SpacePerformance[] {
  const periodRes = filterReservationsInRange(reservations, range)
    .filter((r) => r.statut !== "annulee");
  const total = periodRes.length || 1;

  const typeLabels: Record<string, string> = {
    box_4: "Box 4 places",
    box_3: "Box 3 places",
    open_space: "Open Space",
    salle_reunion: "Salle de Reunion",
    poste_informatique: "Poste Informatique",
  };

  const types = [...new Set(espaces.map((e) => e.type))];

  return types.map((type) => {
    const typeRes = periodRes.filter((r) => r.espace?.type === type);
    const revenue = typeRes.reduce((sum, r) => sum + (r.montantTotal || 0), 0);
    return {
      name: typeLabels[type] || type,
      type,
      reservations: typeRes.length,
      revenue,
      percentage: Math.round((typeRes.length / total) * 100),
    };
  }).sort((a, b) => b.reservations - a.reservations);
}

export interface ReservationStatusBreakdown {
  confirmees: number;
  enAttente: number;
  annulees: number;
  terminees: number;
  total: number;
}

export function calcReservationStatus(reservations: Reservation[], range: PeriodRange): ReservationStatusBreakdown {
  const periodRes = filterReservationsInRange(reservations, range);
  return {
    confirmees: periodRes.filter((r) => r.statut === "confirmee").length,
    enAttente: periodRes.filter((r) => r.statut === "en_attente").length,
    annulees: periodRes.filter((r) => r.statut === "annulee").length,
    terminees: periodRes.filter((r) => r.statut === "terminee").length,
    total: periodRes.length,
  };
}

export function calcOccupancyRate(
  espaces: Espace[],
  reservations: Reservation[],
  referenceDate = new Date(),
): number {
  if (espaces.length === 0) return 0;

  const totalCapacity = espaces.reduce((sum, e) => sum + (e.capacite || 1), 0);
  const now = referenceDate;

  const activeReservations = reservations.filter((r) => {
    const start = new Date(r.dateDebut);
    const end = new Date(r.dateFin);
    return r.statut === "confirmee" && start <= now && end >= now;
  });

  const occupiedCapacity = activeReservations.reduce((sum, r) => {
    const espace = espaces.find((e) => e.id === r.espaceId || e.id === r.espace?.id);
    return sum + (espace?.capacite || 1);
  }, 0);

  return Math.min(Math.round((occupiedCapacity / totalCapacity) * 100), 100);
}

export interface TopClient {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  totalSpent: number;
  reservationCount: number;
}

export function calcTopClients(
  users: User[],
  reservations: Reservation[],
  range: PeriodRange,
  limit = 5,
): TopClient[] {
  const periodRes = filterReservationsInRange(reservations, range)
    .filter((r) => r.statut !== "annulee");

  return users
    .map((u) => {
      const userRes = periodRes.filter(
        (r) => r.userId === u.id || r.utilisateur?.id === u.id,
      );
      return {
        id: u.id,
        nom: u.nom,
        prenom: u.prenom,
        email: u.email,
        totalSpent: userRes.reduce((sum, r) => sum + (r.montantTotal || 0), 0),
        reservationCount: userRes.length,
      };
    })
    .filter((c) => c.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

export interface RevenueTrendPoint {
  label: string;
  revenue: number;
  reservations: number;
}

export function calcRevenueTrend(
  reservations: Reservation[],
  period: Period,
): RevenueTrendPoint[] {
  const now = new Date();
  const range = getPeriodRange(period, now);

  let intervals: Date[];
  let formatStr: string;

  switch (period) {
    case "day":
      intervals = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(range.start);
        d.setHours(8 + i);
        return d;
      });
      formatStr = "HH'h'";
      break;
    case "week":
      intervals = eachDayOfInterval({ start: range.start, end: range.end });
      formatStr = "EEE";
      break;
    case "month":
      intervals = eachWeekOfInterval({ start: range.start, end: range.end }, { weekStartsOn: 1 });
      formatStr = "'S'w";
      break;
    case "year":
      intervals = eachMonthOfInterval({ start: range.start, end: range.end });
      formatStr = "MMM";
      break;
  }

  return intervals.map((date, idx) => {
    let bucketStart: Date;
    let bucketEnd: Date;

    if (period === "day") {
      bucketStart = new Date(date);
      bucketEnd = new Date(date);
      bucketEnd.setHours(bucketEnd.getHours() + 1);
    } else if (period === "week") {
      bucketStart = startOfDay(date);
      bucketEnd = endOfDay(date);
    } else if (period === "month") {
      bucketStart = date;
      bucketEnd = intervals[idx + 1] ? new Date(intervals[idx + 1].getTime() - 1) : range.end;
    } else {
      bucketStart = startOfMonth(date);
      bucketEnd = endOfMonth(date);
    }

    const bucketRes = reservations.filter((r) => {
      const d = new Date(r.dateCreation || r.createdAt || r.dateDebut);
      return d >= bucketStart && d <= bucketEnd && r.statut !== "annulee";
    });

    return {
      label: format(date, formatStr, { locale: fr }),
      revenue: bucketRes.reduce((sum, r) => sum + (r.montantTotal || 0), 0),
      reservations: bucketRes.length,
    };
  });
}

export interface PaymentMethodBreakdown {
  name: string;
  count: number;
  amount: number;
}

export function calcPaymentMethods(reservations: Reservation[], range: PeriodRange): PaymentMethodBreakdown[] {
  const periodRes = filterReservationsInRange(reservations, range)
    .filter((r) => r.statut !== "annulee");

  const methodLabels: Record<string, string> = {
    especes: "Especes",
    virement: "Virement",
    carte: "Carte",
    ccp: "CCP",
    "": "Non specifie",
  };

  const methods = new Map<string, { count: number; amount: number }>();

  periodRes.forEach((r) => {
    const method = r.modePaiement || "";
    const existing = methods.get(method) || { count: 0, amount: 0 };
    methods.set(method, {
      count: existing.count + 1,
      amount: existing.amount + (r.montantTotal || 0),
    });
  });

  return Array.from(methods.entries())
    .map(([method, data]) => ({
      name: methodLabels[method] || method,
      ...data,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface CancellationStats {
  total: number;
  rate: number;
  revenueLost: number;
}

export function calcCancellationStats(reservations: Reservation[], range: PeriodRange): CancellationStats {
  const periodRes = filterReservationsInRange(reservations, range);
  const cancelled = periodRes.filter((r) => r.statut === "annulee");
  const total = periodRes.length || 1;

  return {
    total: cancelled.length,
    rate: Math.round((cancelled.length / total) * 100),
    revenueLost: cancelled.reduce((sum, r) => sum + (r.montantTotal || 0), 0),
  };
}

export function calcNewUsers(users: User[], range: PeriodRange): number {
  return users.filter((u) => {
    const date = new Date(u.dateCreation || u.createdAt || 0);
    return isInRange(date, range);
  }).length;
}

export function calcHoursBooked(reservations: Reservation[], range: PeriodRange): number {
  return filterReservationsInRange(reservations, range)
    .filter((r) => r.statut !== "annulee")
    .reduce((sum, r) => {
      const start = new Date(r.dateDebut);
      const end = new Date(r.dateFin);
      return sum + Math.max(differenceInHours(end, start), 1);
    }, 0);
}

export function calcAverageTicket(reservations: Reservation[], range: PeriodRange): number {
  const periodRes = filterReservationsInRange(reservations, range)
    .filter((r) => r.statut !== "annulee");
  if (periodRes.length === 0) return 0;
  const total = periodRes.reduce((sum, r) => sum + (r.montantTotal || 0), 0);
  return Math.round(total / periodRes.length);
}

export function calcConfirmationRate(reservations: Reservation[], range: PeriodRange): number {
  const periodRes = filterReservationsInRange(reservations, range);
  if (periodRes.length === 0) return 0;
  const confirmed = periodRes.filter((r) => r.statut === "confirmee" || r.statut === "terminee").length;
  return Math.round((confirmed / periodRes.length) * 100);
}

export interface DomiciliationStats {
  active: number;
  pending: number;
  total: number;
  revenue: number;
}

export function calcDomiciliationStats(domiciliations: DemandeDomiciliation[]): DomiciliationStats {
  const active = domiciliations.filter((d) => d.statut === "active").length;
  const pending = domiciliations.filter((d) =>
    d.statut === "dossier_preparatoire" ||
    d.statut === "en_attente_signature" ||
    d.statut === "en_attente_complements"
  ).length;

  return {
    active,
    pending,
    total: domiciliations.length,
    revenue: active * 15000,
  };
}

export function calcSubscriptionStats(abonnementsUtilisateurs: AbonnementUtilisateur[]) {
  const active = abonnementsUtilisateurs.filter((a) => a.statut === "actif");
  return {
    activeCount: active.length,
    monthlyRevenue: active.reduce((sum, a) => sum + (a.abonnement?.prix ?? 0), 0),
    total: abonnementsUtilisateurs.length,
  };
}
