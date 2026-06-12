/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { copyFileSync, existsSync, readdirSync, mkdirSync, statSync, writeFileSync, readFileSync } from "fs";
import { parse } from "yaml";

// CSV generation utilities
interface BaseEntry {
  id: string;
  name: string;
  [key: string]: unknown;
}

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
  if (value == null) return "";
  if (Array.isArray(value)) value = value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
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
  const bom = "\uFEFF";
  const headers = columns.map((col) => escapeCSVValue(col.label));
  const headerRow = headers.join(",");
  const dataRows = data.map((item) => {
    const values = columns.map((col) => escapeCSVValue(getValue(item, col.key)));
    return values.join(",");
  });
  return bom + [headerRow, ...dataRows].join("\n");
}

function loadCategoryData(databaseDir: string, categoryId: string): BaseEntry[] {
  const categoryDir = resolve(databaseDir, categoryId);
  if (!existsSync(categoryDir)) return [];

  const entries: BaseEntry[] = [];
  const files = readdirSync(categoryDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

  for (const file of files) {
    const filePath = resolve(categoryDir, file);
    try {
      const content = readFileSync(filePath, "utf-8");
      const parsed = parse(content) as BaseEntry;
      if (parsed && parsed.id) entries.push(parsed);
    } catch (e) {
      console.warn(`Failed to parse ${filePath}:`, e);
    }
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));
  return entries;
}

function generateCategoryCSVs(databaseDir: string, distDir: string) {
  const categories = readdirSync(databaseDir).filter((d) => {
    if (d.startsWith("_")) return false;
    return statSync(resolve(databaseDir, d)).isDirectory();
  });

  console.log("Generating CSV files...");
  for (const categoryId of categories) {
    const columns = categoryColumns[categoryId];
    if (!columns) continue;

    const data = loadCategoryData(databaseDir, categoryId);
    if (data.length === 0) continue;

    const csv = dataToCSV(data, columns);
    writeFileSync(resolve(distDir, `${categoryId}.csv`), csv, "utf-8");
    console.log(`  ✓ ${categoryId}.csv (${data.length} entries)`);
  }
}

// Recursively copy directory
function copyDirSync(src: string, dest: string) {
  if (!existsSync(src)) return;
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = resolve(src, entry);
    const destPath = resolve(dest, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  // Serve from a subpath (e.g. /awesomeledlist/ on github.io) when BASE_PATH
  // is set; defaults to root for custom-domain hosting. Router basename
  // follows automatically via import.meta.env.BASE_URL.
  base: process.env.BASE_PATH || "/",
  plugins: [
    react(),
    tailwindcss(),
    // Copy index.html to 404.html for GitHub Pages SPA routing
    // and copy database images to dist
    {
      name: "post-build-copy",
      closeBundle() {
        const distDir = resolve(__dirname, "dist");
        const indexPath = resolve(distDir, "index.html");
        const notFoundPath = resolve(distDir, "404.html");

        // Copy 404.html
        if (existsSync(indexPath)) {
          copyFileSync(indexPath, notFoundPath);
        }

        // Copy database images to dist/images
        const databaseDir = resolve(__dirname, "database");

        // Generate static CSV files for each category
        generateCategoryCSVs(databaseDir, distDir);
        const categories = readdirSync(databaseDir).filter(
          (d) => !d.startsWith("_") && statSync(resolve(databaseDir, d)).isDirectory()
        );

        for (const category of categories) {
          const imagesDir = resolve(databaseDir, category, "images");
          if (existsSync(imagesDir)) {
            const destDir = resolve(distDir, "images", category);
            copyDirSync(imagesDir, destDir);
          }
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
});
