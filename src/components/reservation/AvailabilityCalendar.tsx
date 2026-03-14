import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2, Users } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
  getDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "../../lib/api-client";
import { WORKING_HOURS } from "../../constants/algeria";

interface RawReservation {
  id?: string;
  espace_id?: string;
  espaceId?: string;
  date_debut: string;
  date_fin: string;
  dateDebut?: string;
  dateFin?: string;
  statut: string;
  participants?: number;
}

interface ReservationSlot {
  date_debut: string;
  date_fin: string;
  statut: string;
  participants: number;
}

interface BlocageSlot {
  date_debut: string;
  date_fin: string;
}

interface DayAvailability {
  date: Date;
  totalSlots: number;
  freeSlots: number;
  status: "available" | "partial" | "full" | "closed" | "past" | "blocked";
  reservedSeats?: number;
  totalCapacity?: number;
}

export interface AvailabilityCalendarProps {
  espaceId: string;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  selectionMode?: "single" | "range";
  rangeEnd?: Date | null;
  onRangeSelect?: (start: Date, end: Date) => void;
  isOpenSpace?: boolean;
  spaceCapacity?: number;
}

const OPENING_HOUR = WORKING_HOURS.OPENING_HOUR;
const OPENING_MINUTE = WORKING_HOURS.OPENING_MINUTE;
const CLOSING_HOUR = WORKING_HOURS.CLOSING_HOUR;
const CLOSING_MINUTE = WORKING_HOURS.CLOSING_MINUTE;
const SLOT_DURATION_MINUTES = 60;

const isClosedDay = (date: Date): boolean => {
  const day = getDay(date);
  return day === 5 || day === 6;
};

const WEEKDAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const normalizeReservation = (r: RawReservation): ReservationSlot => ({
  date_debut: r.date_debut || r.dateDebut || "",
  date_fin: r.date_fin || r.dateFin || "",
  statut: r.statut || "",
  participants: r.participants || 1,
});

const extractReservations = (responseData: unknown, espaceId: string): ReservationSlot[] => {
  let items: RawReservation[] = [];
  if (Array.isArray(responseData)) {
    items = responseData as RawReservation[];
  } else if (responseData && typeof responseData === "object") {
    const obj = responseData as Record<string, unknown>;
    if (Array.isArray(obj.reservations)) {
      items = obj.reservations as RawReservation[];
    } else if (Array.isArray(obj.data)) {
      items = obj.data as RawReservation[];
    }
  }
  return items
    .filter((r) => {
      const rid = r.espace_id || r.espaceId || "";
      return rid === "" || rid === espaceId;
    })
    .filter((r) => r.statut !== "annulee")
    .map(normalizeReservation)
    .filter((r) => r.date_debut && r.date_fin);
};

const extractBlocages = (responseData: unknown, espaceId: string): BlocageSlot[] => {
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
};

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  espaceId,
  selectedDate,
  onDateSelect,
  selectionMode = "single",
  rangeEnd = null,
  onRangeSelect,
  isOpenSpace = false,
  spaceCapacity = 12,
}) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  const [reservations, setReservations] = useState<ReservationSlot[]>([]);
  const [blocages, setBlocages] = useState<BlocageSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(0);
  const prevEspaceId = useRef(espaceId);

  const [rangeStartLocal, setRangeStartLocal] = useState<Date | null>(null);

  useEffect(() => {
    if (prevEspaceId.current !== espaceId) {
      setReservations([]);
      setBlocages([]);
      prevEspaceId.current = espaceId;
    }
  }, [espaceId]);

  const loadAvailability = useCallback(async () => {
    if (!espaceId) return;
    setLoading(true);
    try {
      const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      const response = await apiClient.get(
        `/reservations/index.php?espace_id=${espaceId}&date_debut=${monthStart}&date_fin=${monthEnd}&include_blocages=true`
      );
      if (response.success && response.data) {
        setReservations(extractReservations(response.data, espaceId));
        setBlocages(extractBlocages(response.data, espaceId));
      } else {
        setReservations([]);
        setBlocages([]);
      }
    } catch {
      setReservations([]);
      setBlocages([]);
    } finally {
      setLoading(false);
    }
  }, [espaceId, currentMonth]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const getReservedSeatsForDay = useCallback((day: Date): number => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayStart = new Date(`${dayStr}T${String(OPENING_HOUR).padStart(2, "0")}:${String(OPENING_MINUTE).padStart(2, "0")}:00`);
    const dayEnd = new Date(`${dayStr}T${String(CLOSING_HOUR).padStart(2, "0")}:${String(CLOSING_MINUTE).padStart(2, "0")}:00`);

    let maxSeats = 0;
    const totalMinutes = (CLOSING_HOUR * 60 + CLOSING_MINUTE) - (OPENING_HOUR * 60 + OPENING_MINUTE);
    const totalSlots = Math.floor(totalMinutes / SLOT_DURATION_MINUTES);

    for (let i = 0; i < totalSlots; i++) {
      const slotStartMin = (OPENING_HOUR * 60 + OPENING_MINUTE) + i * SLOT_DURATION_MINUTES;
      const slotEndMin = slotStartMin + SLOT_DURATION_MINUTES;
      const slotStartH = Math.floor(slotStartMin / 60);
      const slotStartM = slotStartMin % 60;
      const slotEndH = Math.floor(slotEndMin / 60);
      const slotEndM = slotEndMin % 60;

      const slotStart = new Date(`${dayStr}T${String(slotStartH).padStart(2, "0")}:${String(slotStartM).padStart(2, "0")}:00`);
      const slotEnd = new Date(`${dayStr}T${String(slotEndH).padStart(2, "0")}:${String(slotEndM).padStart(2, "0")}:00`);

      let seatsInSlot = 0;
      reservations.forEach((r) => {
        const rStart = new Date(r.date_debut);
        const rEnd = new Date(r.date_fin);
        if (rStart < slotEnd && rEnd > slotStart) {
          seatsInSlot += r.participants;
        }
      });
      if (seatsInSlot > maxSeats) maxSeats = seatsInSlot;
    }

    return maxSeats;
  }, [reservations]);

  const dayAvailabilities = useMemo((): DayAvailability[] => {
    const today = startOfDay(new Date());

    return calendarDays.map((day) => {
      if (!isSameMonth(day, currentMonth)) {
        return { date: day, totalSlots: 0, freeSlots: 0, status: "closed" };
      }
      if (isBefore(day, today)) {
        return { date: day, totalSlots: 0, freeSlots: 0, status: "past" };
      }
      if (isClosedDay(day)) {
        return { date: day, totalSlots: 0, freeSlots: 0, status: "closed" };
      }

      const dayStr = format(day, "yyyy-MM-dd");
      const totalMinutes = (CLOSING_HOUR * 60 + CLOSING_MINUTE) - (OPENING_HOUR * 60 + OPENING_MINUTE);
      const totalSlots = Math.floor(totalMinutes / SLOT_DURATION_MINUTES);

      const isBlocked = blocages.some((b) => {
        const bStart = new Date(b.date_debut);
        const bEnd = new Date(b.date_fin);
        const dayStart = new Date(`${dayStr}T${String(OPENING_HOUR).padStart(2, "0")}:${String(OPENING_MINUTE).padStart(2, "0")}:00`);
        const dayEnd = new Date(`${dayStr}T${String(CLOSING_HOUR).padStart(2, "0")}:${String(CLOSING_MINUTE).padStart(2, "0")}:00`);
        return bStart <= dayStart && bEnd >= dayEnd;
      });

      if (isBlocked) {
        return { date: day, totalSlots, freeSlots: 0, status: "blocked" };
      }

      if (isOpenSpace) {
        const reservedSeats = getReservedSeatsForDay(day);
        const freeSeats = spaceCapacity - reservedSeats;
        if (freeSeats <= 0) {
          return { date: day, totalSlots, freeSlots: 0, status: "full", reservedSeats, totalCapacity: spaceCapacity };
        }
        if (reservedSeats > 0) {
          return { date: day, totalSlots, freeSlots: totalSlots, status: "partial", reservedSeats, totalCapacity: spaceCapacity };
        }
        return { date: day, totalSlots, freeSlots: totalSlots, status: "available", reservedSeats: 0, totalCapacity: spaceCapacity };
      }

      let occupiedSlots = 0;
      for (let i = 0; i < totalSlots; i++) {
        const slotStartMin = (OPENING_HOUR * 60 + OPENING_MINUTE) + i * SLOT_DURATION_MINUTES;
        const slotEndMin = slotStartMin + SLOT_DURATION_MINUTES;
        const slotStartH = Math.floor(slotStartMin / 60);
        const slotStartM = slotStartMin % 60;
        const slotEndH = Math.floor(slotEndMin / 60);
        const slotEndM = slotEndMin % 60;

        const slotStart = new Date(`${dayStr}T${String(slotStartH).padStart(2, "0")}:${String(slotStartM).padStart(2, "0")}:00`);
        const slotEnd = new Date(`${dayStr}T${String(slotEndH).padStart(2, "0")}:${String(slotEndM).padStart(2, "0")}:00`);

        const isOccupied = reservations.some((r) => {
          const rStart = new Date(r.date_debut);
          const rEnd = new Date(r.date_fin);
          return rStart < slotEnd && rEnd > slotStart;
        }) || blocages.some((b) => {
          const bStart = new Date(b.date_debut);
          const bEnd = new Date(b.date_fin);
          return bStart < slotEnd && bEnd > slotStart;
        });

        if (isOccupied) occupiedSlots++;
      }

      const freeSlots = totalSlots - occupiedSlots;
      if (freeSlots === 0) {
        return { date: day, totalSlots, freeSlots: 0, status: "full" };
      }
      if (freeSlots < totalSlots) {
        return { date: day, totalSlots, freeSlots, status: "partial" };
      }
      return { date: day, totalSlots, freeSlots, status: "available" };
    });
  }, [calendarDays, currentMonth, reservations, blocages, isOpenSpace, spaceCapacity, getReservedSeatsForDay]);

  const goToPreviousMonth = () => {
    const prev = subMonths(currentMonth, 1);
    if (!isBefore(endOfMonth(prev), startOfDay(new Date()))) {
      setDirection(-1);
      setCurrentMonth(prev);
    }
  };

  const goToNextMonth = () => {
    const maxDate = addMonths(new Date(), 3);
    const next = addMonths(currentMonth, 1);
    if (isBefore(next, maxDate)) {
      setDirection(1);
      setCurrentMonth(next);
    }
  };

  const handleDayClick = (dayInfo: DayAvailability) => {
    if (dayInfo.status === "past" || dayInfo.status === "closed" || dayInfo.status === "blocked") return;
    if (!isSameMonth(dayInfo.date, currentMonth)) return;
    if (dayInfo.status === "full" && !isOpenSpace) return;

    if (selectionMode === "range") {
      if (!rangeStartLocal || (rangeStartLocal && rangeEnd)) {
        setRangeStartLocal(dayInfo.date);
        onDateSelect(dayInfo.date);
      } else {
        const start = isBefore(dayInfo.date, rangeStartLocal) ? dayInfo.date : rangeStartLocal;
        const end = isAfter(dayInfo.date, rangeStartLocal) ? dayInfo.date : rangeStartLocal;
        if (isSameDay(start, end)) {
          onDateSelect(dayInfo.date);
          return;
        }
        setRangeStartLocal(null);
        if (onRangeSelect) {
          onRangeSelect(start, end);
        }
      }
    } else {
      onDateSelect(dayInfo.date);
    }
  };

  const isInRange = (date: Date): boolean => {
    if (selectionMode !== "range") return false;
    const start = selectedDate;
    const end = rangeEnd;
    if (!start || !end) return false;
    return (isAfter(date, start) && isBefore(date, end)) || isSameDay(date, start) || isSameDay(date, end);
  };

  const isRangeStart = (date: Date): boolean => {
    if (selectionMode !== "range" || !rangeEnd) return false;
    return isSameDay(date, selectedDate);
  };

  const isRangeEnd = (date: Date): boolean => {
    if (selectionMode !== "range" || !rangeEnd) return false;
    return isSameDay(date, rangeEnd);
  };

  const getDayStyles = (dayInfo: DayAvailability): string => {
    const isSelected = isSameDay(dayInfo.date, selectedDate);
    const isCurrentMonth = isSameMonth(dayInfo.date, currentMonth);
    const isToday = isSameDay(dayInfo.date, new Date());
    const inRange = isInRange(dayInfo.date);
    const rStart = isRangeStart(dayInfo.date);
    const rEnd = isRangeEnd(dayInfo.date);

    if (!isCurrentMonth) return "text-gray-200 cursor-default";

    const base = "relative transition-all duration-200";

    if (rStart || rEnd) {
      return `${base} bg-gray-900 text-white font-bold shadow-lg scale-105 z-10`;
    }

    if (isSelected && selectionMode === "single") {
      return `${base} bg-gray-900 text-white font-bold ring-2 ring-gray-900 ring-offset-2 shadow-lg scale-105`;
    }

    if (inRange && !isClosedDay(dayInfo.date)) {
      return `${base} bg-gray-200 text-gray-900 font-medium`;
    }

    switch (dayInfo.status) {
      case "available":
        return `${base} bg-emerald-50 text-emerald-900 hover:bg-emerald-100 hover:shadow-md cursor-pointer font-medium ${isToday ? "ring-2 ring-emerald-400" : ""}`;
      case "partial":
        return `${base} bg-amber-50 text-amber-900 hover:bg-amber-100 hover:shadow-md cursor-pointer font-medium ${isToday ? "ring-2 ring-amber-400" : ""}`;
      case "full":
        return `${base} bg-red-50 text-red-400 cursor-not-allowed ${isToday ? "ring-2 ring-red-300" : ""}`;
      case "blocked":
        return `${base} bg-gray-100 text-gray-300 cursor-not-allowed line-through`;
      case "closed":
        return `${base} bg-gray-50 text-gray-300 cursor-default`;
      case "past":
        return `${base} text-gray-300 cursor-default`;
      default:
        return `${base} text-gray-400 cursor-default`;
    }
  };

  const getIndicator = (dayInfo: DayAvailability): React.ReactNode => {
    if (!isSameMonth(dayInfo.date, currentMonth)) return null;
    if (isSameDay(dayInfo.date, selectedDate) && selectionMode === "single") return null;
    if (isRangeStart(dayInfo.date) || isRangeEnd(dayInfo.date)) return null;

    if (isOpenSpace && dayInfo.reservedSeats != null && dayInfo.totalCapacity != null && dayInfo.status !== "past" && dayInfo.status !== "closed" && dayInfo.status !== "blocked") {
      const reserved = dayInfo.reservedSeats;
      const total = dayInfo.totalCapacity;
      const color = reserved === 0 ? "text-emerald-600" : reserved >= total ? "text-red-500" : reserved > total / 2 ? "text-amber-600" : "text-emerald-600";
      return (
        <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold ${color} whitespace-nowrap`}>
          {reserved}/{total}
        </span>
      );
    }

    switch (dayInfo.status) {
      case "available":
        return <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />;
      case "partial":
        return <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />;
      case "full":
        return <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-400" />;
      default:
        return null;
    }
  };

  const canGoPrev = !isBefore(endOfMonth(subMonths(currentMonth, 1)), startOfDay(new Date()));
  const canGoNext = isBefore(addMonths(currentMonth, 1), addMonths(new Date(), 3));

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          disabled={!canGoPrev}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
            canGoPrev
              ? "hover:bg-gray-100 text-gray-700 hover:shadow-sm"
              : "text-gray-300 cursor-not-allowed"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h4 className="text-lg font-bold text-gray-900 capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </h4>
        </div>

        <button
          type="button"
          onClick={goToNextMonth}
          disabled={!canGoNext}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
            canGoNext
              ? "hover:bg-gray-100 text-gray-700 hover:shadow-sm"
              : "text-gray-300 cursor-not-allowed"
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`text-center text-xs font-semibold py-2 ${
              i === 5 ? "text-red-400" : "text-gray-500"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="relative min-h-[240px]">
        {loading && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${format(currentMonth, "yyyy-MM")}-${espaceId}`}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -30 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-7 gap-1"
          >
            {dayAvailabilities.map((dayInfo, idx) => {
              const isCurrentMonth = isSameMonth(dayInfo.date, currentMonth);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDayClick(dayInfo)}
                  disabled={
                    !isCurrentMonth ||
                    dayInfo.status === "past" ||
                    dayInfo.status === "closed" ||
                    dayInfo.status === "blocked" ||
                    (dayInfo.status === "full" && !isOpenSpace)
                  }
                  className={`aspect-square rounded-xl text-sm flex flex-col items-center justify-center ${getDayStyles(dayInfo)} ${isOpenSpace ? "pb-1" : ""}`}
                  title={
                    isOpenSpace && dayInfo.reservedSeats != null
                      ? `${dayInfo.reservedSeats}/${dayInfo.totalCapacity} places reservees`
                      : dayInfo.status === "available"
                      ? `${dayInfo.freeSlots} creneaux libres`
                      : dayInfo.status === "partial"
                      ? `${dayInfo.freeSlots}/${dayInfo.totalSlots} creneaux libres`
                      : dayInfo.status === "full"
                      ? "Complet"
                      : dayInfo.status === "closed"
                      ? "Ferme"
                      : dayInfo.status === "blocked"
                      ? "Indisponible"
                      : ""
                  }
                >
                  <span>{isCurrentMonth ? format(dayInfo.date, "d") : ""}</span>
                  {getIndicator(dayInfo)}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
        {isOpenSpace ? (
          <>
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">X/{spaceCapacity} = places reservees</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-500">Disponible</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-500">Partiel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-xs text-gray-500">Complet</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          <span className="text-xs text-gray-500">Ferme</span>
        </div>
      </div>

      {selectionMode === "range" && (
        <div className="mt-2 text-center">
          {!rangeEnd && rangeStartLocal ? (
            <p className="text-xs text-gray-500">Cliquez sur une deuxieme date pour definir la fin</p>
          ) : rangeEnd ? (
            <p className="text-xs text-emerald-600 font-medium">
              Du {format(selectedDate, "d MMM", { locale: fr })} au {format(rangeEnd, "d MMM", { locale: fr })}
            </p>
          ) : (
            <p className="text-xs text-gray-500">Cliquez sur la date de debut</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
