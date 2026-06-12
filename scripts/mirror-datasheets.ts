#!/usr/bin/env bun
/**
 * Mirror datasheet PDFs to Cloudflare R2.
 *
 * Scans database YAML files for entries with a `datasheet_url` that has no
 * `datasheet_mirror` yet (or whose mirror was fetched from a different URL),
 * downloads the PDF, uploads it to R2, and writes a `datasheet_mirror` block
 * into the YAML file (url, sha256, retrieved, source).
 *
 * Contributors only ever add `datasheet_url` in a normal PR; CI runs this
 * after merge and opens a bot PR with the mirror references for review.
 *
 * Usage:
 *   bun scripts/mirror-datasheets.ts            # fetch + upload + rewrite YAML
 *   bun scripts/mirror-datasheets.ts --dry-run  # report what would be mirrored
 *   bun scripts/mirror-datasheets.ts --limit 5  # only process the first 5
 *
 * Required env (skipped in --dry-run):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *   R2_PUBLIC_BASE_URL  e.g. https://assets.awesomeledlist.com
 */

import { readFileSync, readdirSync, writeFileSync, appendFileSync, statSync } from "fs";
import { join } from "path";
import { parse } from "yaml";
import { createHash } from "crypto";
import { S3Client } from "bun";

const DB_DIR = "database";
const KEY_PREFIX = "datasheets";
const MAX_BYTES = 50 * 1024 * 1024; // refuse anything over 50 MB

const dryRun = process.argv.includes("--dry-run");
const limitIdx = process.argv.indexOf("--limit");
const limit = limitIdx >= 0 ? Number(process.argv[limitIdx + 1]) : Infinity;

interface Candidate {
  file: string;
  category: string;
  id: string;
  url: string;
}

function findCandidates(): Candidate[] {
  const out: Candidate[] = [];
  for (const folder of readdirSync(DB_DIR)) {
    if (folder.startsWith("_")) continue;
    const folderPath = join(DB_DIR, folder);
    if (!statSync(folderPath).isDirectory()) continue;
    for (const file of readdirSync(folderPath)) {
      if (!file.endsWith(".yaml")) continue;
      const path = join(folderPath, file);
      const data = parse(readFileSync(path, "utf-8"));
      if (!data?.datasheet_url) continue;
      // Already mirrored from this exact URL -> nothing to do
      if (data.datasheet_mirror?.source === data.datasheet_url) continue;
      out.push({ file: path, category: folder, id: data.id ?? file.replace(/\.yaml$/, ""), url: data.datasheet_url });
    }
  }
  return out;
}

function makeS3(): { s3: S3Client; publicBase: string } {
  const need = (name: string): string => {
    const v = process.env[name];
    if (!v) {
      console.error(`Missing required env var ${name}`);
      process.exit(1);
    }
    return v;
  };
  const accountId = need("R2_ACCOUNT_ID");
  const s3 = new S3Client({
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    bucket: need("R2_BUCKET"),
    accessKeyId: need("R2_ACCESS_KEY_ID"),
    secretAccessKey: need("R2_SECRET_ACCESS_KEY"),
  });
  return { s3, publicBase: need("R2_PUBLIC_BASE_URL").replace(/\/$/, "") };
}

async function download(url: string): Promise<Uint8Array | null> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "awesomeledlist-datasheet-mirror/1.0 (+https://awesomeledlist.com)" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    console.warn(`  HTTP ${res.status}`);
    return null;
  }
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) {
    console.warn(`  too large (${len} bytes)`);
    return null;
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength > MAX_BYTES) {
    console.warn(`  too large (${bytes.byteLength} bytes)`);
    return null;
  }
  // PDF magic number check - vendor sites love serving HTML interstitials
  const head = new TextDecoder().decode(bytes.slice(0, 5));
  if (head !== "%PDF-") {
    console.warn(`  not a PDF (starts with ${JSON.stringify(head)})`);
    return null;
  }
  return bytes;
}

/** Insert or replace the datasheet_mirror block, preserving file formatting. */
function writeMirrorBlock(path: string, mirror: { url: string; sha256: string; retrieved: string; source: string }) {
  const block = [
    "datasheet_mirror:",
    `  url: ${mirror.url}`,
    `  sha256: ${mirror.sha256}`,
    `  retrieved: "${mirror.retrieved}"`,
    `  source: ${mirror.source}`,
  ].join("\n");

  let text = readFileSync(path, "utf-8");
  if (/^datasheet_mirror:/m.test(text)) {
    // Replace existing block (key line + following indented lines)
    text = text.replace(/^datasheet_mirror:(?:\n(?: .*)?)*(?:\n|$)/m, block + "\n");
  } else {
    // Insert right after the datasheet_url line
    text = text.replace(/^(datasheet_url: .*)$/m, `$1\n${block}`);
  }
  writeFileSync(path, text);
}

async function main() {
  const candidates = findCandidates().slice(0, limit);
  console.log(`${candidates.length} datasheet(s) to mirror${dryRun ? " (dry run)" : ""}`);
  if (candidates.length === 0) return;

  const ctx = dryRun ? null : makeS3();
  const summary: string[] = [];
  let failures = 0;

  for (const c of candidates) {
    console.log(`- ${c.category}/${c.id}: ${c.url}`);
    if (dryRun) continue;

    const bytes = await download(c.url).catch((err) => {
      console.warn(`  fetch failed: ${err?.message ?? err}`);
      return null;
    });
    if (!bytes) {
      failures++;
      summary.push(`- :warning: \`${c.category}/${c.id}\` failed: ${c.url}`);
      continue;
    }

    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const key = `${KEY_PREFIX}/${c.category}/${c.id}-${sha256.slice(0, 8)}.pdf`;
    await ctx!.s3.write(key, bytes, { type: "application/pdf" });

    const mirror = {
      url: `${ctx!.publicBase}/${key}`,
      sha256,
      retrieved: new Date().toISOString().slice(0, 10),
      source: c.url,
    };
    writeMirrorBlock(c.file, mirror);
    console.log(`  -> ${mirror.url}`);
    summary.push(`- \`${c.category}/${c.id}\` (${(bytes.byteLength / 1024).toFixed(0)} KB) <- ${c.url}`);
  }

  // Summary for the bot PR body (read by the workflow)
  if (!dryRun && process.env.GITHUB_OUTPUT === undefined && summary.length) {
    console.log("\nSummary:\n" + summary.join("\n"));
  }
  if (process.env.MIRROR_SUMMARY_FILE && summary.length) {
    appendFileSync(process.env.MIRROR_SUMMARY_FILE, summary.join("\n") + "\n");
  }
  if (failures) {
    console.warn(`\n${failures} download(s) failed; their YAML files were left untouched.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
