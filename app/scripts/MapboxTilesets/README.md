# About

We used to export GeoJson from the app and use that to add testing data to Mapbox Studio as Tilesets.
However, Mapbox Studio does weird things when processing GeoJson which breaks the data when zoomed out.

As a work around, we now create mbtiles and import those in Mapbox (manually).

## Usage

```bash
bun run mapbox-tilesets-update
```

### Options

| Flag | Description |
| --- | --- |
| `--env <dev\|staging\|production>` | Environment to fetch tiles from. If omitted, an interactive prompt is shown. |
| `--filter <string>` | Only process datasets whose key includes this string (e.g. `--filter parking`). |
| `--force` | Re-download and rebuild even when output files already exist. |

### Examples

```bash
# Interactive environment prompt, process all datasets
bun run mapbox-tilesets-update

# Fetch from staging, only parking-related datasets, force rebuild
bun run mapbox-tilesets-update -- --env staging --filter parking --force
```

After processing, the mbtiles folder opens automatically. Use "replace" in Mapbox Studio and pick the generated mbtiles files.

## Reminder

The files we create here are likely different from what our own tileserver creates.
We have to choose some options in tippecanoe to generate a file that works well in Mapbox across zoom levels.
However the tippecanoe options that pick the maxzoom and make the decisions on what to drop per zoom level will likely not match what our tileserver does.
