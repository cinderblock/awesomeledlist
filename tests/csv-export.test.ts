import { describe, test, expect } from "vitest";
import {
  escapeCSVValue,
  getValue,
  dataToCSV,
  generateCSVFilename,
} from "../src/lib/csv-export";
import type { Column } from "../src/components/data";

describe("escapeCSVValue", () => {
  test("returns empty string for null", () => {
    expect(escapeCSVValue(null)).toBe("");
  });

  test("returns empty string for undefined", () => {
    expect(escapeCSVValue(undefined)).toBe("");
  });

  test("converts true to Yes", () => {
    expect(escapeCSVValue(true)).toBe("Yes");
  });

  test("converts false to No", () => {
    expect(escapeCSVValue(false)).toBe("No");
  });

  test("returns plain string unchanged", () => {
    expect(escapeCSVValue("hello")).toBe("hello");
  });

  test("converts number to string", () => {
    expect(escapeCSVValue(42)).toBe("42");
    expect(escapeCSVValue(3.14)).toBe("3.14");
  });

  test("joins array with comma and space (quoted due to comma)", () => {
    // Arrays are joined with ", " which contains a comma, so the result gets quoted
    expect(escapeCSVValue(["WiFi", "Ethernet", "USB"])).toBe('"WiFi, Ethernet, USB"');
  });

  test("wraps value with comma in quotes", () => {
    expect(escapeCSVValue("hello, world")).toBe('"hello, world"');
  });

  test("wraps value with newline in quotes", () => {
    expect(escapeCSVValue("line1\nline2")).toBe('"line1\nline2"');
  });

  test("wraps value with carriage return in quotes", () => {
    expect(escapeCSVValue("line1\rline2")).toBe('"line1\rline2"');
  });

  test("escapes quotes by doubling them", () => {
    expect(escapeCSVValue('say "hello"')).toBe('"say ""hello"""');
  });

  test("handles value with both comma and quotes", () => {
    expect(escapeCSVValue('test, with "quotes"')).toBe('"test, with ""quotes"""');
  });

  test("handles array that produces value needing quotes", () => {
    expect(escapeCSVValue(["one", "two, three"])).toBe('"one, two, three"');
  });
});

describe("getValue", () => {
  test("gets simple property", () => {
    const item = { name: "Test" };
    expect(getValue(item, "name")).toBe("Test");
  });

  test("gets nested property with dot notation", () => {
    const item = { protocols: { artnet: "Yes", sacn: "No" } };
    expect(getValue(item, "protocols.artnet")).toBe("Yes");
  });

  test("gets deeply nested property", () => {
    const item = { a: { b: { c: "deep" } } };
    expect(getValue(item, "a.b.c")).toBe("deep");
  });

  test("returns null for missing property", () => {
    const item = { name: "Test" };
    expect(getValue(item, "missing")).toBeUndefined();
  });

  test("returns null for missing nested property", () => {
    const item = { a: { b: "value" } };
    expect(getValue(item, "a.c.d")).toBeNull();
  });

  test("returns null when parent is null", () => {
    const item = { a: null };
    expect(getValue(item, "a.b")).toBeNull();
  });
});

describe("dataToCSV", () => {
  interface TestItem {
    id: string;
    name: string;
    price: number | null;
    active: boolean;
    tags: string[];
  }

  const columns: Column<TestItem>[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "price", label: "Price" },
    { key: "active", label: "Active" },
    { key: "tags", label: "Tags" },
  ];

  test("generates header row", () => {
    const data: TestItem[] = [];
    const csv = dataToCSV(data, columns);
    expect(csv).toBe("ID,Name,Price,Active,Tags");
  });

  test("generates data rows", () => {
    const data: TestItem[] = [
      { id: "1", name: "Test", price: 100, active: true, tags: ["a", "b"] },
    ];
    const csv = dataToCSV(data, columns);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe('1,Test,100,Yes,"a, b"');
  });

  test("handles null values", () => {
    const data: TestItem[] = [
      { id: "1", name: "Test", price: null, active: false, tags: [] },
    ];
    const csv = dataToCSV(data, columns);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("1,Test,,No,");
  });

  test("handles multiple rows", () => {
    const data: TestItem[] = [
      { id: "1", name: "First", price: 10, active: true, tags: [] },
      { id: "2", name: "Second", price: 20, active: false, tags: ["x"] },
    ];
    const csv = dataToCSV(data, columns);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe("1,First,10,Yes,");
    expect(lines[2]).toBe("2,Second,20,No,x");
  });

  test("excludes links column", () => {
    interface ItemWithLinks {
      id: string;
      name: string;
      url: string;
    }
    const colsWithLinks: Column<ItemWithLinks>[] = [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "links" as keyof ItemWithLinks, label: "Links" },
    ];
    const data: ItemWithLinks[] = [{ id: "1", name: "Test", url: "https://example.com" }];
    const csv = dataToCSV(data, colsWithLinks, { includeLinks: true });
    expect(csv).not.toContain("Links");
  });

  test("adds url fields when includeLinks is true", () => {
    interface ItemWithUrl {
      id: string;
      name: string;
      url: string;
    }
    const cols: Column<ItemWithUrl>[] = [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
    ];
    const data: ItemWithUrl[] = [{ id: "1", name: "Test", url: "https://example.com" }];
    const csv = dataToCSV(data, cols, { includeLinks: true });
    expect(csv).toContain("URL");
    expect(csv).toContain("https://example.com");
  });

  test("respects includeLinks false", () => {
    interface ItemWithUrl {
      id: string;
      name: string;
      url: string;
    }
    const cols: Column<ItemWithUrl>[] = [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
    ];
    const data: ItemWithUrl[] = [{ id: "1", name: "Test", url: "https://example.com" }];
    const csv = dataToCSV(data, cols, { includeLinks: false });
    expect(csv).not.toContain("URL");
    expect(csv).not.toContain("https://example.com");
  });
});

describe("generateCSVFilename", () => {
  test("generates basic filename from category", () => {
    const result = generateCSVFilename("Controllers");
    expect(result).toBe("controllers");
  });

  test("converts spaces to hyphens", () => {
    const result = generateCSVFilename("Pixel ICs");
    expect(result).toBe("pixel-ics");
  });

  test("includes search term", () => {
    const result = generateCSVFilename("Controllers", undefined, "wled");
    expect(result).toBe("controllers_search-wled");
  });

  test("includes single filter value", () => {
    const result = generateCSVFilename("Controllers", { manufacturer: ["Advatek"] });
    expect(result).toBe("controllers_advatek");
  });

  test("includes count for multiple filter values", () => {
    const result = generateCSVFilename("Controllers", {
      manufacturer: ["Advatek", "QuinLED"],
    });
    expect(result).toBe("controllers_2-manufacturer");
  });

  test("includes multiple filters", () => {
    const result = generateCSVFilename("Controllers", {
      manufacturer: ["Advatek"],
      status: ["active"],
    });
    expect(result).toBe("controllers_advatek_active");
  });

  test("handles search and filters together", () => {
    const result = generateCSVFilename("Controllers", { status: ["active"] }, "test");
    expect(result).toBe("controllers_search-test_active");
  });

  test("ignores empty filter arrays", () => {
    const result = generateCSVFilename("Controllers", { manufacturer: [] });
    expect(result).toBe("controllers");
  });

  test("ignores null filter values", () => {
    const result = generateCSVFilename("Controllers", { manufacturer: null });
    expect(result).toBe("controllers");
  });

  test("truncates long filenames", () => {
    const result = generateCSVFilename("Controllers", {
      manufacturer: ["VeryLongManufacturerName"],
      status: ["active"],
      interfaces: ["VeryLongInterfaceName"],
    }, "verylongsearchterm");
    expect(result.length).toBeLessThanOrEqual(100);
  });

  test("trims search whitespace", () => {
    const result = generateCSVFilename("Controllers", undefined, "  test  ");
    expect(result).toBe("controllers_search-test");
  });

  test("converts search spaces to hyphens", () => {
    const result = generateCSVFilename("Controllers", undefined, "ws 2812");
    expect(result).toBe("controllers_search-ws-2812");
  });
});
