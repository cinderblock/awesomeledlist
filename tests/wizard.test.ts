import { describe, expect, it } from "vitest";
import {
  ADVISORY_WATTS,
  DEFAULT_PIXEL_MW,
  SERIOUS_WATTS,
  checkCompatibility,
  estimatePower,
  powerWarningLevel,
} from "@/lib/wizard";
import type { Controller, Pixel } from "@/lib/data";

const pixel = (over: Partial<Pixel> = {}): Pixel =>
  ({
    id: "test-pixel",
    name: "TestPixel",
    wattage: 300,
    led_voltage: 5,
    clocked: false,
    ...over,
  }) as Pixel;

const controller = (over: Partial<Controller> = {}): Controller =>
  ({
    id: "test-controller",
    name: "TestController",
    pixel_types: "both",
    max_pixels: 1000,
    max_voltage: 24,
    ...over,
  }) as Controller;

describe("estimatePower", () => {
  it("computes watts and amps from per-pixel mW and voltage", () => {
    const p = estimatePower(pixel({ wattage: 300, led_voltage: 5 }), 100);
    expect(p.totalWatts).toBeCloseTo(30);
    expect(p.amps).toBeCloseTo(6);
    expect(p.estimated).toBe(false);
    expect(p.voltsKnown).toBe(true);
  });

  it("falls back to the default per-pixel estimate when wattage is missing", () => {
    const p = estimatePower(pixel({ wattage: null as unknown as number }), 10);
    expect(p.perPixelMw).toBe(DEFAULT_PIXEL_MW);
    expect(p.estimated).toBe(true);
  });

  it("uses the top of a voltage range and recommends PSU with headroom", () => {
    const p = estimatePower(pixel({ led_voltage: { min: 3, max: 7.5 } }), 100);
    expect(p.volts).toBe(7.5);
    expect(p.recommendedPsuWatts).toBeGreaterThanOrEqual(p.totalWatts * 1.25);
  });
});

describe("powerWarningLevel", () => {
  it("matches the project thresholds (>20W advisory, >200W serious)", () => {
    expect(powerWarningLevel(ADVISORY_WATTS)).toBe("none");
    expect(powerWarningLevel(ADVISORY_WATTS + 1)).toBe("advisory");
    expect(powerWarningLevel(SERIOUS_WATTS)).toBe("advisory");
    expect(powerWarningLevel(SERIOUS_WATTS + 1)).toBe("serious");
  });
});

describe("checkCompatibility", () => {
  it("passes a matching async pixel/controller pair", () => {
    const checks = checkCompatibility(pixel(), controller({ pixel_types: "async" }), 500);
    expect(checks.some((c) => c.level === "error")).toBe(false);
  });

  it("rejects clocked pixels on an async-only controller", () => {
    const checks = checkCompatibility(
      pixel({ clocked: true }),
      controller({ pixel_types: "async" }),
      10
    );
    expect(checks.some((c) => c.level === "error" && /clocked/.test(c.message))).toBe(true);
  });

  it("rejects pixel counts beyond controller capacity", () => {
    const checks = checkCompatibility(pixel(), controller({ max_pixels: 100 }), 101);
    expect(checks.some((c) => c.level === "error" && /capacity/.test(c.message))).toBe(true);
  });

  it("warns instead of guessing when data is missing", () => {
    const checks = checkCompatibility(
      pixel({ clocked: null }),
      controller({ max_pixels: null }),
      10
    );
    expect(checks.every((c) => c.level !== "error")).toBe(true);
    expect(checks.filter((c) => c.level === "warn").length).toBeGreaterThanOrEqual(2);
  });

  it("warns when pixel voltage exceeds the controller limit", () => {
    const checks = checkCompatibility(
      pixel({ led_voltage: 12 }),
      controller({ max_voltage: 5 }),
      10
    );
    expect(checks.some((c) => c.level === "warn" && /separately/.test(c.message))).toBe(true);
  });
});
