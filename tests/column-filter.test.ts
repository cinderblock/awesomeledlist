import { describe, test, expect } from "vitest";
import {
  analyzeColumn,
  applyColumnFilters,
  parseColumnFiltersFromURL,
  serializeColumnFiltersToURL,
  parseRangeFiltersFromURL,
  serializeRangeFiltersToURL,
  type RangeFilterValue,
} from "../src/components/data/ColumnFilter";
import type { BaseEntry } from "../src/lib/data";

// Helper to create test data
function createEntry(id: string, props: Record<string, unknown>): BaseEntry {
  return { id, name: `Entry ${id}`, ...props };
}

describe("analyzeColumn", () => {
  describe("boolean columns", () => {
    test("detects boolean column with true/false values", () => {
      const data = [
        createEntry("1", { active: true }),
        createEntry("2", { active: false }),
        createEntry("3", { active: true }),
      ];
      const result = analyzeColumn(data, "active");
      expect(result).not.toBeNull();
      expect(result!.type).toBe("boolean");
      expect(result!.values).toEqual(["Yes", "No"]);
    });

    test("returns null for all-true boolean column", () => {
      const data = [
        createEntry("1", { active: true }),
        createEntry("2", { active: true }),
      ];
      const result = analyzeColumn(data, "active");
      expect(result).toBeNull(); // Only one unique value
    });
  });

  describe("multiselect columns", () => {
    test("extracts unique string values", () => {
      const data = [
        createEntry("1", { status: "active" }),
        createEntry("2", { status: "discontinued" }),
        createEntry("3", { status: "active" }),
      ];
      const result = analyzeColumn(data, "status");
      expect(result).not.toBeNull();
      expect(result!.type).toBe("multiselect");
      expect(result!.values).toContain("active");
      expect(result!.values).toContain("discontinued");
    });

    test("extracts values from arrays", () => {
      const data = [
        createEntry("1", { interfaces: ["WiFi", "Ethernet"] }),
        createEntry("2", { interfaces: ["USB"] }),
        createEntry("3", { interfaces: ["WiFi", "Bluetooth"] }),
      ];
      const result = analyzeColumn(data, "interfaces");
      expect(result).not.toBeNull();
      expect(result!.type).toBe("multiselect");
      expect(result!.values).toContain("WiFi");
      expect(result!.values).toContain("Ethernet");
      expect(result!.values).toContain("USB");
      expect(result!.values).toContain("Bluetooth");
    });

    test("normalizes and splits slash-separated values", () => {
      const data = [
        createEntry("1", { package_size: "SOP8/SOP16" }),
        createEntry("2", { package_size: "QFN16" }),
      ];
      const result = analyzeColumn(data, "package_size");
      expect(result).not.toBeNull();
      expect(result!.values).toContain("SOP8");
      expect(result!.values).toContain("SOP16");
      expect(result!.values).toContain("QFN16");
    });

    test("expands abbreviated slash-separated values", () => {
      const data = [
        createEntry("1", { package_size: "SOP8/10/14" }),
      ];
      const result = analyzeColumn(data, "package_size");
      expect(result).not.toBeNull();
      expect(result!.values).toContain("SOP8");
      expect(result!.values).toContain("SOP10");
      expect(result!.values).toContain("SOP14");
    });

    test("sorts values with units correctly", () => {
      const data = [
        createEntry("1", { frequency: "1MHz" }),
        createEntry("2", { frequency: "800kHz" }),
        createEntry("3", { frequency: "2MHz" }),
      ];
      const result = analyzeColumn(data, "frequency");
      expect(result).not.toBeNull();
      // 800kHz < 1MHz < 2MHz
      expect(result!.values).toEqual(["800kHz", "1MHz", "2MHz"]);
    });
  });

  describe("range columns", () => {
    test("detects numeric column for range filter", () => {
      const data = Array.from({ length: 15 }, (_, i) =>
        createEntry(String(i), { max_pixels: (i + 1) * 100 })
      );
      const result = analyzeColumn(data, "max_pixels");
      expect(result).not.toBeNull();
      expect(result!.type).toBe("range");
      expect(result!.min).toBe(100);
      expect(result!.max).toBe(1500);
    });
  });

  describe("edge cases", () => {
    test("returns null for all null values", () => {
      const data = [
        createEntry("1", { field: null }),
        createEntry("2", { field: null }),
      ];
      const result = analyzeColumn(data, "field");
      expect(result).toBeNull();
    });

    test("returns null for single unique value", () => {
      const data = [
        createEntry("1", { status: "active" }),
        createEntry("2", { status: "active" }),
      ];
      const result = analyzeColumn(data, "status");
      expect(result).toBeNull();
    });

    test("handles missing field", () => {
      const data = [
        createEntry("1", {}),
        createEntry("2", {}),
      ];
      const result = analyzeColumn(data, "missing");
      expect(result).toBeNull();
    });
  });
});

describe("applyColumnFilters", () => {
  describe("basic filtering", () => {
    test("filters by string value", () => {
      const data = [
        createEntry("1", { status: "active" }),
        createEntry("2", { status: "discontinued" }),
        createEntry("3", { status: "active" }),
      ];
      const result = applyColumnFilters(data, { status: ["active"] });
      expect(result.map((r) => r.id)).toEqual(["1", "3"]);
    });

    test("filters by multiple values (OR logic)", () => {
      const data = [
        createEntry("1", { status: "active" }),
        createEntry("2", { status: "discontinued" }),
        createEntry("3", { status: "unknown" }),
      ];
      const result = applyColumnFilters(data, { status: ["active", "discontinued"] });
      expect(result.map((r) => r.id)).toEqual(["1", "2"]);
    });

    test("filters by boolean as Yes/No", () => {
      const data = [
        createEntry("1", { wled_compatible: true }),
        createEntry("2", { wled_compatible: false }),
        createEntry("3", { wled_compatible: true }),
      ];
      const result = applyColumnFilters(data, { wled_compatible: ["Yes"] });
      expect(result.map((r) => r.id)).toEqual(["1", "3"]);
    });
  });

  describe("array field filtering", () => {
    test("filters array fields", () => {
      const data = [
        createEntry("1", { interfaces: ["WiFi", "Ethernet"] }),
        createEntry("2", { interfaces: ["USB"] }),
        createEntry("3", { interfaces: ["WiFi", "Bluetooth"] }),
      ];
      const result = applyColumnFilters(data, { interfaces: ["WiFi"] });
      expect(result.map((r) => r.id)).toEqual(["1", "3"]);
    });

    test("filters array fields with multiple filter values", () => {
      const data = [
        createEntry("1", { interfaces: ["WiFi"] }),
        createEntry("2", { interfaces: ["USB"] }),
        createEntry("3", { interfaces: ["Bluetooth"] }),
      ];
      const result = applyColumnFilters(data, { interfaces: ["WiFi", "Bluetooth"] });
      expect(result.map((r) => r.id)).toEqual(["1", "3"]);
    });
  });

  describe("normalized value filtering", () => {
    test("matches split values", () => {
      const data = [
        createEntry("1", { package_size: "SOP8/SOP16" }),
        createEntry("2", { package_size: "QFN16" }),
        createEntry("3", { package_size: "SOP8" }),
      ];
      const result = applyColumnFilters(data, { package_size: ["SOP8"] });
      expect(result.map((r) => r.id)).toEqual(["1", "3"]);
    });

    test("case insensitive matching", () => {
      const data = [
        createEntry("1", { status: "Active" }),
        createEntry("2", { status: "ACTIVE" }),
        createEntry("3", { status: "discontinued" }),
      ];
      const result = applyColumnFilters(data, { status: ["active"] });
      expect(result.map((r) => r.id)).toEqual(["1", "2"]);
    });
  });

  describe("range filtering", () => {
    test("filters by min value", () => {
      const data = [
        createEntry("1", { max_pixels: 100 }),
        createEntry("2", { max_pixels: 500 }),
        createEntry("3", { max_pixels: 1000 }),
      ];
      const rangeFilters: Record<string, RangeFilterValue | null> = {
        max_pixels: { min: 500, max: null },
      };
      const result = applyColumnFilters(data, {}, rangeFilters);
      expect(result.map((r) => r.id)).toEqual(["2", "3"]);
    });

    test("filters by max value", () => {
      const data = [
        createEntry("1", { max_pixels: 100 }),
        createEntry("2", { max_pixels: 500 }),
        createEntry("3", { max_pixels: 1000 }),
      ];
      const rangeFilters: Record<string, RangeFilterValue | null> = {
        max_pixels: { min: null, max: 500 },
      };
      const result = applyColumnFilters(data, {}, rangeFilters);
      expect(result.map((r) => r.id)).toEqual(["1", "2"]);
    });

    test("filters by min and max value", () => {
      const data = [
        createEntry("1", { max_pixels: 100 }),
        createEntry("2", { max_pixels: 500 }),
        createEntry("3", { max_pixels: 1000 }),
      ];
      const rangeFilters: Record<string, RangeFilterValue | null> = {
        max_pixels: { min: 200, max: 800 },
      };
      const result = applyColumnFilters(data, {}, rangeFilters);
      expect(result.map((r) => r.id)).toEqual(["2"]);
    });

    test("excludes null values in range filter", () => {
      const data = [
        createEntry("1", { max_pixels: 500 }),
        createEntry("2", { max_pixels: null }),
      ];
      const rangeFilters: Record<string, RangeFilterValue | null> = {
        max_pixels: { min: 100, max: null },
      };
      const result = applyColumnFilters(data, {}, rangeFilters);
      expect(result.map((r) => r.id)).toEqual(["1"]);
    });
  });

  describe("combined filtering", () => {
    test("combines multiple column filters (AND logic)", () => {
      const data = [
        createEntry("1", { status: "active", wled_compatible: true }),
        createEntry("2", { status: "active", wled_compatible: false }),
        createEntry("3", { status: "discontinued", wled_compatible: true }),
      ];
      const result = applyColumnFilters(data, {
        status: ["active"],
        wled_compatible: ["Yes"],
      });
      expect(result.map((r) => r.id)).toEqual(["1"]);
    });

    test("combines regular and range filters", () => {
      const data = [
        createEntry("1", { status: "active", max_pixels: 100 }),
        createEntry("2", { status: "active", max_pixels: 1000 }),
        createEntry("3", { status: "discontinued", max_pixels: 1000 }),
      ];
      const rangeFilters: Record<string, RangeFilterValue | null> = {
        max_pixels: { min: 500, max: null },
      };
      const result = applyColumnFilters(data, { status: ["active"] }, rangeFilters);
      expect(result.map((r) => r.id)).toEqual(["2"]);
    });
  });

  describe("edge cases", () => {
    test("empty filter returns all data", () => {
      const data = [
        createEntry("1", { status: "active" }),
        createEntry("2", { status: "discontinued" }),
      ];
      const result = applyColumnFilters(data, {});
      expect(result.length).toBe(2);
    });

    test("null filter value returns all data", () => {
      const data = [
        createEntry("1", { status: "active" }),
        createEntry("2", { status: "discontinued" }),
      ];
      const result = applyColumnFilters(data, { status: null });
      expect(result.length).toBe(2);
    });

    test("empty array filter returns all data", () => {
      const data = [
        createEntry("1", { status: "active" }),
        createEntry("2", { status: "discontinued" }),
      ];
      const result = applyColumnFilters(data, { status: [] });
      expect(result.length).toBe(2);
    });
  });
});

describe("parseColumnFiltersFromURL", () => {
  test("parses single filter", () => {
    const params = new URLSearchParams("f_status=active");
    const result = parseColumnFiltersFromURL(params, ["status"]);
    expect(result.status).toEqual(["active"]);
  });

  test("parses comma-separated values", () => {
    const params = new URLSearchParams("f_status=active,discontinued");
    const result = parseColumnFiltersFromURL(params, ["status"]);
    expect(result.status).toEqual(["active", "discontinued"]);
  });

  test("parses multiple filters", () => {
    const params = new URLSearchParams("f_status=active&f_manufacturer=Advatek");
    const result = parseColumnFiltersFromURL(params, ["status", "manufacturer"]);
    expect(result.status).toEqual(["active"]);
    expect(result.manufacturer).toEqual(["Advatek"]);
  });

  test("ignores params not in column keys", () => {
    const params = new URLSearchParams("f_status=active&f_other=value");
    const result = parseColumnFiltersFromURL(params, ["status"]);
    expect(result.status).toEqual(["active"]);
    expect(result.other).toBeUndefined();
  });

  test("ignores params without f_ prefix", () => {
    const params = new URLSearchParams("status=active");
    const result = parseColumnFiltersFromURL(params, ["status"]);
    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe("serializeColumnFiltersToURL", () => {
  test("serializes single filter", () => {
    const result = serializeColumnFiltersToURL({ status: ["active"] });
    expect(result.f_status).toBe("active");
  });

  test("serializes multiple values as comma-separated", () => {
    const result = serializeColumnFiltersToURL({ status: ["active", "discontinued"] });
    expect(result.f_status).toBe("active,discontinued");
  });

  test("serializes multiple filters", () => {
    const result = serializeColumnFiltersToURL({
      status: ["active"],
      manufacturer: ["Advatek"],
    });
    expect(result.f_status).toBe("active");
    expect(result.f_manufacturer).toBe("Advatek");
  });

  test("returns null for empty array", () => {
    const result = serializeColumnFiltersToURL({ status: [] });
    expect(result.f_status).toBeNull();
  });

  test("returns null for null value", () => {
    const result = serializeColumnFiltersToURL({ status: null });
    expect(result.f_status).toBeNull();
  });
});

describe("parseRangeFiltersFromURL", () => {
  test("parses min and max", () => {
    const params = new URLSearchParams("r_max_pixels=100,1000");
    const result = parseRangeFiltersFromURL(params, ["max_pixels"]);
    expect(result.max_pixels).toEqual({ min: 100, max: 1000 });
  });

  test("parses min only", () => {
    const params = new URLSearchParams("r_max_pixels=100,");
    const result = parseRangeFiltersFromURL(params, ["max_pixels"]);
    expect(result.max_pixels).toEqual({ min: 100, max: null });
  });

  test("parses max only", () => {
    const params = new URLSearchParams("r_max_pixels=,1000");
    const result = parseRangeFiltersFromURL(params, ["max_pixels"]);
    expect(result.max_pixels).toEqual({ min: null, max: 1000 });
  });

  test("ignores params not in column keys", () => {
    const params = new URLSearchParams("r_max_pixels=100,1000&r_other=0,10");
    const result = parseRangeFiltersFromURL(params, ["max_pixels"]);
    expect(result.max_pixels).toEqual({ min: 100, max: 1000 });
    expect(result.other).toBeUndefined();
  });

  test("handles invalid numbers as null", () => {
    const params = new URLSearchParams("r_max_pixels=abc,def");
    const result = parseRangeFiltersFromURL(params, ["max_pixels"]);
    // Invalid strings parse to NaN initially, but NaN !== null is true so filter entry is created
    // The NaN values are then converted to null in the final object
    expect(result.max_pixels).toEqual({ min: null, max: null });
  });
});

describe("serializeRangeFiltersToURL", () => {
  test("serializes min and max", () => {
    const result = serializeRangeFiltersToURL({ max_pixels: { min: 100, max: 1000 } });
    expect(result.r_max_pixels).toBe("100,1000");
  });

  test("serializes min only", () => {
    const result = serializeRangeFiltersToURL({ max_pixels: { min: 100, max: null } });
    expect(result.r_max_pixels).toBe("100,");
  });

  test("serializes max only", () => {
    const result = serializeRangeFiltersToURL({ max_pixels: { min: null, max: 1000 } });
    expect(result.r_max_pixels).toBe(",1000");
  });

  test("returns null for null range", () => {
    const result = serializeRangeFiltersToURL({ max_pixels: null });
    expect(result.r_max_pixels).toBeNull();
  });

  test("returns null for both min and max null", () => {
    const result = serializeRangeFiltersToURL({ max_pixels: { min: null, max: null } });
    expect(result.r_max_pixels).toBeNull();
  });
});
