# Static Datasets

These scripts manage geodata files, which are made public or semi-public in tilda-geo.de as static datasets.

**See also:** [Uploads Documentation](../../../docs/Uploads.md) for how these datasets are served via the API and details on the how how `dataSourceType: 'local' | 'external'` are handled.

## Setup

- Configure [`app/.env`](../../.env) (copy from the repo root `.env.example` via `bun run predev`). From `app/`, [Bun loads `.env` automatically](https://bun.sh/docs/runtime/env) for `bun run` and `bun ./scripts/...` (working directory must be `app/` so it finds that file).
- **Atlas API keys (strict):**
  - `ATLAS_API_KEY` — required for `--env=dev` (calls the **local** app API only).
  - `ATLAS_API_KEY_STAGING` — required for `--env=staging` (no fallback to `ATLAS_API_KEY`).
  - `ATLAS_API_KEY_PRODUCTION` — required for `--env=production` (no fallback).
- S3 credentials (`S3_KEY`, `S3_SECRET`, `S3_REGION`, `S3_BUCKET`) must be set in `app/.env` for uploads. The S3 prefix (`localdev` / `staging` / `production`) is chosen from `--env`, not from env vars.
- [Install Bun](https://bun.sh/docs/installation)
  - macOS `brew tap oven-sh/bun && brew install bun`
  - Archlinux `yay -S bun-bin`
- [Install felt/tippecanoe](https://github.com/felt/tippecanoe/blob/main/README.md#installation)
  - macOS `brew install tippecanoe`
  - Archlinux `yay -S tippecanoe`
- Setup [`tilda-static-data`](https://github.com/FixMyBerlin/tilda-static-data), see README.

## Update and add data

1. From `app/`, run `bun run static-datasets-update`. Without `--env`, the CLI prompts for the target environment. Pass `--env=dev`, `--env=staging`, or `--env=production` to skip the prompt.
2. Add file to `./geojson/region-<mainRegionSlug>`
   - Region-Subfolders are `region-<mainRegionSlug>` where the shorthand is usually the region slug. Whenever we have multiple regions like with `bb`, we use the "main slug" as folder name.
   - Dataset-Folders follow the pattern `<mainRegionSlug>-<customDatasetSlug>-<optionalDatasetSharedIdentifier>`
   - GeoJson-Files can have any unique name (without spaces).
3. Optional flags:
   - `--keep-tmp` to keep temporary files for debugging
   - `--folder-filter berlin-` to run only files where the Dataset-Folder includes "berlin-"
   - Example: `bun run static-datasets-update -- --env=staging --keep-tmp --folder-filter=berlin-`

### Temporary files

Temporary files are stored at `scripts/StaticDatasets/_geojson_temp` and deleted after each run.
Use `--keep-tmp` to keep the files for debugging.

### Skipping files

- All folders prefixed with `_` are skipped
- All files or folders specified in `app/scripts/StaticDatasets/geojson/.updateignore` are skipped

### Using compressed `.geojson.gz` Files

- In general we store the plain `.geojson` to have nice versioning and easy access to the contents
- When files are too big to store in Gihtub, we GZip them by hand
  ```
  gzip -f -9 …speeds.geojson
  ```
- The files are uncompressed and stored in the temp folder, then transformed, then processed (tippacanoe)

## Delete existing database entries

The script will **not remove existing database configs** if the dataset folder was rename or removed.
