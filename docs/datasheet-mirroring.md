# Datasheet mirroring (R2)

Datasheet PDFs are not stored in git. Instead, each entry records:

- `datasheet_url` — the original URL at the manufacturer/author. This is the
  attribution link and the only thing contributors need to provide.
- `datasheet_mirror` — a CI-managed copy on Cloudflare R2:

```yaml
datasheet_url: https://cdn-shop.adafruit.com/datasheets/APA102.pdf
datasheet_mirror:
  url: https://assets.awesomeledlist.com/datasheets/pixels/apa102-3f9c1a2b.pdf
  sha256: 3f9c1a2b... (full 64-char hash)
  retrieved: "2026-06-11"
  source: https://cdn-shop.adafruit.com/datasheets/APA102.pdf
```

## Flow

1. A contributor adds/changes `datasheet_url` in a normal PR. No secrets, no
   special tooling — fork PRs work.
2. After merge, `.github/workflows/mirror-datasheets.yml` runs
   `scripts/mirror-datasheets.ts`, which finds every entry whose
   `datasheet_url` differs from `datasheet_mirror.source` (or has no mirror),
   downloads the PDF (with a `%PDF-` magic check and 50 MB cap), uploads it to
   R2 under `datasheets/<category>/<id>-<sha8>.pdf`, and writes the
   `datasheet_mirror` block into the YAML.
3. The workflow opens a bot PR (`ci/mirror-datasheets`) listing what was
   mirrored. The maintainer reviews and merges — that's the approval step.

Changing a `datasheet_url` later re-mirrors automatically (the `source` field
no longer matches). Old objects are content-addressed (`-<sha8>` suffix), so
nothing is overwritten; stale objects can be cleaned up in R2 at leisure.

## One-time setup

Repository **secrets**:

| Secret | Value |
| --- | --- |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 API token (Object Read & Write on the bucket) |
| `R2_BUCKET` | bucket name |

Repository **variable**:

| Variable | Value |
| --- | --- |
| `R2_PUBLIC_BASE_URL` | public base of the bucket, e.g. `https://assets.awesomeledlist.com` (custom domain) or the `r2.dev` public URL |

Also enable *Settings → Actions → General → Allow GitHub Actions to create and
approve pull requests*, or the bot PR step will fail.

## Local use

```sh
bun scripts/mirror-datasheets.ts --dry-run   # list what would be mirrored
bun scripts/mirror-datasheets.ts --limit 3   # mirror a few (needs R2 env vars)
```
