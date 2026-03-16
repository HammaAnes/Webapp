import { create } from "zustand";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  fetchMonthAvailability,
  type DayAvailability,
  type BlocageSlot,
} from "../services/availability.service";

interface MonthData {
  days: DayAvailability[];
  blocages: BlocageSlot[];
  isOpenSpace: boolean;
  capacity: number;
  fetchedAt: number;
  loading: boolean;
  error: boolean;
}

interface AvailabilityState {
  cache: Record<string, MonthData>;
  lastGlobalRefresh: number;

  getMonthData: (espaceId: string, month: Date) => MonthData | null;
  fetchMonth: (espaceId: string, month: Date, force?: boolean) => Promise<void>;
  invalidateSpace: (espaceId: string) => void;
  invalidateAll: () => void;
  touchGlobalRefresh: () => void;
  refreshAfterMutation: (espaceId: string, month: Date) => Promise<void>;
}

const CACHE_TTL_MS = 30_000;

function buildKey(espaceId: string, monthKey: string): string {
  return `${espaceId}::${monthKey}`;
}

function monthKeyOf(month: Date): string {
  return format(month, "yyyy-MM");
}

export const useAvailabilityStore = create<AvailabilityState>((set, get) => ({
  cache: {},
  lastGlobalRefresh: 0,

  getMonthData(espaceId, month) {
    const key = buildKey(espaceId, monthKeyOf(month));
    return get().cache[key] ?? null;
  },

  async fetchMonth(espaceId, month, force = false) {
    const key = buildKey(espaceId, monthKeyOf(month));
    const existing = get().cache[key];

    if (!force && existing && !existing.error && Date.now() - existing.fetchedAt < CACHE_TTL_MS) {
      return;
    }

    set((state) => ({
      cache: {
        ...state.cache,
        [key]: {
          days: existing?.days ?? [],
          blocages: existing?.blocages ?? [],
          isOpenSpace: existing?.isOpenSpace ?? false,
          capacity: existing?.capacity ?? 0,
          fetchedAt: existing?.fetchedAt ?? 0,
          loading: true,
          error: false,
        },
      },
    }));

    try {
      const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(month), "yyyy-MM-dd");
      const data = await fetchMonthAvailability(espaceId, monthStart, monthEnd);

      set((state) => ({
        cache: {
          ...state.cache,
          [key]: {
            days: data.days,
            blocages: data.blocages,
            isOpenSpace: data.isOpenSpace,
            capacity: data.capacity,
            fetchedAt: Date.now(),
            loading: false,
            error: false,
          },
        },
      }));
    } catch {
      set((state) => ({
        cache: {
          ...state.cache,
          [key]: {
            days: existing?.days ?? [],
            blocages: existing?.blocages ?? [],
            isOpenSpace: existing?.isOpenSpace ?? false,
            capacity: existing?.capacity ?? 0,
            fetchedAt: existing?.fetchedAt ?? 0,
            loading: false,
            error: true,
          },
        },
      }));
    }
  },

  invalidateSpace(espaceId) {
    set((state) => {
      const next: Record<string, MonthData> = {};
      for (const [k, v] of Object.entries(state.cache)) {
        if (!k.startsWith(`${espaceId}::`)) {
          next[k] = v;
        }
      }
      return { cache: next };
    });
  },

  invalidateAll() {
    set({ cache: {} });
  },

  touchGlobalRefresh() {
    set({ lastGlobalRefresh: Date.now() });
  },

  async refreshAfterMutation(espaceId, month) {
    get().invalidateSpace(espaceId);
    await get().fetchMonth(espaceId, month, true);
    set({ lastGlobalRefresh: Date.now() });
  },
}));

export type { MonthData };
