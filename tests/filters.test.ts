import { describe, test, expect } from "vitest";
import {
  extractUniqueValues,
  applyFilters,
  parseFiltersFromURL,
  serializeFiltersToURL,
  type FilterConfig,
  type FilterValues,
} from "../src/lib/filters";

describe("extractUniqueValues", () => {
  test("extracts unique string values", () => {
    const data = [
      { manufacturer: "Advatek" },
      { manufacturer: "QuinLED" },
      { manufacturer: "Advatek" },
      { manufacturer: "WLED" },
    ];
    const result = extractUniqueValues(data, "manufacturer");
    expect(result).toEqual(["Advatek", "QuinLED", "WLED"]);
  });

  test("extracts unique values from arrays", () => {
    const data = [
      { interfaces: ["WiFi", "Ethernet"] },
      { interfaces: ["USB", "WiFi"] },
      { interfaces: ["Bluetooth"] },
    ];
    const result = extractUniqueValues(data, "interfaces");
    expect(result).toEqual(["Bluetooth", "Ethernet", "USB", "WiFi"]);
  });

  test("handles null and undefined values", () => {
    const data = [
      { manufacturer: "Advatek" },
      { manufacturer: null },
      { manufacturer: undefined },
      { manufacturer: "QuinLED" },
    ];
    const result = extractUniqueValues(data, "manufacturer");
    expect(result).toEqual(["Advatek", "QuinLED"]);
  });

  test("handles empty strings", () => {
    const data = [
      { manufacturer: "Advatek" },
      { manufacturer: "" },
      { manufacturer: "   " },
      { manufacturer: "QuinLED" },
    ];
    const result = extractUniqueValues(data, "manufacturer");
    expect(result).toEqual(["Advatek", "QuinLED"]);
  });

  test("handles missing field", () => {
    const data = [{ name: "Test1" }, { name: "Test2" }];
    const result = extractUniqueValues(data, "manufacturer");
    expect(result).toEqual([]);
  });

  test("returns sorted results", () => {
    const data = [
      { manufacturer: "Zebra" },
      { manufacturer: "Alpha" },
      { manufacturer: "Middle" },
    ];
    const result = extractUniqueValues(data, "manufacturer");
    expect(result).toEqual(["Alpha", "Middle", "Zebra"]);
  });
});

describe("applyFilters", () => {
  const booleanConfig: FilterConfig[] = [
    { key: "wled_compatible", label: "WLED Compatible", type: "boolean" },
  ];

  const selectConfig: FilterConfig[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["active", "discontinued"],
    },
  ];

  const multiselectConfig: FilterConfig[] = [
    { key: "interfaces", label: "Interfaces", type: "multiselect" },
  ];

  test("boolean filter - true shows only matching items", () => {
    const data = [
      { id: "1", wled_compatible: true },
      { id: "2", wled_compatible: false },
      { id: "3", wled_compatible: true },
    ];
    const filters: FilterValues = { wled_compatible: true };
    const result = applyFilters(data, filters, booleanConfig);
    expect(result.map((r) => r.id)).toEqual(["1", "3"]);
  });

  test("boolean filter - false does not filter", () => {
    const data = [
      { id: "1", wled_compatible: true },
      { id: "2", wled_compatible: false },
    ];
    const filters: FilterValues = { wled_compatible: false };
    const result = applyFilters(data, filters, booleanConfig);
    expect(result.length).toBe(2);
  });

  test("boolean filter - null does not filter", () => {
    const data = [
      { id: "1", wled_compatible: true },
      { id: "2", wled_compatible: false },
    ];
    const filters: FilterValues = { wled_compatible: null };
    const result = applyFilters(data, filters, booleanConfig);
    expect(result.length).toBe(2);
  });

  test("select filter - matches exact value (case insensitive)", () => {
    const data = [
      { id: "1", status: "active" },
      { id: "2", status: "discontinued" },
      { id: "3", status: "Active" },
    ];
    const filters: FilterValues = { status: "active" };
    const result = applyFilters(data, filters, selectConfig);
    expect(result.map((r) => r.id)).toEqual(["1", "3"]);
  });

  test("select filter - empty string does not filter", () => {
    const data = [
      { id: "1", status: "active" },
      { id: "2", status: "discontinued" },
    ];
    const filters: FilterValues = { status: "" };
    const result = applyFilters(data, filters, selectConfig);
    expect(result.length).toBe(2);
  });

  test("multiselect filter - matches any value in array field", () => {
    const data = [
      { id: "1", interfaces: ["WiFi", "Ethernet"] },
      { id: "2", interfaces: ["USB"] },
      { id: "3", interfaces: ["WiFi", "Bluetooth"] },
    ];
    const filters: FilterValues = { interfaces: ["WiFi"] };
    const result = applyFilters(data, filters, multiselectConfig);
    expect(result.map((r) => r.id)).toEqual(["1", "3"]);
  });

  test("multiselect filter - matches multiple filter values (OR logic)", () => {
    const data = [
      { id: "1", interfaces: ["WiFi"] },
      { id: "2", interfaces: ["USB"] },
      { id: "3", interfaces: ["Bluetooth"] },
    ];
    const filters: FilterValues = { interfaces: ["WiFi", "USB"] };
    const result = applyFilters(data, filters, multiselectConfig);
    expect(result.map((r) => r.id)).toEqual(["1", "2"]);
  });

  test("multiselect filter - matches string field", () => {
    const data = [
      { id: "1", interfaces: "WiFi" },
      { id: "2", interfaces: "USB" },
    ];
    const filters: FilterValues = { interfaces: ["WiFi"] };
    const result = applyFilters(data, filters, multiselectConfig);
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  test("multiselect filter - case insensitive matching", () => {
    const data = [
      { id: "1", interfaces: ["WIFI"] },
      { id: "2", interfaces: ["wifi"] },
    ];
    const filters: FilterValues = { interfaces: ["WiFi"] };
    const result = applyFilters(data, filters, multiselectConfig);
    expect(result.map((r) => r.id)).toEqual(["1", "2"]);
  });

  test("multiselect filter - empty array does not filter", () => {
    const data = [
      { id: "1", interfaces: ["WiFi"] },
      { id: "2", interfaces: ["USB"] },
    ];
    const filters: FilterValues = { interfaces: [] };
    const result = applyFilters(data, filters, multiselectConfig);
    expect(result.length).toBe(2);
  });

  test("multiple filters - combines with AND logic", () => {
    const combinedConfig: FilterConfig[] = [...booleanConfig, ...multiselectConfig];
    const data = [
      { id: "1", wled_compatible: true, interfaces: ["WiFi"] },
      { id: "2", wled_compatible: true, interfaces: ["USB"] },
      { id: "3", wled_compatible: false, interfaces: ["WiFi"] },
    ];
    const filters: FilterValues = { wled_compatible: true, interfaces: ["WiFi"] };
    const result = applyFilters(data, filters, combinedConfig);
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });
});

describe("parseFiltersFromURL", () => {
  const configs: FilterConfig[] = [
    { key: "wled_compatible", label: "WLED", type: "boolean" },
    { key: "status", label: "Status", type: "select" },
    { key: "interfaces", label: "Interfaces", type: "multiselect" },
  ];

  test("parses boolean filter", () => {
    const params = new URLSearchParams("wled_compatible=true");
    const result = parseFiltersFromURL(params, configs);
    expect(result.wled_compatible).toBe(true);
  });

  test("parses boolean false", () => {
    const params = new URLSearchParams("wled_compatible=false");
    const result = parseFiltersFromURL(params, configs);
    expect(result.wled_compatible).toBe(false);
  });

  test("parses select filter", () => {
    const params = new URLSearchParams("status=active");
    const result = parseFiltersFromURL(params, configs);
    expect(result.status).toBe("active");
  });

  test("parses multiselect filter", () => {
    const params = new URLSearchParams("interfaces=WiFi,Ethernet,USB");
    const result = parseFiltersFromURL(params, configs);
    expect(result.interfaces).toEqual(["WiFi", "Ethernet", "USB"]);
  });

  test("parses multiple filters", () => {
    const params = new URLSearchParams("wled_compatible=true&status=active&interfaces=WiFi");
    const result = parseFiltersFromURL(params, configs);
    expect(result.wled_compatible).toBe(true);
    expect(result.status).toBe("active");
    expect(result.interfaces).toEqual(["WiFi"]);
  });

  test("ignores unknown params", () => {
    const params = new URLSearchParams("unknown=value&wled_compatible=true");
    const result = parseFiltersFromURL(params, configs);
    expect(result.wled_compatible).toBe(true);
    expect(result.unknown).toBeUndefined();
  });

  test("returns empty object for no matching params", () => {
    const params = new URLSearchParams("foo=bar");
    const result = parseFiltersFromURL(params, configs);
    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe("serializeFiltersToURL", () => {
  test("serializes boolean true", () => {
    const result = serializeFiltersToURL({ wled_compatible: true });
    expect(result.wled_compatible).toBe("true");
  });

  test("serializes boolean false as null", () => {
    const result = serializeFiltersToURL({ wled_compatible: false });
    expect(result.wled_compatible).toBeNull();
  });

  test("serializes string value", () => {
    const result = serializeFiltersToURL({ status: "active" });
    expect(result.status).toBe("active");
  });

  test("serializes empty string as null", () => {
    const result = serializeFiltersToURL({ status: "" });
    expect(result.status).toBeNull();
  });

  test("serializes array as comma-separated", () => {
    const result = serializeFiltersToURL({ interfaces: ["WiFi", "Ethernet"] });
    expect(result.interfaces).toBe("WiFi,Ethernet");
  });

  test("serializes empty array as null", () => {
    const result = serializeFiltersToURL({ interfaces: [] });
    expect(result.interfaces).toBeNull();
  });

  test("serializes null value as null", () => {
    const result = serializeFiltersToURL({ status: null });
    expect(result.status).toBeNull();
  });

  test("handles multiple filters", () => {
    const result = serializeFiltersToURL({
      wled_compatible: true,
      status: "active",
      interfaces: ["WiFi"],
    });
    expect(result.wled_compatible).toBe("true");
    expect(result.status).toBe("active");
    expect(result.interfaces).toBe("WiFi");
  });
});
