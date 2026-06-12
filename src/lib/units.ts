/**
 * Units for numeric database fields.
 *
 * The JSON Schemas in database/_schema annotate numeric fields with a custom
 * "unit" keyword (e.g. `"unit": "V"`). Data files store bare numbers in that
 * canonical unit; the UI appends the unit at render time. This keeps the
 * schema as the single source of truth for what a number means.
 */

interface SchemaProperty {
  unit?: string;
}

interface SchemaDoc {
  properties?: Record<string, SchemaProperty>;
}

// Schema filename stem -> category id (matches FOLDER_SCHEMAS in scripts/validate.ts)
const SCHEMA_TO_CATEGORY: Record<string, string> = {
  controller: "controllers",
  pixel: "pixels",
  "pixel-ic": "pixel-ics",
  "pattern-driver": "pattern-drivers",
  connector: "connectors",
  microboard: "microboards",
  "level-converter": "level-converters",
  adapter: "adapters",
  "drive-library": "drive-libraries",
  "pixel-decoder": "pixel-decoders",
  "diffusive-material": "diffusive-materials",
  "commercial-system": "commercial-systems",
};

const modules = import.meta.glob<{ default: SchemaDoc }>(
  "../../database/_schema/*.json",
  { eager: true }
);

const unitsByCategory: Record<string, Record<string, string>> = {};

for (const [path, mod] of Object.entries(modules)) {
  const stem = path.split("/").pop()!.replace(/\.json$/, "");
  const categoryId = SCHEMA_TO_CATEGORY[stem];
  if (!categoryId) continue;

  const units: Record<string, string> = {};
  for (const [key, prop] of Object.entries(mod.default.properties ?? {})) {
    if (prop && typeof prop.unit === "string") {
      units[key] = prop.unit;
    }
  }
  unitsByCategory[categoryId] = units;
}

/** Canonical unit for a field, per the category's JSON Schema. */
export function getUnit(categoryId: string, fieldKey: string): string | undefined {
  return unitsByCategory[categoryId]?.[fieldKey];
}

// Display-time unit ladders: data stays in the canonical unit; large values
// climb to a friendlier prefix (1048576 kB -> 1 GB, 1500 MHz -> 1.5 GHz).
const LADDERS: Record<string, { factor: number; units: string[] }> = {
  kB: { factor: 1024, units: ["kB", "MB", "GB", "TB"] },
  MHz: { factor: 1000, units: ["MHz", "GHz"] },
  kHz: { factor: 1000, units: ["kHz", "MHz", "GHz"] },
  mA: { factor: 1000, units: ["mA", "A"] },
  mW: { factor: 1000, units: ["mW", "W"] },
};

/** Humanize a canonical-unit value for display (returns value/unit unchanged when no ladder applies). */
export function humanizeQuantity(value: number, unit: string): { value: number; unit: string } {
  const ladder = LADDERS[unit];
  if (!ladder) return { value, unit };
  let v = value;
  let i = 0;
  while (i < ladder.units.length - 1 && Math.abs(v) >= ladder.factor) {
    v /= ladder.factor;
    i++;
  }
  // Avoid noisy fractions from binary conversions (e.g. 7936 kB -> 7.75 MB)
  return { value: Math.round(v * 100) / 100, unit: ladder.units[i]! };
}
