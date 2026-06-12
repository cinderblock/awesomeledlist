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
  /** Optional in-app link with more help (e.g. a suggested part) */
  link?: { to: string; label: string };
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

/** Max amps a single power feed should carry before injecting elsewhere. */
export const FEED_AMPS = 10;

/**
 * How many pixels one power feed can serve before exceeding FEED_AMPS,
 * or null when a single feed handles the whole run.
 */
export function injectionIntervalPx(power: PowerEstimate): number | null {
  if (power.amps <= FEED_AMPS) return null;
  return Math.max(1, Math.floor((FEED_AMPS * power.volts * 1000) / power.perPixelMw));
}

export interface ControllerRanking {
  compatible: Controller[];
  other: Controller[];
}

/** Split controllers into hard-compatible vs the rest for the chosen pixel/count. */
export function rankControllers(
  pixel: Pixel,
  count: number,
  controllers: Controller[]
): ControllerRanking {
  const compatible: Controller[] = [];
  const other: Controller[] = [];
  for (const c of controllers) {
    const hasError = checkCompatibility(pixel, c, count).some((r) => r.level === "error");
    (hasError ? other : compatible).push(c);
  }
  return { compatible, other };
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

  // Logic level: pixels whose input-high threshold sits above 3.3V need
  // 5V-level data; buffered controllers provide it, otherwise suggest a shifter
  if (typeof pixel.gpio_min === "number" && pixel.gpio_min > 3.3) {
    if (controller.buffered === true) {
      checks.push({
        level: "ok",
        message: `Data level fine: ${pixel.name} needs >${pixel.gpio_min}V data and the controller has buffered (5V) outputs`,
      });
    } else {
      checks.push({
        level: "warn",
        message: `${pixel.name} needs data above ${pixel.gpio_min}V - if the controller's outputs are unbuffered 3.3V, add a level shifter`,
        link: { to: "/level-converters/sn74ahct125", label: "74AHCT125" },
      });
    }
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

/** Build a shareable system diagram reflecting the recommended topology:
 *  optional level shifter between controller and pixels, and dashed power
 *  injection feeds when one feed can't carry the load. The wizard selection
 *  is embedded as JSON in <metadata>, draw.io-style, so the file carries
 *  its own source. */
export function buildDiagramSvg(opts: {
  pixel: Pixel;
  controller: Controller;
  count: number;
  power: PowerEstimate;
  shareUrl: string;
  needsShifter?: boolean;
  injectEvery?: number | null;
}): string {
  const { pixel, controller, count, power, shareUrl, needsShifter = false, injectEvery = null } = opts;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const config = esc(
    JSON.stringify({
      generator: "awesomeledlist.com wizard",
      pixel: pixel.id,
      controller: controller.id,
      count,
      needsShifter,
      injectEvery,
      url: shareUrl,
    })
  );
  const psuLabel = `${power.recommendedPsuWatts}W @ ${power.volts}V PSU`;
  const loadLabel = `${power.totalWatts.toFixed(1)}W / ${power.amps.toFixed(1)}A${power.estimated ? " (est.)" : ""} at full white`;

  // Horizontal layout: boxes and arrows sized to fit the optional shifter
  const BOX_W = needsShifter ? 180 : 200;
  const GAP = needsShifter ? 50 : 60;
  const stages: { title: string; sub: string; arrowLabel?: string }[] = [
    { title: "Power Supply", sub: psuLabel },
    { title: controller.name, sub: "controller", arrowLabel: `${power.volts}V` },
    ...(needsShifter
      ? [{ title: "Level Shifter", sub: "e.g. 74AHCT125", arrowLabel: "3.3V data" }]
      : []),
    {
      title: "Pixels",
      sub: `${count.toLocaleString()} x ${pixel.name}`,
      arrowLabel: needsShifter ? "5V data" : "data",
    },
  ];
  const width = 20 * 2 + stages.length * BOX_W + (stages.length - 1) * GAP;

  let x = 20;
  let body = "";
  let pixelBoxX = 0;
  for (const [i, s] of stages.entries()) {
    if (i > 0) {
      body += `
  <line x1="${x - GAP}" y1="100" x2="${x - 4}" y2="100" stroke="#334155" stroke-width="1.5" marker-end="url(#a)"/>
  <text x="${x - GAP / 2 - 2}" y="90" text-anchor="middle" font-size="10" fill="#475569">${esc(s.arrowLabel ?? "")}</text>`;
    }
    body += `
  <rect x="${x}" y="60" width="${BOX_W}" height="80" rx="10" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>
  <text x="${x + BOX_W / 2}" y="95" text-anchor="middle" font-weight="bold" font-size="14">${esc(s.title)}</text>
  <text x="${x + BOX_W / 2}" y="118" text-anchor="middle" font-size="12" fill="#475569">${esc(s.sub)}</text>`;
    if (s.title === "Pixels") pixelBoxX = x;
    x += BOX_W + GAP;
  }

  // Dashed injection feed from the PSU under the row into the pixel box
  if (injectEvery != null) {
    const psuMidX = 20 + BOX_W / 2;
    const pixMidX = pixelBoxX + BOX_W / 2;
    body += `
  <path d="M ${psuMidX} 140 L ${psuMidX} 165 L ${pixMidX} 165 L ${pixMidX} 144" fill="none" stroke="#b45309" stroke-width="1.5" stroke-dasharray="6 4" marker-end="url(#b)"/>
  <text x="${(psuMidX + pixMidX) / 2}" y="160" text-anchor="middle" font-size="10" fill="#b45309">power feed every ~${injectEvery.toLocaleString()} px (max ${FEED_AMPS}A per feed)</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="210" viewBox="0 0 ${width} 210" font-family="system-ui, sans-serif">
  <metadata id="awesomeledlist-config">${config}</metadata>
  <defs>
    <marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#334155"/></marker>
    <marker id="b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b45309"/></marker>
  </defs>
  <rect width="${width}" height="210" fill="white"/>${body}
  <text x="${width - 20}" y="40" text-anchor="end" font-size="11" fill="#475569">${esc(loadLabel)}</text>
  <text x="${width / 2}" y="200" text-anchor="middle" font-size="10" fill="#94a3b8">${esc(shareUrl)}</text>
</svg>`;
}
