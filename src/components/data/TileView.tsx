import { useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageCell } from "@/components/ui/image-cell";
import { X, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BaseEntry } from "@/lib/data";
import { getImageUrl } from "@/lib/data";
import {
  analyzeColumn,
  applyColumnFilters,
  parseColumnFiltersFromURL,
  serializeColumnFiltersToURL,
} from "@/components/data/ColumnFilter";

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
  searchKeys?: (keyof T)[];
  filterKeys?: string[]; // Keys to enable filtering on
}

export function TileView<T extends BaseEntry>({
  data,
  fields,
  categoryPath,
  categoryId,
  searchKeys = ["name"] as (keyof T)[],
  filterKeys,
}: TileViewProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || "";

  // Determine filter keys from fields if not provided
  const filterableKeys = useMemo(() => {
    if (filterKeys) return filterKeys;
    return fields.map((f) => String(f.key)).filter((k) => k !== "name");
  }, [filterKeys, fields]);

  // Analyze which columns have filters available
  const availableFilters = useMemo(() => {
    const result: { key: string; label: string; values: string[] }[] = [];
    for (const key of filterableKeys) {
      const analysis = analyzeColumn(data, key);
      if (analysis && analysis.values.length > 1) {
        const field = fields.find((f) => String(f.key) === key);
        result.push({
          key,
          label: field?.label || key,
          values: analysis.values,
        });
      }
    }
    return result;
  }, [data, filterableKeys, fields]);

  // Parse column filters from URL
  const columnFilters = useMemo(
    () => parseColumnFiltersFromURL(searchParams, filterableKeys),
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
      updateParams({ q: value || null });
    },
    [updateParams]
  );

  const handleFilterChange = useCallback(
    (key: string, values: string[] | null) => {
      const newFilters = { ...columnFilters, [key]: values };
      updateParams(serializeColumnFiltersToURL(newFilters));
    },
    [columnFilters, updateParams]
  );

  const clearAllFilters = useCallback(() => {
    const clearParams: Record<string, null> = { q: null };
    for (const key of filterableKeys) {
      clearParams[`f_${key}`] = null;
    }
    updateParams(clearParams);
  }, [filterableKeys, updateParams]);

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

  const hasActiveFilters = useMemo(() => {
    return Object.values(columnFilters).some((v) => v && v.length > 0);
  }, [columnFilters]);

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
          {filteredData.length} of {data.length} entries
        </span>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8 px-2">
            <X className="mr-1 h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>

      {/* Compact filter buttons */}
      {availableFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableFilters.map((filter) => {
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
