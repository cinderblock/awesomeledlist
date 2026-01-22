import { useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, ExternalLink, X } from "lucide-react";
import {
  ColumnFilter,
  analyzeColumn,
  applyColumnFilters,
  parseColumnFiltersFromURL,
  serializeColumnFiltersToURL,
} from "@/components/data/ColumnFilter";
import type { BaseEntry } from "@/lib/data";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean; // Set to false to disable filter for this column
  render?: (value: unknown, item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends BaseEntry> {
  data: T[];
  columns: Column<T>[];
  categoryPath: string;
  searchKeys?: (keyof T)[];
}

type SortDirection = "asc" | "desc";

export function DataTable<T extends BaseEntry>({
  data,
  columns,
  categoryPath,
  searchKeys = ["name"] as (keyof T)[],
}: DataTableProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") || "";
  const sortKey = searchParams.get("sort") || null;
  const sortDir = (searchParams.get("dir") as SortDirection) || null;

  // Get filterable column keys (exclude links, name, and explicitly non-filterable columns)
  const filterableColumnKeys = useMemo(() => {
    return columns
      .filter((col) => {
        if (col.filterable === false) return false;
        if (col.key === "name" || col.key === "links") return false;
        return true;
      })
      .map((col) => String(col.key));
  }, [columns]);

  // Parse column filters from URL
  const columnFilters = useMemo(
    () => parseColumnFiltersFromURL(searchParams, filterableColumnKeys),
    [searchParams, filterableColumnKeys]
  );

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === "") {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const setSearch = useCallback(
    (value: string) => {
      updateParams({ q: value || null });
    },
    [updateParams]
  );

  const handleColumnFilterChange = useCallback(
    (key: string, values: string[] | null) => {
      const newFilters = { ...columnFilters, [key]: values };
      updateParams(serializeColumnFiltersToURL(newFilters));
    },
    [columnFilters, updateParams]
  );

  const clearAllFilters = useCallback(() => {
    const clearParams: Record<string, null> = { q: null, sort: null, dir: null };
    // Clear all column filters
    for (const key of filterableColumnKeys) {
      clearParams[`f_${key}`] = null;
    }
    updateParams(clearParams);
  }, [filterableColumnKeys, updateParams]);

  // Apply column filters first
  const columnFilteredData = useMemo(() => {
    return applyColumnFilters(data, columnFilters);
  }, [data, columnFilters]);

  // Then apply text search
  const filteredData = useMemo(() => {
    if (!search.trim()) return columnFilteredData;

    const searchLower = search.toLowerCase();
    return columnFilteredData.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [columnFilteredData, search, searchKeys]);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey as keyof T];
      const bVal = b[sortKey as keyof T];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDir === "asc" ? 1 : -1;
      if (bVal == null) return sortDir === "asc" ? -1 : 1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const cmp = aStr.localeCompare(bStr);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") {
        updateParams({ dir: "desc" });
      } else {
        updateParams({ sort: null, dir: null });
      }
    } else {
      updateParams({ sort: key, dir: "asc" });
    }
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(columnFilters).some((v) => v && v.length > 0);
  }, [columnFilters]);

  const hasFilters = search || sortKey || hasActiveFilters;

  // Pre-compute which columns should show filters
  const columnFilterAnalysis = useMemo(() => {
    const analysis: Record<string, boolean> = {};
    for (const key of filterableColumnKeys) {
      const result = analyzeColumn(data, key);
      analysis[key] = result !== null;
    }
    return analysis;
  }, [data, filterableColumnKeys]);

  const getValue = (item: T, key: string): unknown => {
    const parts = key.split(".");
    let value: unknown = item;
    for (const part of parts) {
      if (value == null) return null;
      value = (value as Record<string, unknown>)[part];
    }
    return value;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-muted-foreground text-sm">
          {sortedData.length} of {data.length} entries
        </span>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8 px-2">
            <X className="mr-1 h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => {
                const colKey = String(col.key);
                const showFilter =
                  col.filterable !== false &&
                  colKey !== "name" &&
                  colKey !== "links" &&
                  columnFilterAnalysis[colKey];

                return (
                  <TableHead key={colKey} className={col.className}>
                    <div className="flex items-center gap-1">
                      {col.sortable !== false ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8"
                          onClick={() => handleSort(colKey)}
                        >
                          {col.label}
                          {sortKey === colKey && sortDir === "asc" && (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          )}
                          {sortKey === colKey && sortDir === "desc" && (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </Button>
                      ) : (
                        <span>{col.label}</span>
                      )}
                      {showFilter && (
                        <ColumnFilter
                          columnKey={colKey}
                          data={data}
                          currentFilter={columnFilters[colKey] || null}
                          onFilterChange={handleColumnFilterChange}
                        />
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((col) => {
                    const value = getValue(item, String(col.key));
                    return (
                      <TableCell key={String(col.key)} className={col.className}>
                        {col.render ? (
                          col.render(value, item)
                        ) : col.key === "name" ? (
                          <Link
                            to={`${categoryPath}/${item.id}`}
                            className="text-primary font-medium hover:underline"
                          >
                            {String(value ?? "")}
                          </Link>
                        ) : (
                          <CellValue value={value} />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CellValue({ value }: { value: unknown }) {
  if (value == null) {
    return <span className="text-muted-foreground">-</span>;
  }

  if (typeof value === "boolean") {
    return value ? <Badge variant="default">Yes</Badge> : <Badge variant="secondary">No</Badge>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v, i) => (
          <Badge key={i} variant="outline">
            {String(v)}
          </Badge>
        ))}
      </div>
    );
  }

  if (typeof value === "string" && value.startsWith("http")) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary inline-flex items-center gap-1 hover:underline"
      >
        Link
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return <span>{String(value)}</span>;
}
