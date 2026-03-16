import React, { useState, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2, Users, RefreshCw, WifiOff } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useAvailability } from "../../hooks/useAvailability";
import { isClosedDay, type DayAvailability } from "../../services/availability.service";

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

const WEEKDAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

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
  const [direction, setDirection] = useState(0);
  const [rangeStartLocal, setRangeStartLocal] = useState<Date | null>(null);
  const prevEspaceId = useRef(espaceId);

  useEffect(() => {
    if (prevEspaceId.current !== espaceId) {
      prevEspaceId.current = espaceId;
      setRangeStartLocal(null);
      setCurrentMonth(startOfMonth(new Date()));
    }
  }, [espaceId]);

  const { dayAvailabilities, isLoading, hasError, isStale, refresh } = useAvailability({
    espaceId,
    currentMonth,
    isOpenSpace,
    spaceCapacity,
    enabled: !!espaceId,
  });

  const goToPreviousMonth = useCallback(() => {
    const prev = subMonths(currentMonth, 1);
    if (!isBefore(prev, startOfMonth(startOfDay(new Date())))) {
      setDirection(-1);
      setCurrentMonth(prev);
    }
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    const maxDate = addMonths(new Date(), 3);
    const next = addMonths(currentMonth, 1);
    if (isBefore(next, maxDate)) {
      setDirection(1);
      setCurrentMonth(next);
    }
  }, [currentMonth]);

  const handleDayClick = useCallback(
    (dayInfo: DayAvailability) => {
      if (dayInfo.status === "past" || dayInfo.status === "closed") return;
      if (!isSameMonth(dayInfo.date, currentMonth)) return;
      if (dayInfo.status === "full" && !isOpenSpace) return;

      if (selectionMode === "range") {
        if (!rangeStartLocal) {
          setRangeStartLocal(dayInfo.date);
          onDateSelect(dayInfo.date);
        } else {
          if (isSameDay(dayInfo.date, rangeStartLocal)) {
            setRangeStartLocal(null);
            return;
          }
          const start = isBefore(dayInfo.date, rangeStartLocal) ? dayInfo.date : rangeStartLocal;
          const end = isBefore(dayInfo.date, rangeStartLocal) ? rangeStartLocal : dayInfo.date;
          setRangeStartLocal(null);
          if (onRangeSelect) onRangeSelect(start, end);
        }
      } else {
        onDateSelect(dayInfo.date);
      }
    },
    [currentMonth, isOpenSpace, selectionMode, rangeStartLocal, onDateSelect, onRangeSelect],
  );

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

    if (
      isOpenSpace &&
      dayInfo.seatsTaken != null &&
      dayInfo.capacity != null &&
      dayInfo.status !== "past" &&
      dayInfo.status !== "closed"
    ) {
      const reserved = dayInfo.seatsTaken;
      const total = dayInfo.capacity;
      const color =
        reserved === 0
          ? "text-emerald-600"
          : reserved >= total
          ? "text-red-500"
          : reserved > total / 2
          ? "text-amber-600"
          : "text-emerald-600";
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

  const canGoPrev = !isBefore(subMonths(currentMonth, 1), startOfMonth(startOfDay(new Date())));
  const canGoNext = isBefore(addMonths(currentMonth, 1), addMonths(new Date(), 3));

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          disabled={!canGoPrev}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
            canGoPrev ? "hover:bg-gray-100 text-gray-700 hover:shadow-sm" : "text-gray-300 cursor-not-allowed"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center flex items-center gap-2">
          <h4 className="text-lg font-bold text-gray-900 capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </h4>
          {hasError ? (
            <span title="Erreur de chargement — données en cache">
              <WifiOff className="w-4 h-4 text-amber-500" />
            </span>
          ) : isStale && !isLoading ? (
            <button
              type="button"
              onClick={refresh}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Rafraîchir la disponibilité"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={goToNextMonth}
          disabled={!canGoNext}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
            canGoNext ? "hover:bg-gray-100 text-gray-700 hover:shadow-sm" : "text-gray-300 cursor-not-allowed"
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`text-center text-xs font-semibold py-2 ${i === 5 ? "text-red-400" : "text-gray-500"}`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="relative min-h-[240px]">
        {isLoading && (
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
                <motion.button
                  key={idx}
                  type="button"
                  onClick={() => handleDayClick(dayInfo)}
                  disabled={
                    !isCurrentMonth ||
                    dayInfo.status === "past" ||
                    dayInfo.status === "closed" ||
                    (dayInfo.status === "full" && !isOpenSpace)
                  }
                  layout
                  className={`aspect-square rounded-xl text-sm flex flex-col items-center justify-center ${getDayStyles(dayInfo)} ${isOpenSpace ? "pb-1" : ""}`}
                  title={
                    isOpenSpace
                      ? dayInfo.seatsTaken != null
                        ? `${dayInfo.seatsTaken} occupées / ${dayInfo.capacity} places disponibles`
                        : ""
                      : dayInfo.status === "available"
                      ? "Disponible"
                      : dayInfo.status === "partial"
                      ? "Partiellement disponible"
                      : dayInfo.status === "full"
                      ? "Complet"
                      : dayInfo.status === "closed"
                      ? "Fermé"
                      : ""
                  }
                >
                  <span>{isCurrentMonth ? format(dayInfo.date, "d") : ""}</span>
                  {getIndicator(dayInfo)}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {isOpenSpace ? (
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">Occupées / {spaceCapacity} places total</span>
            </div>
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
            <span className="text-xs text-gray-500">Fermé</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${hasError ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
          <span className="text-[10px] text-gray-400">{hasError ? "Mode hors-ligne" : "Temps réel"}</span>
        </div>
      </div>

      {selectionMode === "range" && (
        <div className="mt-2 text-center">
          {!rangeEnd && rangeStartLocal ? (
            <p className="text-xs text-gray-500">Cliquez sur une deuxième date pour définir la fin</p>
          ) : rangeEnd ? (
            <p className="text-xs text-emerald-600 font-medium">
              Du {format(selectedDate, "d MMM", { locale: fr })} au {format(rangeEnd, "d MMM", { locale: fr })}
            </p>
          ) : (
            <p className="text-xs text-gray-500">Cliquez sur la date de début</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
