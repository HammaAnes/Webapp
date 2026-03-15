import { useEffect, useRef, useCallback, useMemo } from "react";
import { startOfDay, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { useAvailabilityStore } from "../store/availabilityStore";
import { computeDayAvailability, type DayAvailability } from "../services/availability.service";

const POLLING_INTERVAL_MS = 30_000;
const DEGRADED_POLLING_INTERVAL_MS = 30_000;

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
  const store = useAvailabilityStore();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const monthData = store.getMonthData(espaceId, currentMonth);
  const isLoading = monthData?.loading ?? false;
  const hasError = monthData?.error ?? false;
  const isStale = !monthData || (Date.now() - (monthData.fetchedAt ?? 0) > POLLING_INTERVAL_MS * 2);

  const doFetch = useCallback(
    (force = false) => {
      if (!espaceId || !enabled) return;
      store.fetchMonth(espaceId, currentMonth, force);
    },
    [espaceId, currentMonth, enabled, store],
  );

  const refresh = useCallback(() => doFetch(true), [doFetch]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !espaceId) return;
    doFetch(false);
  }, [espaceId, currentMonth, enabled, doFetch]);

  useEffect(() => {
    if (!enabled || !espaceId) return;

    const interval = hasError ? DEGRADED_POLLING_INTERVAL_MS : POLLING_INTERVAL_MS;

    pollingRef.current = setInterval(() => {
      if (isMountedRef.current) {
        doFetch(true);
      }
    }, interval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [espaceId, currentMonth, enabled, hasError, doFetch]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const dayAvailabilities = useMemo((): DayAvailability[] => {
    const today = startOfDay(new Date());
    const reservations = monthData?.reservations ?? [];
    const blocages = monthData?.blocages ?? [];

    return calendarDays.map((day) =>
      computeDayAvailability(day, today, currentMonth, reservations, blocages, isOpenSpace, spaceCapacity),
    );
  }, [calendarDays, currentMonth, monthData, isOpenSpace, spaceCapacity]);

  return {
    dayAvailabilities,
    calendarDays,
    isLoading,
    isStale,
    hasError,
    refresh,
  };
}
