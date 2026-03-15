import { format, getDay } from "date-fns";
import { WORKING_HOURS } from "../constants/algeria";
import { apiClient } from "../lib/api-client";

export interface ReservationSlot {
  date_debut: string;
  date_fin: string;
  statut: string;
  participants: number;
}

export interface BlocageSlot {
  date_debut: string;
  date_fin: string;
}

export interface DayAvailability {
  date: Date;
  totalSlots: number;
  freeSlots: number;
  status: "available" | "partial" | "full" | "closed" | "past" | "blocked";
  reservedSeats?: number;
  totalCapacity?: number;
}

export interface MonthAvailabilityData {
  reservations: ReservationSlot[];
  blocages: BlocageSlot[];
}

const OPENING_HOUR = WORKING_HOURS.OPENING_HOUR;
const OPENING_MINUTE = WORKING_HOURS.OPENING_MINUTE;
const CLOSING_HOUR = WORKING_HOURS.CLOSING_HOUR;
const CLOSING_MINUTE = WORKING_HOURS.CLOSING_MINUTE;
const SLOT_DURATION_MINUTES = 60;

const TOTAL_MINUTES = (CLOSING_HOUR * 60 + CLOSING_MINUTE) - (OPENING_HOUR * 60 + OPENING_MINUTE);
const TOTAL_SLOTS = Math.floor(TOTAL_MINUTES / SLOT_DURATION_MINUTES);

export function isClosedDay(date: Date): boolean {
  const day = getDay(date);
  return day === 5 || day === 6;
}

function buildSlotTimes(dayStr: string): Array<{ start: Date; end: Date }> {
  const slots: Array<{ start: Date; end: Date }> = [];
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const startMin = (OPENING_HOUR * 60 + OPENING_MINUTE) + i * SLOT_DURATION_MINUTES;
    const endMin = startMin + SLOT_DURATION_MINUTES;
    const sh = Math.floor(startMin / 60);
    const sm = startMin % 60;
    const eh = Math.floor(endMin / 60);
    const em = endMin % 60;
    slots.push({
      start: new Date(`${dayStr}T${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}:00`),
      end: new Date(`${dayStr}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00`),
    });
  }
  return slots;
}

export function computeReservedSeatsForDay(day: Date, reservations: ReservationSlot[]): number {
  const dayStr = format(day, "yyyy-MM-dd");
  const slots = buildSlotTimes(dayStr);
  let maxSeats = 0;
  for (const slot of slots) {
    let seatsInSlot = 0;
    for (const r of reservations) {
      const rStart = new Date(r.date_debut);
      const rEnd = new Date(r.date_fin);
      if (rStart < slot.end && rEnd > slot.start) {
        seatsInSlot += r.participants;
      }
    }
    if (seatsInSlot > maxSeats) maxSeats = seatsInSlot;
  }
  return maxSeats;
}

export function computeDayAvailability(
  day: Date,
  today: Date,
  currentMonth: Date,
  reservations: ReservationSlot[],
  blocages: BlocageSlot[],
  isOpenSpace: boolean,
  spaceCapacity: number,
): DayAvailability {
  const isSameMonth =
    day.getFullYear() === currentMonth.getFullYear() &&
    day.getMonth() === currentMonth.getMonth();

  if (!isSameMonth) {
    return { date: day, totalSlots: 0, freeSlots: 0, status: "closed" };
  }

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  if (dayStart < todayStart) {
    return { date: day, totalSlots: 0, freeSlots: 0, status: "past" };
  }

  if (isClosedDay(day)) {
    return { date: day, totalSlots: 0, freeSlots: 0, status: "closed" };
  }

  const dayStr = format(day, "yyyy-MM-dd");
  const dayOpenStart = new Date(`${dayStr}T${String(OPENING_HOUR).padStart(2, "0")}:${String(OPENING_MINUTE).padStart(2, "0")}:00`);
  const dayOpenEnd = new Date(`${dayStr}T${String(CLOSING_HOUR).padStart(2, "0")}:${String(CLOSING_MINUTE).padStart(2, "0")}:00`);

  const isBlocked = blocages.some((b) => {
    const bStart = new Date(b.date_debut);
    const bEnd = new Date(b.date_fin);
    return bStart <= dayOpenStart && bEnd >= dayOpenEnd;
  });

  if (isBlocked) {
    return { date: day, totalSlots: TOTAL_SLOTS, freeSlots: 0, status: "blocked" };
  }

  if (isOpenSpace) {
    const reservedSeats = computeReservedSeatsForDay(day, reservations);
    const freeSeats = spaceCapacity - reservedSeats;
    if (freeSeats <= 0) {
      return { date: day, totalSlots: TOTAL_SLOTS, freeSlots: 0, status: "full", reservedSeats, totalCapacity: spaceCapacity };
    }
    if (reservedSeats > 0) {
      return { date: day, totalSlots: TOTAL_SLOTS, freeSlots: TOTAL_SLOTS, status: "partial", reservedSeats, totalCapacity: spaceCapacity };
    }
    return { date: day, totalSlots: TOTAL_SLOTS, freeSlots: TOTAL_SLOTS, status: "available", reservedSeats: 0, totalCapacity: spaceCapacity };
  }

  const slots = buildSlotTimes(dayStr);
  let occupiedSlots = 0;
  for (const slot of slots) {
    const isOccupied =
      reservations.some((r) => {
        const rStart = new Date(r.date_debut);
        const rEnd = new Date(r.date_fin);
        return rStart < slot.end && rEnd > slot.start;
      }) ||
      blocages.some((b) => {
        const bStart = new Date(b.date_debut);
        const bEnd = new Date(b.date_fin);
        return bStart < slot.end && bEnd > slot.start;
      });
    if (isOccupied) occupiedSlots++;
  }

  const freeSlots = TOTAL_SLOTS - occupiedSlots;
  if (freeSlots === 0) return { date: day, totalSlots: TOTAL_SLOTS, freeSlots: 0, status: "full" };
  if (freeSlots < TOTAL_SLOTS) return { date: day, totalSlots: TOTAL_SLOTS, freeSlots, status: "partial" };
  return { date: day, totalSlots: TOTAL_SLOTS, freeSlots, status: "available" };
}

interface RawItem {
  espace_id?: string;
  espaceId?: string;
  date_debut?: string;
  dateDebut?: string;
  date_fin?: string;
  dateFin?: string;
  statut?: string;
  participants?: number;
}

export function extractReservations(responseData: unknown, espaceId: string): ReservationSlot[] {
  let items: RawItem[] = [];
  if (Array.isArray(responseData)) {
    items = responseData as RawItem[];
  } else if (responseData && typeof responseData === "object") {
    const obj = responseData as Record<string, unknown>;
    if (Array.isArray(obj.reservations)) items = obj.reservations as RawItem[];
    else if (Array.isArray(obj.data)) items = obj.data as RawItem[];
  }
  return items
    .filter((r) => {
      const rid = String(r.espace_id || r.espaceId || "");
      return rid === "" || rid === String(espaceId);
    })
    .filter((r) => r.statut !== "annulee")
    .map((r) => ({
      date_debut: r.date_debut || r.dateDebut || "",
      date_fin: r.date_fin || r.dateFin || "",
      statut: r.statut || "",
      participants: r.participants || 1,
    }))
    .filter((r) => r.date_debut && r.date_fin);
}

export function extractBlocages(responseData: unknown, espaceId: string): BlocageSlot[] {
  if (!responseData || typeof responseData !== "object" || Array.isArray(responseData)) return [];
  const obj = responseData as Record<string, unknown>;
  if (!Array.isArray(obj.blocages)) return [];
  return (obj.blocages as Array<Record<string, unknown>>)
    .filter((b) => {
      const bid = (b.espace_id || b.espaceId || "") as string;
      return bid === "" || bid === espaceId;
    })
    .map((b) => ({
      date_debut: (b.date_debut || b.dateDebut || "") as string,
      date_fin: (b.date_fin || b.dateFin || "") as string,
    }))
    .filter((b) => b.date_debut && b.date_fin);
}

export async function fetchMonthAvailability(
  espaceId: string,
  monthStart: string,
  monthEnd: string,
): Promise<MonthAvailabilityData> {
  const response = await apiClient.request(
    `/reservations/index.php?espace_id=${espaceId}&date_debut=${monthStart}&date_fin=${monthEnd}&include_blocages=true`,
  );
  if (response.success && response.data) {
    return {
      reservations: extractReservations(response.data, espaceId),
      blocages: extractBlocages(response.data, espaceId),
    };
  }
  return { reservations: [], blocages: [] };
}
