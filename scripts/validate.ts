#!/usr/bin/env bun
/**
 * Validate all YAML files against their JSON schemas
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { parse } from "yaml";
import { join } from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const DB_DIR = "database";
const SCHEMA_DIR = "database/_schema";

// Map folder names to schema files
const FOLDER_SCHEMAS: Record<string, string> = {
  controllers: "controller.json",
  pixels: "pixel.json",
  "pixel-ics": "pixel-ic.json",
  "pattern-drivers": "pattern-driver.json",
  connectors: "connector.json",
  microboards: "microboard.json",
  "level-converters": "level-converter.json",
  adapters: "adapter.json",
  "drive-libraries": "drive-library.json",
  "pixel-decoders": "pixel-decoder.json",
  "diffusive-materials": "diffusive-material.json",
  "commercial-systems": "commercial-system.json",
};

async function main() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  let totalFiles = 0;
  let validFiles = 0;
  let errorCount = 0;

  const folders = readdirSync(DB_DIR).filter(
    (f) => !f.startsWith("_") && existsSync(join(DB_DIR, f))
  );

  for (const folder of folders) {
    const schemaFile = FOLDER_SCHEMAS[folder];
    if (!schemaFile) {
      console.log(`\nSkipping ${folder} (no schema defined)`);
      continue;
    }

    const schemaPath = join(SCHEMA_DIR, schemaFile);
    if (!existsSync(schemaPath)) {
      console.log(`\nSkipping ${folder} (schema file not found: ${schemaFile})`);
      continue;
    }

    const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
    const validate = ajv.compile(schema);

    const folderPath = join(DB_DIR, folder);
    const files = readdirSync(folderPath).filter((f) => f.endsWith(".yaml"));

    console.log(`\nValidating ${folder}/ (${files.length} files)`);

    for (const file of files) {
      totalFiles++;
      const filePath = join(folderPath, file);

      try {
        const content = readFileSync(filePath, "utf-8");
        const data = parse(content);

        if (validate(data)) {
          validFiles++;
        } else {
          errorCount++;
          console.log(`  ✗ ${file}`);
          for (const error of validate.errors || []) {
            console.log(`    - ${error.instancePath || "/"}: ${error.message}`);
          }
        }
      } catch (err) {
        errorCount++;
        console.log(`  ✗ ${file}: ${err instanceof Error ? err.message : "Parse error"}`);
      }
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Total: ${totalFiles} files`);
  console.log(`Valid: ${validFiles} files`);
  console.log(`Errors: ${errorCount} files`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
