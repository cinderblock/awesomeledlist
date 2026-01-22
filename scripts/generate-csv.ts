/**
 * Generate static CSV files for each category
 * These are pre-built CSVs with all data, accessible at /{category}.csv
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "fs";
import { resolve, join } from "path";
import { parse } from "yaml";

interface BaseEntry {
  id: string;
  name: string;
  [key: string]: unknown;
}

// Column configurations for each category (matching src/lib/columns.tsx)
const categoryColumns: Record<string, { key: string; label: string }[]> = {
  controllers: [
    { key: "name", label: "Name" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "max_pixels", label: "Max Pixels" },
    { key: "max_outputs", label: "Outputs" },
    { key: "interfaces", label: "Interfaces" },
    { key: "price", label: "Price" },
    { key: "wled_compatible", label: "WLED" },
    { key: "status", label: "Status" },
    { key: "url", label: "URL" },
  ],
  pixels: [
    { key: "name", label: "Name" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "color_order", label: "Color Order" },
    { key: "led_voltage", label: "LED Voltage" },
    { key: "vcc_voltage", label: "VCC" },
    { key: "clocked", label: "Clocked" },
    { key: "data_bitrate", label: "Data Rate" },
    { key: "package_size", label: "Package" },
    { key: "datasheet_url", label: "Datasheet URL" },
  ],
  "pixel-ics": [
    { key: "name", label: "Name" },
    { key: "channels", label: "Channels" },
    { key: "clocked", label: "Clocked" },
    { key: "pwm_frequency", label: "PWM Freq" },
    { key: "data_bitrate", label: "Data Rate" },
    { key: "package_size", label: "Package" },
    { key: "datasheet_url", label: "Datasheet URL" },
  ],
  "pattern-drivers": [
    { key: "name", label: "Name" },
    { key: "developer", label: "Developer" },
    { key: "price", label: "Price" },
    { key: "platforms", label: "Platforms" },
    { key: "live", label: "Live" },
    { key: "designer", label: "Designer" },
    { key: "visualizer", label: "Visualizer" },
    { key: "status", label: "Status" },
    { key: "url", label: "URL" },
  ],
  connectors: [
    { key: "name", label: "Name" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "outline", label: "Outline" },
    { key: "max_current", label: "Max Current" },
    { key: "max_voltage", label: "Max Voltage" },
    { key: "ip_rating", label: "IP Rating" },
    { key: "locking", label: "Locking" },
    { key: "url", label: "URL" },
    { key: "digikey_url", label: "DigiKey URL" },
    { key: "mouser_url", label: "Mouser URL" },
  ],
  microboards: [
    { key: "name", label: "Name" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "soc", label: "SoC" },
    { key: "cpu", label: "CPU" },
    { key: "clock_speed", label: "Clock" },
    { key: "flash", label: "Flash" },
    { key: "ram", label: "RAM" },
    { key: "wifi", label: "WiFi" },
    { key: "ethernet", label: "Ethernet" },
    { key: "price", label: "Price" },
    { key: "url", label: "URL" },
  ],
  "level-converters": [
    { key: "name", label: "Name" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "max_channels", label: "Channels" },
    { key: "price", label: "Price" },
    { key: "url", label: "URL" },
  ],
  adapters: [
    { key: "name", label: "Name" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "max_channels", label: "Channels" },
    { key: "pixel_types", label: "Pixel Types" },
    { key: "price", label: "Price" },
    { key: "url", label: "URL" },
  ],
  "drive-libraries": [
    { key: "name", label: "Name" },
    { key: "developer", label: "Developer" },
    { key: "hardware", label: "Hardware" },
    { key: "features", label: "Features" },
    { key: "url", label: "URL" },
    { key: "youtube_url", label: "YouTube URL" },
  ],
  "pixel-decoders": [
    { key: "name", label: "Name" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "max_channels", label: "Channels" },
    { key: "pixel_types", label: "Pixel Types" },
    { key: "outputs", label: "Outputs" },
    { key: "price", label: "Price" },
    { key: "url", label: "URL" },
  ],
  "diffusive-materials": [
    { key: "name", label: "Name" },
    { key: "material_type", label: "Type" },
    { key: "color_rendition", label: "Color Rendition" },
    { key: "light_transmission", label: "Transmission" },
    { key: "flexible", label: "Flexible" },
    { key: "price_range", label: "Price Range" },
    { key: "url", label: "URL" },
  ],
  "commercial-systems": [
    { key: "name", label: "Name" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "pixels_per_run", label: "Pixels/Run" },
    { key: "color_type", label: "Color Type" },
    { key: "price_range", label: "Price Range" },
    { key: "url", label: "URL" },
  ],
};

function escapeCSVValue(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (Array.isArray(value)) {
    value = value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  const str = String(value);

  if (str.includes(",") || str.includes("\n") || str.includes('"') || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function getValue(item: BaseEntry, key: string): unknown {
  const parts = key.split(".");
  let value: unknown = item;
  for (const part of parts) {
    if (value == null) return null;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

function dataToCSV(data: BaseEntry[], columns: { key: string; label: string }[]): string {
  // BOM for Excel compatibility
  const bom = "\uFEFF";

  const headers = columns.map((col) => escapeCSVValue(col.label));
  const headerRow = headers.join(",");

  const dataRows = data.map((item) => {
    const values = columns.map((col) => {
      const value = getValue(item, col.key);
      return escapeCSVValue(value);
    });
    return values.join(",");
  });

  return bom + [headerRow, ...dataRows].join("\n");
}

function loadCategoryData(databaseDir: string, categoryId: string): BaseEntry[] {
  const categoryDir = join(databaseDir, categoryId);
  if (!existsSync(categoryDir)) {
    return [];
  }

  const entries: BaseEntry[] = [];
  const files = readdirSync(categoryDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

  for (const file of files) {
    const filePath = join(categoryDir, file);
    try {
      const content = readFileSync(filePath, "utf-8");
      const parsed = parse(content) as BaseEntry;
      if (parsed && parsed.id) {
        entries.push(parsed);
      }
    } catch (e) {
      console.warn(`Failed to parse ${filePath}:`, e);
    }
  }

  // Sort by name
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return entries;
}

function main() {
  const projectRoot = resolve(__dirname, "..");
  const databaseDir = join(projectRoot, "database");
  const outputDir = join(projectRoot, "dist");

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Get all category directories
  const categories = readdirSync(databaseDir).filter((d) => {
    if (d.startsWith("_")) return false;
    const stat = statSync(join(databaseDir, d));
    return stat.isDirectory();
  });

  console.log("Generating CSV files for categories...");

  for (const categoryId of categories) {
    const columns = categoryColumns[categoryId];
    if (!columns) {
      console.warn(`No column config for ${categoryId}, skipping...`);
      continue;
    }

    const data = loadCategoryData(databaseDir, categoryId);
    if (data.length === 0) {
      console.warn(`No data for ${categoryId}, skipping...`);
      continue;
    }

    const csv = dataToCSV(data, columns);
    const outputPath = join(outputDir, `${categoryId}.csv`);
    writeFileSync(outputPath, csv, "utf-8");

    console.log(`  ✓ ${categoryId}.csv (${data.length} entries)`);
  }

  console.log("Done!");
}

main();
