import { useState, useMemo, useCallback } from "react";

export interface SortConfig<T extends string = string> {
  key: T;
  direction: "asc" | "desc";
}

export interface AdminTableState<TSort extends string = string> {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  page: number;
  setPage: (p: number) => void;
  sort: SortConfig<TSort>;
  setSort: (key: TSort) => void;
  resetFilters: () => void;
}

interface Options<TSort extends string = string> {
  defaultSort?: SortConfig<TSort>;
  defaultStatus?: string;
}

export function useAdminTable<TSort extends string = string>(
  options?: Options<TSort>
): AdminTableState<TSort> {
  const [search, setSearchRaw] = useState("");
  const [statusFilter, setStatusFilterRaw] = useState(options?.defaultStatus ?? "tous");
  const [page, setPageRaw] = useState(1);
  const [sort, setSortRaw] = useState<SortConfig<TSort>>(
    options?.defaultSort ?? ({ key: "date" as TSort, direction: "desc" })
  );

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v);
    setPageRaw(1);
  }, []);

  const setStatusFilter = useCallback((v: string) => {
    setStatusFilterRaw(v);
    setPageRaw(1);
  }, []);

  const setPage = useCallback((p: number) => setPageRaw(p), []);

  const setSort = useCallback((key: TSort) => {
    setSortRaw((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPageRaw(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchRaw("");
    setStatusFilterRaw(options?.defaultStatus ?? "tous");
    setPageRaw(1);
  }, [options?.defaultStatus]);

  return { search, setSearch, statusFilter, setStatusFilter, page, setPage, sort, setSort, resetFilters };
}

export function paginate<T>(items: T[], page: number, perPage: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    total,
    totalPages,
    page: safePage,
  };
}
