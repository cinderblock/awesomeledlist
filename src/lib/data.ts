/**
 * Data loading utilities for YAML database files
 * At build time, Vite will bundle these as static JSON
 */

// Import all YAML files at build time using Vite's glob import
const yamlModules = import.meta.glob("/database/**/*.yaml", {
  eager: true,
  query: "?raw",
  import: "default",
});

import { parse } from "yaml";

export interface BaseEntry {
  id: string;
  name: string;
  image?: string | null;
  images?: string[] | null;
  [key: string]: unknown;
}

// Parse all YAML files and organize by category
function loadAllData(): Record<string, BaseEntry[]> {
  const data: Record<string, BaseEntry[]> = {};

  for (const [path, content] of Object.entries(yamlModules)) {
    // Extract category from path: /database/controllers/foo.yaml -> controllers
    const match = path.match(/\/database\/([^/]+)\//);
    if (!match || match[1] === "_schema") continue;

    const category = match[1]!;
    if (!data[category]) {
      data[category] = [];
    }

    try {
      const parsed = parse(content as string) as BaseEntry;
      if (parsed && parsed.id) {
        data[category].push(parsed);
      }
    } catch (e) {
      console.warn(`Failed to parse ${path}:`, e);
    }
  }

  // Sort each category by name
  for (const category of Object.keys(data)) {
    data[category]!.sort((a, b) => a.name.localeCompare(b.name));
  }

  return data;
}

// Cached data
let cachedData: Record<string, BaseEntry[]> | null = null;

export function getAllData(): Record<string, BaseEntry[]> {
  if (!cachedData) {
    cachedData = loadAllData();
  }
  return cachedData;
}

export function getCategoryData<T extends BaseEntry>(category: string): T[] {
  const data = getAllData();
  return (data[category] || []) as T[];
}

export function getEntryById<T extends BaseEntry>(category: string, id: string): T | undefined {
  const data = getCategoryData<T>(category);
  return data.find((entry) => entry.id === id);
}

export function getCategoryCount(category: string): number {
  return getCategoryData(category).length;
}

// Get image URL for an entry
export function getImageUrl(category: string, imagePath: string): string {
  return `/images/${category}/${imagePath}`;
}

// Get entries that have images
export function getEntriesWithImages<T extends BaseEntry>(category: string): T[] {
  const data = getCategoryData<T>(category);
  return data.filter((entry) => entry.image || (entry.images && entry.images.length > 0));
}

// Get random entries with images (for home page preview)
export function getRandomEntriesWithImages<T extends BaseEntry>(
  category: string,
  count: number
): T[] {
  const withImages = getEntriesWithImages<T>(category);
  if (withImages.length <= count) return withImages;

  // Fisher-Yates shuffle and take first `count`
  const shuffled = [...withImages];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled.slice(0, count);
}

// Type definitions for each category
export interface Controller extends BaseEntry {
  manufacturer: string | null;
  max_pixels: number | null;
  price: string | null;
  max_outputs: number | null;
  interfaces: string[] | null;
  /** Control protocols/ecosystems accepted (ArtNet, sACN, DDP, DMX, FPP, ...) */
  protocols: string[] | null;
  storage: string | null;
  standalone: boolean | null;
  pixel_types: string | null;
  /** Volts — canonical unit lives in the JSON Schema ("unit" keyword) */
  max_voltage: number | null;
  /** Amps — canonical unit lives in the JSON Schema ("unit" keyword) */
  max_current: number | null;
  buffered: boolean | null;
  output_connectors: string | null;
  outputs: string | null;
  waterproof: string | null;
  auxiliary_outputs: string | null;
  wled_compatible: boolean | null;
  notes: string | null;
  warranty: string | null;
  release_year: number | null;
  status: string | null;
  url: string | null;
}

/** Numeric range in a field's canonical unit (common.json#/definitions/range) */
export interface Range {
  min: number;
  max: number;
}

export interface Pixel extends BaseEntry {
  color_order: string | null;
  /** Volts (or {min,max} range) — canonical unit lives in the JSON Schema */
  led_voltage: number | Range | null;
  clocked: boolean | null;
  /** Volts */
  vcc_voltage: number | null;
  /** kHz */
  pwm_frequency: number | null;
  brightness_bits: string | null;
  /** MHz */
  data_bitrate: number | null;
  data_type: string | null;
  backup_data_line: boolean | null;
  package_size: string | null;
  manufacturer: string | null;
  notes: string | null;
  datasheet_url: string | null;
  /** IDs of pixel-ics entries this pixel is built on or protocol-compatible with */
  related_pixel_ics?: string[] | null;
}

export interface PixelIC extends BaseEntry {
  /** kHz */
  pwm_frequency: number | null;
  channels: number | null;
  clocked: boolean | null;
  /** MHz */
  data_bitrate: number | null;
  data_type: string | null;
  package_size: string | null;
  notes: string | null;
  datasheet_url: string | null;
}

export interface PatternDriver extends BaseEntry {
  developer: string | null;
  price: string | null;
  platforms: string[] | null;
  live: boolean | null;
  designer: string | null;
  visualizer: string | null;
  protocols: {
    artnet: string | null;
    sacn: string | null;
    dmx: string | null;
    ddp: string | null;
  } | null;
  notes: string | null;
  status: string | null;
  url: string | null;
}

export interface Connector extends BaseEntry {
  manufacturer: string | null;
  outline: string | null;
  max_current: string | null;
  /** Volts */
  max_voltage: number | null;
  ip_rating: string | null;
  locking: string | null;
  notes: string | null;
  url: string | null;
}

export interface Microboard extends BaseEntry {
  manufacturer: string | null;
  soc: string | null;
  cpu: string | null;
  /** MHz */
  clock_speed: number | null;
  flash: string | null;
  ram: string | null;
  wifi: string | null;
  ethernet: string | null;
  price: string | null;
  url: string | null;
}

export interface Adapter extends BaseEntry {
  manufacturer: string | null;
  max_channels: number | null;
  pixel_types: string | null;
  parent: string | null;
  price: string | null;
  notes: string | null;
  url: string | null;
}

export interface DriveLibrary extends BaseEntry {
  developer: string | null;
  hardware: string | null;
  features: string | null;
  url: string | null;
}

export interface DiffusiveMaterial extends BaseEntry {
  color_rendition: string | null;
  light_transmission: string | null;
  flexible: string | null;
  material_type: string | null;
  price_range: string | null;
  notes: string | null;
  url: string | null;
}

export interface CommercialSystem extends BaseEntry {
  manufacturer: string | null;
  pixels_per_run: number | null;
  color_type: string | null;
  price_range: string | null;
  notes: string | null;
}

// Cross-reference configuration
export interface RelatedItemConfig {
  field: string; // Field name in the entry (e.g., "related_connectors")
  targetCategory: string; // Category ID to look up (e.g., "connectors")
  label: string; // Display label (e.g., "Compatible Connectors")
}

// Get related item configs for a category
export function getRelatedItemConfigs(categoryId: string): RelatedItemConfig[] {
  const configMap: Record<string, RelatedItemConfig[]> = {
    controllers: [
      { field: "related_connectors", targetCategory: "connectors", label: "Compatible Connectors" },
      { field: "related_pixel_ics", targetCategory: "pixel-ics", label: "Compatible Pixel ICs" },
      { field: "related_microboards", targetCategory: "microboards", label: "Related Microboards" },
    ],
    adapters: [
      {
        field: "related_microboards",
        targetCategory: "microboards",
        label: "Compatible Microboards",
      },
      { field: "related_connectors", targetCategory: "connectors", label: "Output Connectors" },
    ],
    "pixel-decoders": [
      { field: "related_connectors", targetCategory: "connectors", label: "Connectors" },
    ],
    pixels: [
      { field: "related_pixel_ics", targetCategory: "pixel-ics", label: "Pixel IC / Protocol" },
    ],
    "drive-libraries": [
      { field: "related_pixel_ics", targetCategory: "pixel-ics", label: "Supported Pixel ICs" },
    ],
    microboards: [
      { field: "related_adapters", targetCategory: "adapters", label: "Compatible Adapters" },
    ],
  };

  return configMap[categoryId] || [];
}

// Resolve related entries
export interface RelatedEntry {
  id: string;
  name: string;
  category: string;
  categoryPath: string;
}

export function getRelatedEntries(entry: BaseEntry, config: RelatedItemConfig): RelatedEntry[] {
  const ids = entry[config.field];
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const data = getCategoryData(config.targetCategory);
  const categoryPath = `/${config.targetCategory}`;

  return ids
    .map((id) => {
      const found = data.find((e) => e.id === id);
      if (!found) return null;
      return {
        id: found.id,
        name: found.name,
        category: config.targetCategory,
        categoryPath,
      };
    })
    .filter(Boolean) as RelatedEntry[];
}

// Get entries that reference this entry (reverse lookup)
export function getReferencingEntries(
  entryId: string,
  targetCategory: string
): { entry: BaseEntry; sourceCategory: string; sourcePath: string }[] {
  const results: { entry: BaseEntry; sourceCategory: string; sourcePath: string }[] = [];
  const allData = getAllData();

  for (const [sourceCategory, entries] of Object.entries(allData)) {
    const configs = getRelatedItemConfigs(sourceCategory);
    const relevantConfigs = configs.filter((c) => c.targetCategory === targetCategory);

    if (relevantConfigs.length === 0) continue;

    for (const entry of entries) {
      for (const config of relevantConfigs) {
        const refs = entry[config.field];
        if (Array.isArray(refs) && refs.includes(entryId)) {
          results.push({
            entry,
            sourceCategory,
            sourcePath: `/${sourceCategory}`,
          });
          break; // Only add once per entry
        }
      }
    }
  }

  return results;
}
