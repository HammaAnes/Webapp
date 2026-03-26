import { useEffect, useCallback, useMemo } from "react";
import {
  startOfDay,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isBefore,
  isSameDay,
  format,
} from "date-fns";
import { useAvailabilityStore } from "../store/availabilityStore";
import { isClosedDay, type DayAvailability, type DayStatus } from "../services/availability.service";


interface UseAvailabilityOptions {
  espaceId: string;
  currentMonth: Date;
  isOpenSpace?: boolean;
  spaceCapacity?: number;
  enabled?: boolean;
}

interface UseAvailabilityResult {
  dayAvailabilities: DayAvailability[];
  calendarDays: Date[];
  isLoading: boolean;
  isStale: boolean;
  hasError: boolean;
  refresh: () => void;
}

export function useAvailability({
  espaceId,
  currentMonth,
  isOpenSpace = false,
  spaceCapacity = 12,
  enabled = true,
}: UseAvailabilityOptions): UseAvailabilityResult {
  // Use stable selectors to avoid re-renders on every cache update
  const fetchMonth = useAvailabilityStore((s) => s.fetchMonth);
  const getMonthData = useAvailabilityStore((s) => s.getMonthData);
  const lastGlobalRefresh = useAvailabilityStore((s) => s.lastGlobalRefresh);

  const monthData = getMonthData(espaceId, currentMonth);
  const isLoading = monthData?.loading ?? false;
  const hasError = monthData?.error ?? false;
  const isStale = !monthData || (lastGlobalRefresh > 0 && (monthData?.fetchedAt ?? 0) < lastGlobalRefresh);

  const doFetch = useCallback(
    (force = false) => {
      if (!espaceId || !enabled) return;
      fetchMonth(espaceId, currentMonth, force);
    },
    // fetchMonth is a stable Zustand action reference — safe to include
    [espaceId, currentMonth, enabled, fetchMonth],
  );

  const refresh = useCallback(() => doFetch(true), [doFetch]);

  useEffect(() => {
    if (!enabled || !espaceId) return;
    doFetch(false);
  }, [espaceId, currentMonth, enabled, doFetch]);

  useEffect(() => {
    if (lastGlobalRefresh > 0 && enabled && espaceId) {
      doFetch(true);
    }
  }, [lastGlobalRefresh, doFetch, enabled, espaceId]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const capacity = (monthData?.capacity && monthData.capacity > 0) ? monthData.capacity : spaceCapacity;

  const dayAvailabilities = useMemo((): DayAvailability[] => {
    const today = startOfDay(new Date());
    const apiDays = monthData?.days ?? [];
    const apiMap = new Map(apiDays.map((d) => [format(d.date, "yyyy-MM-dd"), d]));

    return calendarDays.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const isCurrentMonth = isSameMonth(date, currentMonth);
      const isPast = isBefore(startOfDay(date), today);
      const isToday = isSameDay(date, today);
      const isClosed = isClosedDay(date);

      if (!isCurrentMonth) {
        return {
          date,
          status: "closed" as DayStatus,
          seatsTaken: 0,
          seatsAvailable: 0,
          capacity,
          totalSlots: 0,
          freeSlots: 0,
          isCurrentMonth: false,
          isToday,
          isPast,
        };
      }

      if (isPast && !isToday) {
        return {
          date,
          status: "past" as DayStatus,
          seatsTaken: 0,
          seatsAvailable: 0,
          capacity,
          totalSlots: 0,
          freeSlots: 0,
        };
      }

      if (isClosed) {
        return {
          date,
          status: "closed" as DayStatus,
          seatsTaken: 0,
          seatsAvailable: 0,
          capacity,
          totalSlots: 0,
          freeSlots: 0,
        };
      }

      const apiDay = apiMap.get(dateStr);
      if (!apiDay) {
        return {
          date,
          status: "available" as DayStatus,
          seatsTaken: 0,
          seatsAvailable: capacity,
          capacity,
          totalSlots: 20,
          freeSlots: capacity,
          reservedSeats: 0,
          totalCapacity: capacity,
        };
      }

      return {
        ...apiDay,
        date,
      };
    });
  }, [calendarDays, currentMonth, monthData, capacity]);

  return {
    dayAvailabilities,
    calendarDays,
    isLoading,
    isStale,
    hasError,
    refresh,
  };
}
