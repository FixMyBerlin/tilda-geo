# Static Datasets

These scripts manage geodata files, which are made public or semi-public in tilda-geo.de as static datasets.

**See also:** [Uploads Documentation](../../../docs/Uploads.md) for how these datasets are served via the API and details on the how how `dataSourceType: 'local' | 'external'` are handled.

## Setup

- Setup `./.env.development` based on [`./.env.development.example`](/./.env.development.example) and the same for staging and production.
- [Install Bun](https://bun.sh/docs/installation)
  - macOS `brew tap oven-sh/bun && brew install bun`
  - Archlinux `yay -S bun-bin`
- [Install felt/tippecanoe](https://github.com/felt/tippecanoe/blob/main/README.md#installation)
  - macOS `brew install tippecanoe`
  - Archlinux `yay -S tippecanoe`
- Setup [`tilda-static-data`](https://github.com/FixMyBerlin/tilda-static-data), see README.

## Update and add data

1. See `npm run` for the command per environment.
2. Add file to `./geojson/region-<mainRegionSlug>`
   - Region-Subfolders are `region-<mainRegionSlug>` where the shorthand is usually the region slug. Whenever we have multiple regions like with `bb`, we use the "main slug" as folder name.
   - Dataset-Folders follow the pattern `<mainRegionSlug>-<customDatasetSlug>-<optionalDatasetSharedIdentiefier>`
   - GeoJson-Files can have any unique name (without spaces).
3. Run the update script `npm run updateStaticDatasets` with optional filters:
   - `--keep-tmp` to keep temporary files for debugging
   - `--folder-filter berlin-` to run only files where the Dataset-Folder includes "berlin-"
   - Example: `bun --env-file=.env --env-file=./scripts/StaticDatasets/.env.staging ./scripts/StaticDatasets/updateStaticDatasets.ts --keep-tmp --folder-filter berlin-`

### Temporary files

Themporary files are stored at `scripts/StaticDatasets/_geojson_temp` and deleted after each run.
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

Use `npm run deleteAllStaticDatasets && npm run updateStaticDatasets` to reset all database entries.
