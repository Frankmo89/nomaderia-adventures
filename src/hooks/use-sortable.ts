import { useState, useCallback } from "react";

export type SortDir = "asc" | "desc" | null;

export interface SortState<K extends string = string> {
  sortKey: K | null;
  sortDir: SortDir;
}

export function useSortable<K extends string>() {
  const [sortState, setSortState] = useState<SortState<K>>({
    sortKey: null,
    sortDir: null,
  });

  // Accepts string so SortableHeader (which is generic-free) can call it directly.
  const handleSort = useCallback((key: string) => {
    const k = key as K;
    setSortState((prev) => {
      if (prev.sortKey !== k) return { sortKey: k, sortDir: "asc" };
      if (prev.sortDir === "asc") return { sortKey: k, sortDir: "desc" };
      return { sortKey: null, sortDir: null };
    });
  }, []);

  return { sortState, handleSort };
}

/**
 * Sorts items by the active sort key returned by useSortable.
 * Strings are compared case-insensitively via localeCompare; ISO date strings
 * and numbers use the same comparator and sort correctly.
 * Returns the original array reference when no sort is active.
 */
export function applySortable<I, K extends string>(
  items: I[],
  sortState: SortState<K>,
  getValue: (item: I, key: K) => string | number | null | undefined
): I[] {
  const { sortKey, sortDir } = sortState;
  if (!sortKey || !sortDir) return items;
  return [...items].sort((a, b) => {
    const av = getValue(a, sortKey);
    const bv = getValue(b, sortKey);
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp =
      typeof av === "string" && typeof bv === "string"
        ? av.toLowerCase().localeCompare(bv.toLowerCase())
        : (av as number) - (bv as number);
    return sortDir === "asc" ? cmp : -cmp;
  });
}
