import { describe, test, expect } from "vitest";
import {
  controllerFields,
  pixelFields,
  pixelICFields,
  patternDriverFields,
  connectorFields,
  microboardFields,
  levelConverterFields,
  adapterFields,
  driveLibraryFields,
  pixelDecoderFields,
  diffusiveMaterialFields,
  commercialSystemFields,
  getFieldsForCategory,
} from "../src/lib/fields";

describe("Field configurations", () => {
  describe("controllerFields", () => {
    test("has required fields", () => {
      const keys = controllerFields.map((f) => f.key);
      expect(keys).toContain("manufacturer");
      expect(keys).toContain("max_pixels");
      expect(keys).toContain("max_outputs");
      expect(keys).toContain("wled_compatible");
      expect(keys).toContain("status");
    });

    test("all fields have labels", () => {
      for (const field of controllerFields) {
        expect(field.label).toBeTruthy();
        expect(typeof field.label).toBe("string");
      }
    });
  });

  describe("pixelFields", () => {
    test("has required fields", () => {
      const keys = pixelFields.map((f) => f.key);
      expect(keys).toContain("manufacturer");
      expect(keys).toContain("color_order");
      expect(keys).toContain("clocked");
      expect(keys).toContain("data_bitrate");
    });
  });

  describe("pixelICFields", () => {
    test("has required fields", () => {
      const keys = pixelICFields.map((f) => f.key);
      expect(keys).toContain("channels");
      expect(keys).toContain("clocked");
      expect(keys).toContain("pwm_frequency");
    });
  });

  describe("patternDriverFields", () => {
    test("has required fields", () => {
      const keys = patternDriverFields.map((f) => f.key);
      expect(keys).toContain("developer");
      expect(keys).toContain("platforms");
      expect(keys).toContain("protocols.artnet");
      expect(keys).toContain("protocols.sacn");
    });

    test("has nested protocol fields", () => {
      const protocolFields = patternDriverFields.filter((f) =>
        f.key.startsWith("protocols.")
      );
      expect(protocolFields.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("connectorFields", () => {
    test("has required fields", () => {
      const keys = connectorFields.map((f) => f.key);
      expect(keys).toContain("manufacturer");
      expect(keys).toContain("max_current");
      expect(keys).toContain("ip_rating");
    });
  });

  describe("microboardFields", () => {
    test("has required fields", () => {
      const keys = microboardFields.map((f) => f.key);
      expect(keys).toContain("soc");
      expect(keys).toContain("cpu");
      expect(keys).toContain("wifi");
      expect(keys).toContain("ethernet");
    });
  });
});

describe("getFieldsForCategory", () => {
  test("returns controllerFields for controllers", () => {
    const fields = getFieldsForCategory("controllers");
    expect(fields).toBe(controllerFields);
  });

  test("returns pixelFields for pixels", () => {
    const fields = getFieldsForCategory("pixels");
    expect(fields).toBe(pixelFields);
  });

  test("returns pixelICFields for pixel-ics", () => {
    const fields = getFieldsForCategory("pixel-ics");
    expect(fields).toBe(pixelICFields);
  });

  test("returns patternDriverFields for pattern-drivers", () => {
    const fields = getFieldsForCategory("pattern-drivers");
    expect(fields).toBe(patternDriverFields);
  });

  test("returns connectorFields for connectors", () => {
    const fields = getFieldsForCategory("connectors");
    expect(fields).toBe(connectorFields);
  });

  test("returns microboardFields for microboards", () => {
    const fields = getFieldsForCategory("microboards");
    expect(fields).toBe(microboardFields);
  });

  test("returns levelConverterFields for level-converters", () => {
    const fields = getFieldsForCategory("level-converters");
    expect(fields).toBe(levelConverterFields);
  });

  test("returns adapterFields for adapters", () => {
    const fields = getFieldsForCategory("adapters");
    expect(fields).toBe(adapterFields);
  });

  test("returns driveLibraryFields for drive-libraries", () => {
    const fields = getFieldsForCategory("drive-libraries");
    expect(fields).toBe(driveLibraryFields);
  });

  test("returns pixelDecoderFields for pixel-decoders", () => {
    const fields = getFieldsForCategory("pixel-decoders");
    expect(fields).toBe(pixelDecoderFields);
  });

  test("returns diffusiveMaterialFields for diffusive-materials", () => {
    const fields = getFieldsForCategory("diffusive-materials");
    expect(fields).toBe(diffusiveMaterialFields);
  });

  test("returns commercialSystemFields for commercial-systems", () => {
    const fields = getFieldsForCategory("commercial-systems");
    expect(fields).toBe(commercialSystemFields);
  });

  test("returns empty array for unknown category", () => {
    const fields = getFieldsForCategory("unknown-category");
    expect(fields).toEqual([]);
  });

  test("returns empty array for empty string", () => {
    const fields = getFieldsForCategory("");
    expect(fields).toEqual([]);
  });
});

describe("Field configuration consistency", () => {
  const allFieldConfigs = [
    { name: "controllers", fields: controllerFields },
    { name: "pixels", fields: pixelFields },
    { name: "pixel-ics", fields: pixelICFields },
    { name: "pattern-drivers", fields: patternDriverFields },
    { name: "connectors", fields: connectorFields },
    { name: "microboards", fields: microboardFields },
    { name: "level-converters", fields: levelConverterFields },
    { name: "adapters", fields: adapterFields },
    { name: "drive-libraries", fields: driveLibraryFields },
    { name: "pixel-decoders", fields: pixelDecoderFields },
    { name: "diffusive-materials", fields: diffusiveMaterialFields },
    { name: "commercial-systems", fields: commercialSystemFields },
  ];

  test("all categories have at least one field", () => {
    for (const { name, fields } of allFieldConfigs) {
      expect(fields.length).toBeGreaterThan(0);
    }
  });

  test("all fields have non-empty keys", () => {
    for (const { name, fields } of allFieldConfigs) {
      for (const field of fields) {
        expect(field.key).toBeTruthy();
        expect(typeof field.key).toBe("string");
      }
    }
  });

  test("all fields have non-empty labels", () => {
    for (const { name, fields } of allFieldConfigs) {
      for (const field of fields) {
        expect(field.label).toBeTruthy();
        expect(typeof field.label).toBe("string");
      }
    }
  });

  test("no duplicate keys within a category", () => {
    for (const { name, fields } of allFieldConfigs) {
      const keys = fields.map((f) => f.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    }
  });
});
