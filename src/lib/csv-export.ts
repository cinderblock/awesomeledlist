/**
 * CSV Export Utility
 * Converts data arrays to CSV format and triggers download
 */

import type { Column } from "@/components/data";

/**
 * Escape a value for CSV format
 * - Wraps in quotes if contains comma, newline, or quote
 * - Escapes internal quotes by doubling them
 */
export function escapeCSVValue(value: unknown): string {
  if (value == null) {
    return "";
  }

  // Convert arrays to comma-separated string
  if (Array.isArray(value)) {
    value = value.join(", ");
  }

  // Convert booleans to Yes/No
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  const str = String(value);

  // Check if we need to quote the value
  if (str.includes(",") || str.includes("\n") || str.includes('"') || str.includes("\r")) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Get a nested value from an object using dot notation
 */
export function getValue<T>(item: T, key: string): unknown {
  const parts = key.split(".");
  let value: unknown = item;
  for (const part of parts) {
    if (value == null) return null;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

/**
 * Convert data array to CSV string
 * Includes all columns (including links) - use includeLinks to control link columns
 */
export function dataToCSV<T>(
  data: T[],
  columns: Column<T>[],
  options?: { includeLinks?: boolean }
): string {
  const includeLinks = options?.includeLinks ?? true;

  // Filter columns based on options
  const dataColumns = columns.filter((col) => {
    // Always exclude the virtual "links" column that renders icons
    if (col.key === "links") return false;
    // Keep all other columns
    return true;
  });

  // If including links, also add URL fields from the data that might not be in columns
  const linkFields = includeLinks ? ["url", "datasheet_url", "digikey_url", "mouser_url", "youtube_url"] : [];
  const existingKeys = new Set(dataColumns.map((col) => String(col.key)));

  // Add link columns that exist in data but aren't already in columns
  const additionalLinkColumns: Column<T>[] = [];
  if (data.length > 0 && includeLinks) {
    const sampleItem = data[0] as Record<string, unknown>;
    for (const linkField of linkFields) {
      if (!existingKeys.has(linkField) && linkField in sampleItem) {
        additionalLinkColumns.push({
          key: linkField as keyof T,
          label: linkField
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .replace("Url", "URL"),
        });
      }
    }
  }

  const allColumns = [...dataColumns, ...additionalLinkColumns];

  // Create header row
  const headers = allColumns.map((col) => escapeCSVValue(col.label));
  const headerRow = headers.join(",");

  // Create data rows
  const dataRows = data.map((item) => {
    const values = allColumns.map((col) => {
      const value = getValue(item, String(col.key));
      return escapeCSVValue(value);
    });
    return values.join(",");
  });

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Generate a filename based on category and active filters
 */
export function generateCSVFilename(
  categoryName: string,
  filters?: Record<string, string[] | null>,
  search?: string
): string {
  const parts = [categoryName.toLowerCase().replace(/\s+/g, "-")];

  // Add search term if present
  if (search && search.trim()) {
    parts.push(`search-${search.trim().toLowerCase().replace(/\s+/g, "-")}`);
  }

  // Add active filters
  if (filters) {
    for (const [key, values] of Object.entries(filters)) {
      if (values && values.length > 0) {
        // Simplify filter representation
        const filterPart = values.length === 1
          ? values[0]!.toLowerCase().replace(/\s+/g, "-")
          : `${values.length}-${key}`;
        parts.push(filterPart);
      }
    }
  }

  // Limit filename length
  let filename = parts.join("_");
  if (filename.length > 100) {
    filename = filename.substring(0, 100);
  }

  return filename;
}

/**
 * Trigger a CSV file download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel compatibility with UTF-8
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV and download
 */
export function exportToCSV<T>(
  data: T[],
  columns: Column<T>[],
  filename: string,
  options?: { includeLinks?: boolean }
): void {
  const csv = dataToCSV(data, columns, options);
  downloadCSV(csv, filename);
}
