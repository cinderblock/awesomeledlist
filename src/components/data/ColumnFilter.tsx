/**
 * Column-based filter component that appears in table headers
 * Automatically detects filter type and unique values from data
 */

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";
import type { BaseEntry } from "@/lib/data";

export type ColumnFilterType = "boolean" | "select" | "multiselect";

export interface ColumnFilterValue {
  type: ColumnFilterType;
  values: string[];
}

interface ColumnFilterProps {
  columnKey: string;
  data: BaseEntry[];
  currentFilter: string[] | null;
  onFilterChange: (key: string, values: string[] | null) => void;
}

// Parse a value with units into a numeric value for sorting
// Handles: kHz, MHz, Hz, A, mA, V, mm, etc.
function parseValueWithUnit(str: string): { value: number; unit: string } | null {
  // Match patterns like "1.5kHz", "800kHz", "5V", "30A", "2020" (package size)
  const match = str.match(/^([\d.]+)\s*([a-zA-Z%Ω]+)?$/i);
  if (!match) return null;

  const numValue = parseFloat(match[1]!);
  if (isNaN(numValue)) return null;

  const unit = (match[2] || "").toLowerCase();

  // Normalize to base units for comparison
  let multiplier = 1;
  let baseUnit = unit;

  // Frequency units
  if (unit === "mhz") {
    multiplier = 1000000;
    baseUnit = "hz";
  } else if (unit === "khz") {
    multiplier = 1000;
    baseUnit = "hz";
  } else if (unit === "hz") {
    baseUnit = "hz";
  }
  // Current units
  else if (unit === "ma") {
    multiplier = 0.001;
    baseUnit = "a";
  } else if (unit === "a") {
    baseUnit = "a";
  }
  // Voltage units
  else if (unit === "mv") {
    multiplier = 0.001;
    baseUnit = "v";
  } else if (unit === "v") {
    baseUnit = "v";
  }
  // Memory/storage units
  else if (unit === "kb") {
    multiplier = 1024;
    baseUnit = "b";
  } else if (unit === "mb") {
    multiplier = 1024 * 1024;
    baseUnit = "b";
  } else if (unit === "gb") {
    multiplier = 1024 * 1024 * 1024;
    baseUnit = "b";
  }

  return { value: numValue * multiplier, unit: baseUnit };
}

// Smart comparison for values that may have units
function compareValues(a: string, b: string): number {
  // First try to parse as values with units
  const parsedA = parseValueWithUnit(a);
  const parsedB = parseValueWithUnit(b);

  // If both have the same base unit, compare numerically
  if (parsedA && parsedB && parsedA.unit === parsedB.unit) {
    return parsedA.value - parsedB.value;
  }

  // If only one has a unit or units don't match, try simple numeric comparison
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }

  // Fall back to alphabetical comparison with natural number sorting
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

// Normalize and split string values that might contain multiple options
// e.g., "SOP8/10/14" -> ["SOP8", "SOP10", "SOP14"]
// e.g., "SOP16/QFN16" -> ["SOP16", "QFN16"]
function normalizeAndSplitValue(value: string): string[] {
  // Check if the value contains separators (/, |, or ,)
  if (!/[/|,]/.test(value)) {
    return [value.trim()];
  }

  // Split by common separators
  const parts = value
    .split(/[/|,]/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Check if we need to expand abbreviated forms like "SOP8/10/14"
  // This pattern: prefix + numbers where subsequent parts are just numbers
  const expanded: string[] = [];
  let lastPrefix = "";

  for (const part of parts) {
    // Check if this part is just a number (possibly indicating an abbreviated form)
    if (/^\d+$/.test(part) && lastPrefix) {
      // It's just a number, combine with last prefix
      expanded.push(lastPrefix + part);
    } else {
      // Extract prefix (letters) from this part for potential future abbreviation expansion
      const prefixMatch = part.match(/^([A-Za-z]+)/);
      if (prefixMatch) {
        lastPrefix = prefixMatch[1]!;
      }
      expanded.push(part);
    }
  }

  return expanded;
}

// Extract unique values and determine filter type for a column
export function analyzeColumn<T extends BaseEntry>(
  data: T[],
  key: string
): { type: ColumnFilterType; values: string[] } | null {
  const values = new Map<string, number>();
  let hasBoolean = false;
  let hasTrueValue = false;
  let hasFalseValue = false;
  let hasNullOnly = true;

  for (const item of data) {
    const value = item[key];

    if (value == null) continue;
    hasNullOnly = false;

    if (typeof value === "boolean") {
      hasBoolean = true;
      if (value === true) hasTrueValue = true;
      if (value === false) hasFalseValue = true;
      values.set(value ? "Yes" : "No", (values.get(value ? "Yes" : "No") || 0) + 1);
    } else if (Array.isArray(value)) {
      for (const v of value) {
        if (v != null) {
          const strVal = String(v).trim();
          if (strVal) {
            // Normalize and split array items too
            for (const normalizedVal of normalizeAndSplitValue(strVal)) {
              values.set(normalizedVal, (values.get(normalizedVal) || 0) + 1);
            }
          }
        }
      }
    } else if (typeof value === "string" || typeof value === "number") {
      const strVal = String(value).trim();
      if (strVal) {
        // Normalize and split the value
        for (const normalizedVal of normalizeAndSplitValue(strVal)) {
          values.set(normalizedVal, (values.get(normalizedVal) || 0) + 1);
        }
      }
    }
  }

  // Don't show filter if all values are null or only one unique value
  if (hasNullOnly || values.size <= 1) {
    return null;
  }

  // Determine type
  if (hasBoolean && values.size === 2 && hasTrueValue && hasFalseValue) {
    return { type: "boolean", values: ["Yes", "No"] };
  }

  // Sort values using smart comparison (handles units)
  const sortedValues = Array.from(values.keys()).sort(compareValues);

  return { type: "multiselect", values: sortedValues };
}

export function ColumnFilter({
  columnKey,
  data,
  currentFilter,
  onFilterChange,
}: ColumnFilterProps) {
  const analysis = useMemo(() => analyzeColumn(data, columnKey), [data, columnKey]);

  // Don't render if no filter needed
  if (!analysis) {
    return null;
  }

  const { values } = analysis;
  const hasActiveFilter = currentFilter && currentFilter.length > 0;

  const handleToggleValue = (value: string, checked: boolean) => {
    const current = currentFilter || [];
    let newValues: string[];

    if (checked) {
      newValues = [...current, value];
    } else {
      newValues = current.filter((v) => v !== value);
    }

    onFilterChange(columnKey, newValues.length > 0 ? newValues : null);
  };

  const handleClear = () => {
    onFilterChange(columnKey, null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${hasActiveFilter ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Filter className={`h-3 w-3 ${hasActiveFilter ? "fill-current" : ""}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-56 overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            {hasActiveFilter ? `${currentFilter!.length} selected` : "Filter"}
          </span>
          <div className="flex gap-1">
            {hasActiveFilter && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        {values.map((value) => {
          const isChecked = currentFilter?.includes(value) ?? false;
          return (
            <DropdownMenuCheckboxItem
              key={value}
              checked={isChecked}
              onCheckedChange={(checked) => handleToggleValue(value, checked)}
              className="text-sm"
            >
              {value}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Apply column filters to data
// Now handles normalized/split values when matching
export function applyColumnFilters<T extends BaseEntry>(
  data: T[],
  filters: Record<string, string[] | null>
): T[] {
  return data.filter((item) => {
    for (const [key, filterValues] of Object.entries(filters)) {
      if (!filterValues || filterValues.length === 0) continue;

      const itemValue = item[key];

      // Handle boolean columns (stored as "Yes"/"No" in filter)
      if (typeof itemValue === "boolean") {
        const boolStr = itemValue ? "Yes" : "No";
        if (!filterValues.includes(boolStr)) {
          return false;
        }
        continue;
      }

      // Handle array values (like interfaces, platforms)
      if (Array.isArray(itemValue)) {
        // Normalize and split all array values for matching
        const normalizedItemValues: string[] = [];
        for (const v of itemValue) {
          if (v != null) {
            normalizedItemValues.push(...normalizeAndSplitValue(String(v)));
          }
        }

        const hasMatch = filterValues.some((fv) =>
          normalizedItemValues.some((iv) => iv.toLowerCase() === fv.toLowerCase())
        );
        if (!hasMatch) return false;
        continue;
      }

      // Handle string/number values
      if (itemValue != null) {
        const strVal = String(itemValue);
        // Normalize and split the value for matching
        const normalizedItemValues = normalizeAndSplitValue(strVal);

        const hasMatch = filterValues.some((fv) =>
          normalizedItemValues.some((iv) => fv.toLowerCase() === iv.toLowerCase())
        );
        if (!hasMatch) return false;
        continue;
      }

      // If item value is null but we have filters, exclude it
      return false;
    }

    return true;
  });
}

// Parse column filters from URL
export function parseColumnFiltersFromURL(
  searchParams: URLSearchParams,
  columnKeys: string[]
): Record<string, string[] | null> {
  const filters: Record<string, string[] | null> = {};

  for (const key of columnKeys) {
    const value = searchParams.get(`f_${key}`);
    if (value) {
      filters[key] = value.split(",").filter(Boolean);
    }
  }

  return filters;
}

// Serialize column filters to URL params
export function serializeColumnFiltersToURL(
  filters: Record<string, string[] | null>
): Record<string, string | null> {
  const params: Record<string, string | null> = {};

  for (const [key, values] of Object.entries(filters)) {
    const paramKey = `f_${key}`;
    if (values && values.length > 0) {
      params[paramKey] = values.join(",");
    } else {
      params[paramKey] = null;
    }
  }

  return params;
}
