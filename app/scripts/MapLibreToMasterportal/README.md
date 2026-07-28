# MapLibre → Masterportal converter

Converts TILDA parking restriction styles into Masterportal-compatible `style.json` content.

**Partner guide (German):** [MASTERPORTAL.md](./MASTERPORTAL.md) — Masterportal setup, GPKG layer mapping, known limitations.

## Run

```bash
cd app
bun scripts/MapLibreToMasterportal/convert.ts
bun scripts/MapLibreToMasterportal/preview/serve.ts
```

`convert.ts` options:

- `--zoom 17` — zoom level for frozen line/text widths (default: 17)
- `--out-dir <path>` — output directory (default: `output/`)
- `--split-styles` — also write one JSON file per `styleId` (default: off)

## Output

```
output/
  masterportal/
    parking_public.gpkg.styles.json   ← GPKG / EUVM (recommended for partners)
    parking_public.gpkg.legend.json
    parkbeschraenkungen.json          ← tile preview (7 styles)
    parkbeschraenkungen-legend.json
  tilda/
    gpkg-manifest.json
    masterportal-layer-snippet.json
    manifest.json
    conversion-meta.json
```

Output is gitignored.

## Sources

Mapbox style groups:

`app/src/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/`

GPKG data model: `scripts/tilda-parkraum-euvm-export` → `parking_public.gpkg`
