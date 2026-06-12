import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageCell } from "@/components/ui/image-cell";
import { X, Filter, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BaseEntry } from "@/lib/data";
import { getImageUrl } from "@/lib/data";
import { exportToCSV, generateCSVFilename } from "@/lib/csv-export";
import type { Column } from "@/components/data";
import {
  analyzeColumn,
  applyColumnFilters,
  parseColumnFiltersFromURL,
  serializeColumnFiltersToURL,
  parseRangeFiltersFromURL,
  serializeRangeFiltersToURL,
  type RangeFilterValue,
} from "@/components/data/ColumnFilter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface TileField<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, item: T) => React.ReactNode;
}

interface TileViewProps<T extends BaseEntry> {
  data: T[];
  fields: TileField<T>[];
  categoryPath: string;
  categoryId: string;
  categoryName?: string;
  searchKeys?: (keyof T)[];
  filterKeys?: string[]; // Keys to enable filtering on
}

// Range filter button component for TileView
interface RangeFilterButtonProps {
  filterKey: string;
  label: string;
  min: number;
  max: number;
  currentRange: RangeFilterValue | null;
  onRangeChange: (key: string, range: RangeFilterValue | null) => void;
}

function RangeFilterButton({
  filterKey,
  label,
  min: dataMin,
  max: dataMax,
  currentRange,
  onRangeChange,
}: RangeFilterButtonProps) {
  const [localMin, setLocalMin] = useState<string>(
    currentRange?.min != null ? String(currentRange.min) : ""
  );
  const [localMax, setLocalMax] = useState<string>(
    currentRange?.max != null ? String(currentRange.max) : ""
  );

  const isActive = currentRange && (currentRange.min !== null || currentRange.max !== null);

  const handleApply = useCallback(() => {
    const minVal = localMin.trim() !== "" ? parseFloat(localMin) : null;
    const maxVal = localMax.trim() !== "" ? parseFloat(localMax) : null;

    if (minVal === null && maxVal === null) {
      onRangeChange(filterKey, null);
    } else {
      onRangeChange(filterKey, { min: minVal, max: maxVal });
    }
  }, [filterKey, localMin, localMax, onRangeChange]);

  const handleClear = useCallback(() => {
    setLocalMin("");
    setLocalMax("");
    onRangeChange(filterKey, null);
  }, [filterKey, onRangeChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleApply();
      }
    },
    [handleApply]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={isActive ? "default" : "outline"} size="sm" className="h-8">
          <Filter className={`mr-1 h-3 w-3 ${isActive ? "fill-current" : ""}`} />
          {label}
          {isActive && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {currentRange?.min != null && currentRange?.max != null
                ? `${currentRange.min}-${currentRange.max}`
                : currentRange?.min != null
                  ? `≥${currentRange.min}`
                  : `≤${currentRange?.max}`}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              Range: {dataMin.toLocaleString()} - {dataMax.toLocaleString()}
            </span>
            {isActive && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-muted-foreground mb-1 block text-xs">Min</label>
              <Input
                type="number"
                placeholder={String(dataMin)}
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8"
              />
            </div>
            <div className="flex-1">
              <label className="text-muted-foreground mb-1 block text-xs">Max</label>
              <Input
                type="number"
                placeholder={String(dataMax)}
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8"
              />
            </div>
          </div>
          <Button size="sm" className="w-full" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TileView<T extends BaseEntry>({
  data,
  fields,
  categoryPath,
  categoryId,
  categoryName = "data",
  searchKeys = ["name"] as (keyof T)[],
  filterKeys,
}: TileViewProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("q") || "";

  // Local search state for immediate input response
  const [search, setSearchLocal] = useState(urlSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sync local state when URL changes externally (e.g., browser back)
  useEffect(() => {
    setSearchLocal(urlSearch);
  }, [urlSearch]);

  // Determine filter keys from fields if not provided
  const filterableKeys = useMemo(() => {
    if (filterKeys) return filterKeys;
    return fields.map((f) => String(f.key)).filter((k) => k !== "name");
  }, [filterKeys, fields]);

  // Analyze which columns have filters available
  const availableFilters = useMemo(() => {
    const result: { key: string; label: string; values: string[]; type: string; min?: number; max?: number }[] = [];
    for (const key of filterableKeys) {
      const analysis = analyzeColumn(data, key);
      if (analysis) {
        const field = fields.find((f) => String(f.key) === key);
        if (analysis.type === "range") {
          result.push({
            key,
            label: field?.label || key,
            values: [],
            type: "range",
            min: analysis.min,
            max: analysis.max,
          });
        } else if (analysis.values.length > 1) {
          result.push({
            key,
            label: field?.label || key,
            values: analysis.values,
            type: analysis.type,
          });
        }
      }
    }
    return result;
  }, [data, filterableKeys, fields]);

  // Parse column filters from URL
  const columnFilters = useMemo(
    () => parseColumnFiltersFromURL(searchParams, filterableKeys),
    [searchParams, filterableKeys]
  );

  // Parse range filters from URL
  const rangeFilters = useMemo(
    () => parseRangeFiltersFromURL(searchParams, filterableKeys),
    [searchParams, filterableKeys]
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

  const handleFilterChange = useCallback(
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
    const clearParams: Record<string, null> = { q: null };
    for (const key of filterableKeys) {
      clearParams[`f_${key}`] = null;
      clearParams[`r_${key}`] = null;
    }
    updateParams(clearParams);
  }, [filterableKeys, updateParams]);

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

  const hasActiveFilters = useMemo(() => {
    const hasColumnFilter = Object.values(columnFilters).some((v) => v && v.length > 0);
    const hasRangeFilter = Object.values(rangeFilters).some(
      (v) => v && (v.min !== null || v.max !== null)
    );
    return hasColumnFilter || hasRangeFilter;
  }, [columnFilters, rangeFilters]);

  const getValue = (item: T, key: string): unknown => {
    const parts = key.split(".");
    let value: unknown = item;
    for (const part of parts) {
      if (value == null) return null;
      value = (value as Record<string, unknown>)[part];
    }
    return value;
  };

  const hasFilters = search || hasActiveFilters;

  // Convert TileFields to Columns for CSV export
  const columnsForExport = useMemo((): Column<T>[] => {
    return [
      { key: "name", label: "Name" },
      ...fields.map((f) => ({
        key: f.key,
        label: f.label,
      })),
    ];
  }, [fields]);

  // Check if we should use the static CSV or generate one
  const hasActiveSearchOrFilters = search || hasActiveFilters;
  const staticCsvUrl = categoryId ? `/${categoryId}.csv` : null;

  const handleDownloadCSV = useCallback(() => {
    const filename = generateCSVFilename(categoryName, columnFilters, search);
    exportToCSV(filteredData, columnsForExport, filename);
  }, [filteredData, columnsForExport, categoryName, columnFilters, search]);

  // Build active filter descriptions for print summary
  const activeFilterDescriptions = useMemo(() => {
    const descriptions: string[] = [];
    if (search) {
      descriptions.push(`Search: "${search}"`);
    }
    for (const [key, values] of Object.entries(columnFilters)) {
      if (values && values.length > 0) {
        const field = fields.find((f) => String(f.key) === key);
        const label = field?.label || key;
        descriptions.push(`${label}: ${values.join(", ")}`);
      }
    }
    for (const [key, range] of Object.entries(rangeFilters)) {
      if (range && (range.min !== null || range.max !== null)) {
        const field = fields.find((f) => String(f.key) === key);
        const label = field?.label || key;
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
  }, [search, columnFilters, rangeFilters, fields]);

  return (
    <div className="space-y-4">
      {/* Print-only summary */}
      <div className="print-summary hidden print:block border-b pb-3 mb-4">
        <p className="text-sm">
          <strong>{filteredData.length}</strong> of <strong>{data.length}</strong> entries
          {activeFilterDescriptions.length > 0 && " • Filtered by: "}
          {activeFilterDescriptions.join(" • ")}
        </p>
      </div>

      {/* Screen-only controls */}
      <div className="no-print sticky top-[6rem] z-30 -mx-4 space-y-3 bg-[var(--category-bg-subtle)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <span className="text-muted-foreground text-sm">
            {filteredData.length} of {data.length} entries
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

        {/* Compact filter buttons */}
        {availableFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
          {availableFilters.map((filter) => {
            if (filter.type === "range") {
              // Range filter
              const currentRange = rangeFilters[filter.key];

              return (
                <RangeFilterButton
                  key={filter.key}
                  filterKey={filter.key}
                  label={filter.label}
                  min={filter.min ?? 0}
                  max={filter.max ?? 0}
                  currentRange={currentRange || null}
                  onRangeChange={handleRangeFilterChange}
                />
              );
            }

            // Regular multiselect/boolean filter
            const currentValues = columnFilters[filter.key] || [];
            const isActive = currentValues.length > 0;

            return (
              <DropdownMenu key={filter.key}>
                <DropdownMenuTrigger asChild>
                  <Button variant={isActive ? "default" : "outline"} size="sm" className="h-8">
                    <Filter className={`mr-1 h-3 w-3 ${isActive ? "fill-current" : ""}`} />
                    {filter.label}
                    {isActive && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {currentValues.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-80 w-56 overflow-y-auto">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-muted-foreground text-xs font-medium">
                      {isActive ? `${currentValues.length} selected` : "Filter"}
                    </span>
                    {isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleFilterChange(filter.key, null)}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {filter.values.map((value) => {
                    const isChecked = currentValues.includes(value);
                    return (
                      <DropdownMenuCheckboxItem
                        key={value}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          let newValues: string[];
                          if (checked) {
                            newValues = [...currentValues, value];
                          } else {
                            newValues = currentValues.filter((v) => v !== value);
                          }
                          handleFilterChange(filter.key, newValues.length > 0 ? newValues : null);
                        }}
                        className="text-sm"
                      >
                        {value}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
          </div>
        )}
      </div>

      {filteredData.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <p className="text-muted-foreground">No results found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredData.map((item) => {
            const imageFile = item.image || (item.images && item.images[0]);
            return (
              <Link key={item.id} to={`${categoryPath}/${item.id}`}>
                <Card className="hover:bg-muted/50 h-full overflow-hidden transition-colors">
                  {imageFile && (
                    <ImageCell
                      src={getImageUrl(categoryId, imageFile)}
                      alt={item.name}
                      className="aspect-video w-full"
                      fallbackClassName="aspect-video w-full"
                    />
                  )}
                  <CardHeader className={imageFile ? "pt-3 pb-2" : "pb-2"}>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    {typeof item.manufacturer === "string" && (
                      <p className="text-muted-foreground text-sm">{item.manufacturer}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <dl className="space-y-1 text-sm">
                      {fields.slice(0, 4).map((field) => {
                        const value = getValue(item, String(field.key));
                        if (value == null) return null;

                        return (
                          <div key={String(field.key)} className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">{field.label}</dt>
                            <dd className="text-right">
                              {field.render ? (
                                field.render(value, item)
                              ) : typeof value === "boolean" ? (
                                <Badge
                                  variant={value ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {value ? "Yes" : "No"}
                                </Badge>
                              ) : Array.isArray(value) ? (
                                <span>
                                  {value.slice(0, 2).join(", ")}
                                  {value.length > 2 ? "..." : ""}
                                </span>
                              ) : (
                                <span>{String(value)}</span>
                              )}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
