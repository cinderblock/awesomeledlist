/**
 * "Design my system" wizard logic: compatibility checks, power estimation,
 * and the shareable SVG diagram. Pure functions - no React.
 *
 * Power-warning thresholds follow the project guideline: above ~20W suggest
 * care, above ~200W strongly recommend consulting someone experienced.
 */

import type { Controller, Pixel, Range } from "@/lib/data";

/** Default full-white consumption when a pixel entry has no wattage data (typical 5050 RGB). */
export const DEFAULT_PIXEL_MW = 300;

/** Assumed PSU headroom factor for the recommendation. */
const PSU_HEADROOM = 1.25;

export const ADVISORY_WATTS = 20;
export const SERIOUS_WATTS = 200;

export interface PowerEstimate {
  /** mW per pixel used for the math */
  perPixelMw: number;
  /** true when DEFAULT_PIXEL_MW was used instead of entry data */
  estimated: boolean;
  totalWatts: number;
  /** supply voltage used for current math (pixel led_voltage, else 5) */
  volts: number;
  voltsKnown: boolean;
  amps: number;
  /** recommended PSU size with headroom, rounded up to a sane step */
  recommendedPsuWatts: number;
}

export type WarningLevel = "none" | "advisory" | "serious";

export interface CompatCheck {
  level: "ok" | "warn" | "error";
  message: string;
}

function ledVolts(pixel: Pixel): { volts: number; known: boolean } {
  const v = pixel.led_voltage;
  if (typeof v === "number") return { volts: v, known: true };
  if (v && typeof v === "object") return { volts: (v as Range).max, known: true };
  return { volts: 5, known: false };
}

export function estimatePower(pixel: Pixel, count: number): PowerEstimate {
  const perPixelMw = typeof pixel.wattage === "number" ? pixel.wattage : DEFAULT_PIXEL_MW;
  const estimated = typeof pixel.wattage !== "number";
  const totalWatts = (perPixelMw * count) / 1000;
  const { volts, known: voltsKnown } = ledVolts(pixel);
  const amps = totalWatts / volts;
  // Round the PSU suggestion up to a friendly size step
  const target = totalWatts * PSU_HEADROOM;
  const step = target <= 60 ? 10 : target <= 350 ? 25 : 100;
  const recommendedPsuWatts = Math.max(step, Math.ceil(target / step) * step);
  return { perPixelMw, estimated, totalWatts, volts, voltsKnown, amps, recommendedPsuWatts };
}

export function powerWarningLevel(totalWatts: number): WarningLevel {
  if (totalWatts > SERIOUS_WATTS) return "serious";
  if (totalWatts > ADVISORY_WATTS) return "advisory";
  return "none";
}

export function checkCompatibility(
  pixel: Pixel,
  controller: Controller,
  count: number
): CompatCheck[] {
  const checks: CompatCheck[] = [];

  // Data line type: async (single wire) vs clocked (data+clock)
  if (pixel.clocked == null) {
    checks.push({ level: "warn", message: `${pixel.name}: clocked/async type unverified in the database` });
  } else if (controller.pixel_types == null) {
    checks.push({ level: "warn", message: `${controller.name}: supported pixel types unverified in the database` });
  } else {
    const need = pixel.clocked ? "clocked" : "async";
    const ok = controller.pixel_types === "both" || controller.pixel_types === need;
    checks.push(
      ok
        ? { level: "ok", message: `Data type matches (${need} pixels, controller drives ${controller.pixel_types})` }
        : {
            level: "error",
            message: `${pixel.name} needs a ${need} data output but ${controller.name} only drives ${controller.pixel_types} pixels`,
          }
    );
  }

  // Pixel count vs controller capacity
  if (typeof controller.max_pixels === "number") {
    checks.push(
      count <= controller.max_pixels
        ? { level: "ok", message: `${count.toLocaleString()} pixels fits (controller max ${controller.max_pixels.toLocaleString()})` }
        : {
            level: "error",
            message: `${count.toLocaleString()} pixels exceeds the controller's ${controller.max_pixels.toLocaleString()}-pixel capacity`,
          }
    );
  } else {
    checks.push({ level: "warn", message: `${controller.name}: max pixel capacity unverified in the database` });
  }

  // Voltage: only meaningful when the string shares power with the controller
  const { volts, known } = ledVolts(pixel);
  if (known && typeof controller.max_voltage === "number") {
    checks.push(
      volts <= controller.max_voltage
        ? { level: "ok", message: `${volts}V pixels within the controller's ${controller.max_voltage}V limit` }
        : {
            level: "warn",
            message: `${volts}V pixels exceed the controller's ${controller.max_voltage}V limit - power the string separately (data-only to controller)`,
          }
    );
  }

  return checks;
}

/** Build a simple shareable system diagram. The wizard selection is embedded
 *  as JSON in <metadata>, draw.io-style, so the file carries its own source. */
export function buildDiagramSvg(opts: {
  pixel: Pixel;
  controller: Controller;
  count: number;
  power: PowerEstimate;
  shareUrl: string;
}): string {
  const { pixel, controller, count, power, shareUrl } = opts;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const config = esc(
    JSON.stringify({ generator: "awesomeledlist.com wizard", pixel: pixel.id, controller: controller.id, count, url: shareUrl })
  );
  const psuLabel = `${power.recommendedPsuWatts}W @ ${power.volts}V PSU`;
  const ctlLabel = esc(controller.name);
  const pixLabel = `${count.toLocaleString()} x ${esc(pixel.name)}`;
  const loadLabel = `${power.totalWatts.toFixed(1)}W / ${power.amps.toFixed(1)}A${power.estimated ? " (est.)" : ""}`;

  const box = (x: number, title: string, sub: string) => `
    <rect x="${x}" y="60" width="200" height="80" rx="10" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>
    <text x="${x + 100}" y="95" text-anchor="middle" font-weight="bold" font-size="14">${title}</text>
    <text x="${x + 100}" y="118" text-anchor="middle" font-size="12" fill="#475569">${sub}</text>`;
  const arrow = (x: number, label: string) => `
    <line x1="${x}" y1="100" x2="${x + 60}" y2="100" stroke="#334155" stroke-width="1.5" marker-end="url(#a)"/>
    <text x="${x + 30}" y="90" text-anchor="middle" font-size="10" fill="#475569">${label}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200" viewBox="0 0 800 200" font-family="system-ui, sans-serif">
  <metadata id="awesomeledlist-config">${config}</metadata>
  <defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#334155"/></marker></defs>
  <rect width="800" height="200" fill="white"/>
  ${box(20, "Power Supply", esc(psuLabel))}
  ${arrow(220, `${power.volts}V`)}
  ${box(280, ctlLabel, "controller")}
  ${arrow(480, "data")}
  ${box(540, "Pixels", `${pixLabel}`)}
  <text x="640" y="160" text-anchor="middle" font-size="11" fill="#475569">${esc(loadLabel)} at full white</text>
  <text x="400" y="188" text-anchor="middle" font-size="10" fill="#94a3b8">${esc(shareUrl)}</text>
</svg>`;
}
