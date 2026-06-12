import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, ExternalLink, X, Download } from "lucide-react";
import {
  ColumnFilter,
  analyzeColumn,
  applyColumnFilters,
  parseColumnFiltersFromURL,
  serializeColumnFiltersToURL,
  parseRangeFiltersFromURL,
  serializeRangeFiltersToURL,
  type RangeFilterValue,
} from "@/components/data/ColumnFilter";
import type { BaseEntry } from "@/lib/data";
import { exportToCSV, generateCSVFilename } from "@/lib/csv-export";

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
  categoryId?: string;
  categoryName?: string;
  searchKeys?: (keyof T)[];
}

type SortDirection = "asc" | "desc";

export function DataTable<T extends BaseEntry>({
  data,
  columns,
  categoryPath,
  categoryId,
  categoryName = "data",
  searchKeys = ["name"] as (keyof T)[],
}: DataTableProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get("q") || "";
  const sortKey = searchParams.get("sort") || null;
  const sortDir = (searchParams.get("dir") as SortDirection) || null;

  // Local search state for immediate input response
  const [search, setSearchLocal] = useState(urlSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sync local state when URL changes externally (e.g., browser back)
  useEffect(() => {
    setSearchLocal(urlSearch);
  }, [urlSearch]);

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

  // Parse range filters from URL
  const rangeFilters = useMemo(
    () => parseRangeFiltersFromURL(searchParams, filterableColumnKeys),
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
      // Update local state immediately for responsive input
      setSearchLocal(value);

      // Debounce URL update to prevent keystroke loss
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        updateParams({ q: value || null });
      }, 150);
    },
    [updateParams]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleColumnFilterChange = useCallback(
    (key: string, values: string[] | null) => {
      const newFilters = { ...columnFilters, [key]: values };
      updateParams(serializeColumnFiltersToURL(newFilters));
    },
    [columnFilters, updateParams]
  );

  const handleRangeFilterChange = useCallback(
    (key: string, range: RangeFilterValue | null) => {
      const newFilters = { ...rangeFilters, [key]: range };
      updateParams(serializeRangeFiltersToURL(newFilters));
    },
    [rangeFilters, updateParams]
  );

  const clearAllFilters = useCallback(() => {
    const clearParams: Record<string, null> = { q: null, sort: null, dir: null };
    // Clear all column filters and range filters
    for (const key of filterableColumnKeys) {
      clearParams[`f_${key}`] = null;
      clearParams[`r_${key}`] = null;
    }
    updateParams(clearParams);
  }, [filterableColumnKeys, updateParams]);

  // Apply column filters and range filters
  const columnFilteredData = useMemo(() => {
    return applyColumnFilters(data, columnFilters, rangeFilters);
  }, [data, columnFilters, rangeFilters]);

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
    const hasColumnFilter = Object.values(columnFilters).some((v) => v && v.length > 0);
    const hasRangeFilter = Object.values(rangeFilters).some(
      (v) => v && (v.min !== null || v.max !== null)
    );
    return hasColumnFilter || hasRangeFilter;
  }, [columnFilters, rangeFilters]);

  const hasFilters = search || sortKey || hasActiveFilters;

  // Check if we should use the static CSV or generate one
  const hasActiveSearchOrFilters = search || hasActiveFilters;
  const staticCsvUrl = categoryId ? `/${categoryId}.csv` : null;

  const handleDownloadCSV = useCallback(() => {
    const filename = generateCSVFilename(categoryName, columnFilters, search);
    exportToCSV(sortedData, columns, filename);
  }, [sortedData, columns, categoryName, columnFilters, search]);

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

  // Build active filter descriptions for print summary
  const activeFilterDescriptions = useMemo(() => {
    const descriptions: string[] = [];
    if (search) {
      descriptions.push(`Search: "${search}"`);
    }
    for (const [key, values] of Object.entries(columnFilters)) {
      if (values && values.length > 0) {
        const col = columns.find((c) => String(c.key) === key);
        const label = col?.label || key;
        descriptions.push(`${label}: ${values.join(", ")}`);
      }
    }
    for (const [key, range] of Object.entries(rangeFilters)) {
      if (range && (range.min !== null || range.max !== null)) {
        const col = columns.find((c) => String(c.key) === key);
        const label = col?.label || key;
        if (range.min !== null && range.max !== null) {
          descriptions.push(`${label}: ${range.min}–${range.max}`);
        } else if (range.min !== null) {
          descriptions.push(`${label}: ≥${range.min}`);
        } else {
          descriptions.push(`${label}: ≤${range.max}`);
        }
      }
    }
    return descriptions;
  }, [search, columnFilters, rangeFilters, columns]);

  return (
    <div className="space-y-4">
      {/* Print-only summary */}
      <div className="print-summary hidden print:block border-b pb-3 mb-4">
        <p className="text-sm">
          <strong>{sortedData.length}</strong> of <strong>{data.length}</strong> entries
          {activeFilterDescriptions.length > 0 && " • Filtered by: "}
          {activeFilterDescriptions.join(" • ")}
        </p>
      </div>

      {/* Screen-only controls */}
      <div className="no-print sticky top-[6rem] z-30 -mx-4 bg-[var(--category-bg-subtle)] px-4 py-3">
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
          {hasActiveSearchOrFilters ? (
            <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="h-8 px-2 select-none">
              <Download className="mr-1 h-4 w-4" />
              Download CSV
            </Button>
          ) : staticCsvUrl ? (
            <Button variant="outline" size="sm" asChild className="h-8 px-2 select-none">
              <a href={staticCsvUrl} download>
                <Download className="mr-1 h-4 w-4" />
                Download CSV
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="h-8 px-2 select-none">
              <Download className="mr-1 h-4 w-4" />
              Download CSV
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-background sticky top-[9.75rem] z-20 shadow-[0_0_0_1px_var(--color-border)] rounded-t-md">
              <tr className="border-b">
                {columns.map((col) => {
                  const colKey = String(col.key);
                  const showFilter =
                    col.filterable !== false &&
                    colKey !== "name" &&
                    colKey !== "links" &&
                    columnFilterAnalysis[colKey];

                  const isRightAligned = col.className?.includes("text-right");
                  return (
                    <TableHead key={colKey} className={col.className}>
                      <div
                        className={`flex items-center gap-1 ${isRightAligned ? "justify-end" : ""}`}
                      >
                        {col.sortable !== false ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={isRightAligned ? "-mr-3 h-8" : "-ml-3 h-8"}
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
                            currentRangeFilter={rangeFilters[colKey] || null}
                            onRangeFilterChange={handleRangeFilterChange}
                          />
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </tr>
            </thead>
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
          </table>
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
