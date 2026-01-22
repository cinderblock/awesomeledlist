import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
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
import { ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import type { BaseEntry } from "@/lib/data";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends BaseEntry> {
  data: T[];
  columns: Column<T>[];
  categoryPath: string;
  searchKeys?: (keyof T)[];
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends BaseEntry>({
  data,
  columns,
  categoryPath,
  searchKeys = ["name"] as (keyof T)[],
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

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
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") {
        setSortKey(null);
        setSortDir(null);
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

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
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-muted-foreground text-sm">
          {sortedData.length} of {data.length} entries
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={String(col.key)} className={col.className}>
                  {col.sortable !== false ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort(String(col.key))}
                    >
                      {col.label}
                      {sortKey === String(col.key) && sortDir === "asc" && (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      )}
                      {sortKey === String(col.key) && sortDir === "desc" && (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
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
