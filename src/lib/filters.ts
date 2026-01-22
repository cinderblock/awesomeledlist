/**
 * Filter configurations for each data category
 */

export type FilterType = "boolean" | "select" | "multiselect" | "range";

export interface FilterConfig {
  key: string;
  label: string;
  type: FilterType;
  options?: string[]; // For select/multiselect - if not provided, will be auto-generated from data
}

// Controller filters
export const controllerFilters: FilterConfig[] = [
  { key: "wled_compatible", label: "WLED Compatible", type: "boolean" },
  { key: "buffered", label: "Buffered Output", type: "boolean" },
  { key: "standalone", label: "Standalone", type: "boolean" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["active", "discontinued", "end-of-life", "unknown"],
  },
  { key: "interfaces", label: "Interfaces", type: "multiselect" },
  { key: "manufacturer", label: "Manufacturer", type: "multiselect" },
];

// Pixel filters
export const pixelFilters: FilterConfig[] = [
  { key: "clocked", label: "Clocked", type: "boolean" },
  { key: "backup_data_line", label: "Backup Data Line", type: "boolean" },
  { key: "color_order", label: "Color Order", type: "multiselect" },
  { key: "manufacturer", label: "Manufacturer", type: "multiselect" },
];

// Pixel IC filters
export const pixelICFilters: FilterConfig[] = [
  { key: "clocked", label: "Clocked", type: "boolean" },
  { key: "channels", label: "Channels", type: "multiselect" },
];

// Pattern Driver filters
export const patternDriverFilters: FilterConfig[] = [
  { key: "live", label: "Live Control", type: "boolean" },
  { key: "designer", label: "Has Designer", type: "boolean" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["active", "discontinued", "end-of-life", "unknown"],
  },
  { key: "platforms", label: "Platforms", type: "multiselect" },
];

// Connector filters
export const connectorFilters: FilterConfig[] = [
  { key: "panel_mount", label: "Panel Mount", type: "boolean" },
  { key: "wire_to_wire", label: "Wire-to-Wire", type: "boolean" },
  { key: "pcb_mount", label: "PCB Mount", type: "boolean" },
  { key: "gendered", label: "Gendered", type: "boolean" },
  { key: "outline", label: "Outline", type: "multiselect" },
  { key: "locking", label: "Locking", type: "multiselect" },
  { key: "manufacturer", label: "Manufacturer", type: "multiselect" },
];

// Microboard filters
export const microboardFilters: FilterConfig[] = [
  { key: "wifi", label: "WiFi", type: "boolean" },
  { key: "ethernet", label: "Ethernet", type: "boolean" },
  { key: "bluetooth", label: "Bluetooth", type: "boolean" },
  { key: "linux", label: "Linux", type: "boolean" },
  { key: "soc", label: "SoC", type: "multiselect" },
  { key: "manufacturer", label: "Manufacturer", type: "multiselect" },
];

// Adapter filters
export const adapterFilters: FilterConfig[] = [
  { key: "manufacturer", label: "Manufacturer", type: "multiselect" },
  { key: "pixel_types", label: "Pixel Types", type: "multiselect" },
];

// Drive Library filters
export const driveLibraryFilters: FilterConfig[] = [
  { key: "hardware", label: "Hardware", type: "multiselect" },
];

// Diffusive Material filters
export const diffusiveMaterialFilters: FilterConfig[] = [
  { key: "purpose_made", label: "Purpose Made", type: "boolean" },
  { key: "fire_retardant", label: "Fire Retardant", type: "boolean" },
  { key: "material_type", label: "Material Type", type: "multiselect" },
  { key: "price_range", label: "Price Range", type: "multiselect" },
];

// Commercial System filters
export const commercialSystemFilters: FilterConfig[] = [
  { key: "dedicated_psu", label: "Dedicated PSU", type: "boolean" },
  { key: "color_type", label: "Color Type", type: "multiselect" },
  { key: "price_range", label: "Price Range", type: "multiselect" },
  { key: "manufacturer", label: "Manufacturer", type: "multiselect" },
];

// Level Converter filters
export const levelConverterFilters: FilterConfig[] = [
  { key: "manufacturer", label: "Manufacturer", type: "multiselect" },
];

// Pixel Decoder filters
export const pixelDecoderFilters: FilterConfig[] = [
  { key: "manufacturer", label: "Manufacturer", type: "multiselect" },
];

// Map category IDs to their filter configurations
export function getFiltersForCategory(categoryId: string): FilterConfig[] {
  const filterMap: Record<string, FilterConfig[]> = {
    controllers: controllerFilters,
    pixels: pixelFilters,
    "pixel-ics": pixelICFilters,
    "pattern-drivers": patternDriverFilters,
    connectors: connectorFilters,
    microboards: microboardFilters,
    "level-converters": levelConverterFilters,
    adapters: adapterFilters,
    "drive-libraries": driveLibraryFilters,
    "pixel-decoders": pixelDecoderFilters,
    "diffusive-materials": diffusiveMaterialFilters,
    "commercial-systems": commercialSystemFilters,
  };

  return filterMap[categoryId] || [];
}

// Extract unique values for a field from data (for auto-generating options)
export function extractUniqueValues<T>(data: T[], key: string): string[] {
  const values = new Set<string>();

  for (const item of data) {
    const value = (item as Record<string, unknown>)[key];
    if (value == null) continue;

    if (Array.isArray(value)) {
      for (const v of value) {
        if (v != null) values.add(String(v));
      }
    } else if (typeof value === "string" && value.trim()) {
      values.add(value);
    }
  }

  return Array.from(values).sort();
}

// Filter value types
export interface FilterValues {
  [key: string]: boolean | string | string[] | null;
}

// Apply filters to data
export function applyFilters<T>(
  data: T[],
  filters: FilterValues,
  filterConfigs: FilterConfig[]
): T[] {
  return data.filter((item) => {
    for (const config of filterConfigs) {
      const filterValue = filters[config.key];
      if (filterValue == null) continue;

      const itemValue = (item as Record<string, unknown>)[config.key];

      switch (config.type) {
        case "boolean":
          if (typeof filterValue === "boolean") {
            // Only filter if the filter is set to true
            if (filterValue === true && itemValue !== true) {
              return false;
            }
          }
          break;

        case "select":
          if (typeof filterValue === "string" && filterValue) {
            if (String(itemValue).toLowerCase() !== filterValue.toLowerCase()) {
              return false;
            }
          }
          break;

        case "multiselect":
          if (Array.isArray(filterValue) && filterValue.length > 0) {
            // Item value can be array or string
            if (Array.isArray(itemValue)) {
              // Check if any of the filter values are in the item array
              const hasMatch = filterValue.some((fv) =>
                itemValue.some((iv) => String(iv).toLowerCase() === fv.toLowerCase())
              );
              if (!hasMatch) return false;
            } else if (typeof itemValue === "string") {
              // Check if the item value matches any filter value
              const hasMatch = filterValue.some(
                (fv) => itemValue.toLowerCase() === fv.toLowerCase()
              );
              if (!hasMatch) return false;
            } else {
              return false;
            }
          }
          break;
      }
    }

    return true;
  });
}

// Parse filter values from URL search params
export function parseFiltersFromURL(
  searchParams: URLSearchParams,
  filterConfigs: FilterConfig[]
): FilterValues {
  const filters: FilterValues = {};

  for (const config of filterConfigs) {
    const value = searchParams.get(config.key);
    if (value == null) continue;

    switch (config.type) {
      case "boolean":
        filters[config.key] = value === "true";
        break;

      case "select":
        filters[config.key] = value;
        break;

      case "multiselect":
        filters[config.key] = value.split(",").filter(Boolean);
        break;
    }
  }

  return filters;
}

// Serialize filter values to URL search params
export function serializeFiltersToURL(filters: FilterValues): Record<string, string | null> {
  const params: Record<string, string | null> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value == null) {
      params[key] = null;
      continue;
    }

    if (typeof value === "boolean") {
      params[key] = value ? "true" : null;
    } else if (typeof value === "string") {
      params[key] = value || null;
    } else if (Array.isArray(value)) {
      params[key] = value.length > 0 ? value.join(",") : null;
    }
  }

  return params;
}
