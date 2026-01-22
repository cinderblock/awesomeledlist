#!/usr/bin/env bun
/**
 * Convert CSV files from original dataset to YAML format
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { stringify } from "yaml";
import { join, basename } from "path";

const CSV_DIR = "original dataset";
const DB_DIR = "database";

// Map CSV file names to category folders and processing functions
const CSV_MAPPINGS: Record<string, { folder: string; processor: (rows: string[][]) => unknown[] }> =
  {
    "Controllers.csv": { folder: "controllers", processor: processControllers },
    "Pixels.csv": { folder: "pixels", processor: processPixels },
    "Pixel ICs.csv": { folder: "pixel-ics", processor: processPixelICs },
    "Pattern Drivers.csv": { folder: "pattern-drivers", processor: processPatternDrivers },
    "Connectors.csv": { folder: "connectors", processor: processConnectors },
    "DIY MicroBoards.csv": { folder: "microboards", processor: processMicroboards },
    "Level Converters.csv": { folder: "level-converters", processor: processLevelConverters },
    "Adapters.csv": { folder: "adapters", processor: processAdapters },
    "Drive Libraries.csv": { folder: "drive-libraries", processor: processDriveLibraries },
    "Pixel Decoders.csv": { folder: "pixel-decoders", processor: processPixelDecoders },
    "Diffusive Materials.csv": {
      folder: "diffusive-materials",
      processor: processDiffusiveMaterials,
    },
    " Commercial Pixel Systems.csv": {
      folder: "commercial-systems",
      processor: processCommercialSystems,
    },
  };

function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
        if (char === "\r") i++;
      } else if (char !== "\r") {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 64);
}

function parseBoolean(value: string | undefined): boolean | null {
  if (!value) return null;
  const lower = value.toLowerCase().trim();
  if (lower === "yes" || lower === "y" || lower === "true") return true;
  if (lower === "no" || lower === "n" || lower === "false") return false;
  return null;
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[$,]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseYear(value: string | undefined): number | null {
  if (!value) return null;
  const num = parseInt(value.trim());
  return isNaN(num) || num < 1990 || num > 2030 ? null : num;
}

function cleanString(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

function processControllers(rows: string[][]): unknown[] {
  const headers = rows[0];
  return rows
    .slice(1)
    .map((row) => {
      const name = row[0] || row[1];
      if (!name) return null;
      return {
        id: slugify(name),
        name,
        manufacturer: cleanString(row[1]),
        max_pixels: parseNumber(row[2]),
        price: cleanString(row[3]),
        max_outputs: parseNumber(row[4]),
        interfaces: cleanString(row[5])
          ?.split(/[,\/]/)
          .map((s) => s.trim())
          .filter(Boolean),
        storage: cleanString(row[6]),
        standalone: parseBoolean(row[7]),
        pixel_types: cleanString(row[8])?.toLowerCase(),
        max_voltage: cleanString(row[9]),
        max_current: cleanString(row[10]),
        buffered: parseBoolean(row[11]),
        output_connectors: cleanString(row[12]),
        outputs: cleanString(row[13]),
        waterproof: cleanString(row[14]),
        auxiliary_outputs: cleanString(row[15]),
        wled_compatible: parseBoolean(row[16]),
        notes: cleanString(row[17]),
        warranty: cleanString(row[18]),
        release_year: parseYear(row[19]),
        status: cleanString(row[20])?.toLowerCase() || "unknown",
        url: cleanString(row[21]),
      };
    })
    .filter(Boolean);
}

function processPixels(rows: string[][]): unknown[] {
  return rows
    .slice(1)
    .map((row) => {
      const name = row[0];
      if (!name) return null;
      return {
        id: slugify(name),
        name,
        color_order: cleanString(row[1]),
        led_voltage: cleanString(row[2]),
        clocked: parseBoolean(row[3]),
        vcc_voltage: cleanString(row[4]),
        pwm_frequency: cleanString(row[5]),
        brightness_bits: cleanString(row[6]),
        data_bitrate: cleanString(row[7]),
        pixel_data_size: cleanString(row[8]),
        pixel_rate_max: cleanString(row[9]),
        gpio_min: cleanString(row[10]),
        gpio_max: cleanString(row[11]),
        wattage: cleanString(row[12]),
        channel_current: cleanString(row[13]),
        quiescent_current: cleanString(row[14]),
        package_size: cleanString(row[15]),
        pin_count: parseNumber(row[16]),
        data_type: cleanString(row[17]),
        backup_data_line: parseBoolean(row[18]),
        max_pixels_per_string: cleanString(row[19]),
        release_year: parseYear(row[20]),
        notes: cleanString(row[21]),
        third_party_testing: cleanString(row[22]),
        manufacturer: cleanString(row[23]),
        datasheet_url: cleanString(row[24]),
        other_links: cleanString(row[25]),
      };
    })
    .filter(Boolean);
}

function processPixelICs(rows: string[][]): unknown[] {
  return rows
    .slice(1)
    .map((row) => {
      const name = row[0];
      if (!name) return null;
      return {
        id: slugify(name),
        name,
        pwm_frequency: cleanString(row[1]),
        channels: parseNumber(row[2]),
        channel_bits: cleanString(row[3]),
        aggregate_bits: cleanString(row[4]),
        clocked: parseBoolean(row[5]),
        data_bitrate: cleanString(row[6]),
        pixel_data_size: cleanString(row[7]),
        pixel_rate_max: cleanString(row[8]),
        output_voltage: cleanString(row[9]),
        supply_voltage: cleanString(row[10]),
        gpio_min: cleanString(row[11]),
        gpio_max: cleanString(row[12]),
        max_current: cleanString(row[13]),
        quiescent_current: cleanString(row[14]),
        package_size: cleanString(row[15]),
        pin_count: cleanString(row[16]),
        data_type: cleanString(row[17]),
        backup_data_line: parseBoolean(row[18]),
        max_pixels_per_string: cleanString(row[19]),
        release_year: parseYear(row[20]),
        notes: cleanString(row[21]),
        third_party_testing: cleanString(row[22]),
        datasheet_url: cleanString(row[23]),
        other_links: cleanString(row[24]),
      };
    })
    .filter(Boolean);
}

function processPatternDrivers(rows: string[][]): unknown[] {
  return rows
    .slice(1)
    .map((row) => {
      const name = row[0];
      if (!name) return null;
      return {
        id: slugify(name),
        name,
        developer: cleanString(row[1]),
        price: cleanString(row[2]),
        platforms: cleanString(row[3])
          ?.split(/[,\/]/)
          .map((s) => s.trim())
          .filter(Boolean),
        live: parseBoolean(row[4]),
        designer: cleanString(row[5]),
        visualizer: cleanString(row[6]),
        protocols: {
          artnet: cleanString(row[7]),
          sacn: cleanString(row[8]),
          dmx: cleanString(row[9]),
          kinet: cleanString(row[10]),
          ddp: cleanString(row[11]),
        },
        gpio: cleanString(row[12]),
        serial: cleanString(row[13]),
        video_input: cleanString(row[14]),
        audio_input: cleanString(row[15]),
        programmatic: cleanString(row[16]),
        language: cleanString(row[17]),
        other_inputs: cleanString(row[18]),
        other_outputs: cleanString(row[19]),
        integrations: cleanString(row[20]),
        notes: cleanString(row[21]),
        demo_available: cleanString(row[22]),
        status: cleanString(row[23])?.toLowerCase() || "unknown",
        url: cleanString(row[24]),
      };
    })
    .filter(Boolean);
}

function processConnectors(rows: string[][]): unknown[] {
  return rows
    .slice(1)
    .map((row) => {
      const name = row[0];
      if (!name) return null;
      return {
        id: slugify(name),
        name,
        manufacturer: cleanString(row[1]),
        url: cleanString(row[2]),
        outline: cleanString(row[3]),
        max_current: cleanString(row[4]),
        max_voltage: cleanString(row[5]),
        ip_rating: cleanString(row[6]),
        locking: cleanString(row[7]),
        panel_mount: parseBoolean(row[8]),
        wire_to_wire: parseBoolean(row[9]),
        pcb_mount: cleanString(row[10]),
        smallest_gauge: cleanString(row[11]),
        largest_gauge: cleanString(row[12]),
        pitch: cleanString(row[13]),
        contact_type: cleanString(row[14]),
        solder: parseBoolean(row[15]),
        screw_terminal: parseBoolean(row[16]),
        crimp: parseBoolean(row[17]),
        idc: parseBoolean(row[18]),
        board_fingers: parseBoolean(row[19]),
        gendered: parseBoolean(row[20]),
        min_pins: parseNumber(row[21]),
        max_pins: parseNumber(row[22]),
        rows: cleanString(row[23]),
        year_introduced: parseYear(row[24]),
        pinout: cleanString(row[26]),
        convention: cleanString(row[27]),
        colors: cleanString(row[28]),
        digikey_url: cleanString(row[29]),
        mouser_url: cleanString(row[30]),
        notes: cleanString(row[31]),
      };
    })
    .filter(Boolean);
}

function processMicroboards(rows: string[][]): unknown[] {
  return rows
    .slice(1)
    .map((row) => {
      const name = row[0];
      if (!name) return null;
      return {
        id: slugify(name),
        name,
        manufacturer: cleanString(row[1]),
        soc: cleanString(row[2]),
        cpu: cleanString(row[3]),
        isa: cleanString(row[4]),
        clock_speed: cleanString(row[5]),
        flash: cleanString(row[6]),
        ram: cleanString(row[7]),
        linux: parseBoolean(row[8]),
        max_outputs: parseNumber(row[9]),
        min_input_voltage: cleanString(row[10]),
        max_input_voltage: cleanString(row[11]),
        gpio_voltage: cleanString(row[12]),
        usb: cleanString(row[13]),
        ttl_serial: cleanString(row[14]),
        wifi: cleanString(row[15]),
        poe: cleanString(row[16]),
        ethernet: cleanString(row[17]),
        bluetooth: cleanString(row[18]),
        storage: cleanString(row[19]),
        bms: cleanString(row[20]),
        imu: cleanString(row[21]),
        price: cleanString(row[22]),
        release_year: parseYear(row[23]),
        url: cleanString(row[24]),
        notes: cleanString(row[25]),
      };
    })
    .filter(Boolean);
}

function processLevelConverters(rows: string[][]): unknown[] {
  return rows
    .slice(1)
    .map((row) => {
      const name = row[0];
      if (!name) return null;
      return {
        id: slugify(name),
        name,
        manufacturer: cleanString(row[1]),
        channels: parseNumber(row[2]),
        interface: cleanString(row[3]),
        notes: cleanString(row[4]),
        price: cleanString(row[5]),
        max_voltage: cleanString(row[6]),
        max_current: cleanString(row[7]),
        buffered: parseBoolean(row[8]),
        url: cleanString(row[9]),
      };
    })
    .filter(Boolean);
}

function processAdapters(rows: string[][]): unknown[] {
  return rows
    .slice(1)
    .map((row) => {
      const name = row[0];
      if (!name) return null;
      return {
        id: slugify(name),
        name,
        manufacturer: cleanString(row[1]),
        max_channels: parseNumber(row[2]),
        pixel_types: cleanString(row[3]),
        max_voltage: cleanString(row[4]),
        max_current: cleanString(row[5]),
        parent: cleanString(row[6]),
        price: cleanString(row[7]),
        output_connectors: cleanString(row[8]),
        outputs: cleanString(row[10]),
        diy_or_ots: cleanString(row[11]),
        notes: cleanString(row[12]),
        url: cleanString(row[13]),
      };
    })
    .filter(Boolean);
}

function processDriveLibraries(rows: string[][]): unknown[] {
  return rows
    .slice(1)
    .map((row) => {
      const name = row[0];
      if (!name) return null;
      return {
        id: slugify(name),
        name,
        developer: cleanString(row[1]),
        hardware: cleanString(row[2]),
        features: cleanString(row[3]),
        url: cleanString(row[4]),
        youtube_url: cleanString(row[5]),
        instructional_resources: [cleanString(row[6]), cleanString(row[7])].filter(Boolean),
      };
    })
    .filter(Boolean);
}

function processPixelDecoders(rows: string[][]): unknown[] {
  return rows
    .slice(1)
    .map((row) => {
      const name = row[0];
      if (!name) return null;
      return {
        id: slugify(name),
        name,
        manufacturer: cleanString(row[1]),
        max_channels: parseNumber(row[2]),
        pixel_types: cleanString(row[3]),
        price: cleanString(row[4]),
        output_connectors: cleanString(row[5]),
        outputs: cleanString(row[6]),
        diy_or_ots: cleanString(row[7]),
        notes: cleanString(row[8]),
        url: cleanString(row[9]),
      };
    })
    .filter(Boolean);
}

function processDiffusiveMaterials(rows: string[][]): unknown[] {
  return rows
    .slice(1)
    .map((row) => {
      const name = row[0];
      if (!name) return null;
      return {
        id: slugify(name),
        name,
        url: cleanString(row[1]),
        color_rendition: cleanString(row[2]),
        light_transmission: cleanString(row[3]),
        flexible: cleanString(row[4]),
        purpose_made: parseBoolean(row[5]),
        properties: cleanString(row[6]),
        fire_retardant: parseBoolean(row[7]),
        tinted: cleanString(row[8]),
        sample_thickness: cleanString(row[9]),
        diffusivity: cleanString(row[10]),
        sizes_available: cleanString(row[11]),
        material_type: cleanString(row[12]),
        price_range: cleanString(row[13]),
        notes: cleanString(row[14]),
      };
    })
    .filter(Boolean);
}

function processCommercialSystems(rows: string[][]): unknown[] {
  return rows
    .slice(1)
    .map((row) => {
      const name = row[0];
      if (!name) return null;
      return {
        id: slugify(name),
        name,
        manufacturer: cleanString(row[1]),
        pixels_per_run: parseNumber(row[2]),
        dimming_resolution: cleanString(row[3]),
        dedicated_psu: parseBoolean(row[4]),
        color_type: cleanString(row[5]),
        online_pricing: cleanString(row[6]),
        price_range: cleanString(row[7]),
        core_tech: cleanString(row[8]),
        since: parseYear(row[9]),
        target_market: cleanString(row[10]),
        notes: cleanString(row[11]),
      };
    })
    .filter(Boolean);
}

async function main() {
  const files = readdirSync(CSV_DIR);

  for (const file of files) {
    const mapping = Object.entries(CSV_MAPPINGS).find(([key]) => file.includes(key));
    if (!mapping) {
      console.log(`Skipping: ${file}`);
      continue;
    }

    const [, { folder, processor }] = mapping;
    console.log(`Processing: ${file} -> ${folder}`);

    const content = readFileSync(join(CSV_DIR, file), "utf-8");
    const rows = parseCSV(content);

    if (rows.length < 2) {
      console.log(`  Skipped (no data rows)`);
      continue;
    }

    const items = processor(rows);
    console.log(`  Found ${items.length} entries`);

    // Write each item as a separate YAML file
    for (const item of items) {
      const entry = item as { id: string; name: string };
      if (!entry.id || entry.id === "-") continue;

      const yamlContent = stringify(item, { lineWidth: 120 });
      const filePath = join(DB_DIR, folder, `${entry.id}.yaml`);
      writeFileSync(filePath, yamlContent);
    }
  }

  console.log("\nConversion complete!");
}

main().catch(console.error);
