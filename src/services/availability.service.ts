import { getDay } from "date-fns";
import { apiClient } from "../lib/api-client";

export interface BlocageSlot {
  date_debut: string;
  date_fin: string;
}

export type DayStatus = "available" | "partial" | "full" | "closed" | "past" | "blocked";

export interface DayAvailability {
  date: Date;
  status: DayStatus;
  seatsTaken: number;
  seatsAvailable: number;
  capacity: number;
  totalSlots: number;
  freeSlots: number;
  reservedSeats?: number;
  totalCapacity?: number;
}

export interface MonthAvailabilityData {
  days: DayAvailability[];
  blocages: BlocageSlot[];
  isOpenSpace: boolean;
  capacity: number;
}

export function isClosedDay(date: Date): boolean {
  const day = getDay(date);
  return day === 5 || day === 6;
}

interface ApiDayData {
  date: string;
  status: string;
  seats_taken: number;
  seats_available: number;
  capacity: number;
}

interface ApiAvailabilityResponse {
  days?: ApiDayData[];
  blocages?: BlocageSlot[];
  is_open_space?: boolean;
  capacity?: number;
}

function mapApiDayToAvailability(d: ApiDayData): DayAvailability {
  return {
    date: new Date(d.date + "T12:00:00"),
    status: d.status as DayStatus,
    seatsTaken: d.seats_taken,
    seatsAvailable: d.seats_available,
    capacity: d.capacity,
    totalSlots: 20,
    freeSlots: d.seats_available,
    reservedSeats: d.seats_taken,
    totalCapacity: d.capacity,
  };
}

export async function fetchMonthAvailability(
  espaceId: string,
  monthStart: string,
  monthEnd: string,
): Promise<MonthAvailabilityData> {
  const response = await apiClient.request(
    `/reservations/availability.php?espace_id=${espaceId}&date_debut=${monthStart}&date_fin=${monthEnd}`,
  );

  if (response.success && response.data) {
    const data = response.data as ApiAvailabilityResponse;
    return {
      days: (data.days || []).map(mapApiDayToAvailability),
      blocages: data.blocages || [],
      isOpenSpace: data.is_open_space ?? false,
      capacity: data.capacity ?? 0,
    };
  }

  return { days: [], blocages: [], isOpenSpace: false, capacity: 0 };
}
