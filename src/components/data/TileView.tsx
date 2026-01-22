import { useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { BaseEntry } from "@/lib/data";

export interface TileField<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, item: T) => React.ReactNode;
}

interface TileViewProps<T extends BaseEntry> {
  data: T[];
  fields: TileField<T>[];
  categoryPath: string;
  searchKeys?: (keyof T)[];
}

export function TileView<T extends BaseEntry>({
  data,
  fields,
  categoryPath,
  searchKeys = ["name"] as (keyof T)[],
}: TileViewProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || "";

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

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;

    const searchLower = search.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [data, search, searchKeys]);

  const getValue = (item: T, key: string): unknown => {
    const parts = key.split(".");
    let value: unknown = item;
    for (const part of parts) {
      if (value == null) return null;
      value = (value as Record<string, unknown>)[part];
    }
    return value;
  };

  const clearFilters = () => {
    updateParams({ q: null });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-muted-foreground text-sm">
          {filteredData.length} of {data.length} entries
        </span>
        {search && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {filteredData.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <p className="text-muted-foreground">No results found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredData.map((item) => (
            <Link key={item.id} to={`${categoryPath}/${item.id}`}>
              <Card className="hover:bg-muted/50 h-full transition-colors">
                <CardHeader className="pb-2">
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
                              <Badge variant={value ? "default" : "secondary"} className="text-xs">
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
          ))}
        </div>
      )}
    </div>
  );
}
