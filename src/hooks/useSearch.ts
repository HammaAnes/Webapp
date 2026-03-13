import { useState, useMemo } from "react";

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export interface UseSearchOptions {
  searchKeys: string[];
  caseSensitive?: boolean;
}

export function useSearch<T>(items: T[], options: UseSearchOptions) {
  const { searchKeys, caseSensitive = false } = options;
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;

    const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

    return items.filter((item) =>
      searchKeys.some((key) => {
        const value = getNestedValue(item, key);
        const stringValue = String(value || "");
        const compareValue = caseSensitive
          ? stringValue
          : stringValue.toLowerCase();
        return compareValue.includes(term);
      })
    );
  }, [items, searchTerm, searchKeys, caseSensitive]);

  const reset = () => {
    setSearchTerm("");
  };

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
    reset,
    hasActiveSearch: searchTerm.trim().length > 0,
  };
}
