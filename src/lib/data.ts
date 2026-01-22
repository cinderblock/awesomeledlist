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

// Type definitions for each category
export interface Controller extends BaseEntry {
  manufacturer: string | null;
  max_pixels: number | null;
  price: string | null;
  max_outputs: number | null;
  interfaces: string[] | null;
  storage: string | null;
  standalone: boolean | null;
  pixel_types: string | null;
  max_voltage: string | null;
  max_current: string | null;
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

export interface Pixel extends BaseEntry {
  color_order: string | null;
  led_voltage: string | null;
  clocked: boolean | null;
  vcc_voltage: string | null;
  pwm_frequency: string | null;
  brightness_bits: string | null;
  data_bitrate: string | null;
  data_type: string | null;
  backup_data_line: boolean | null;
  package_size: string | null;
  manufacturer: string | null;
  notes: string | null;
  datasheet_url: string | null;
}

export interface PixelIC extends BaseEntry {
  pwm_frequency: string | null;
  channels: number | null;
  clocked: boolean | null;
  data_bitrate: string | null;
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
  max_voltage: string | null;
  ip_rating: string | null;
  locking: string | null;
  notes: string | null;
  url: string | null;
}

export interface Microboard extends BaseEntry {
  manufacturer: string | null;
  soc: string | null;
  cpu: string | null;
  clock_speed: string | null;
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
