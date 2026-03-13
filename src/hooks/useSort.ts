import { useState, useMemo } from "react";

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export type SortDirection = "asc" | "desc";

export interface UseSortOptions {
  initialSortKey?: string;
  initialSortDirection?: SortDirection;
}

export function useSort<T>(items: T[], options: UseSortOptions = {}) {
  const { initialSortKey = null, initialSortDirection = "asc" } = options;
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);

  const sortedItems = useMemo(() => {
    if (!sortKey) return items;

    return [...items].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);

      if (aVal === bVal) return 0;

      const comparison = aVal! < bVal! ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [items, sortKey, sortDirection]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const reset = () => {
    setSortKey(initialSortKey);
    setSortDirection(initialSortDirection);
  };

  return {
    sortKey,
    sortDirection,
    sortedItems,
    toggleSort,
    reset,
    hasActiveSort: sortKey !== null,
  };
}
