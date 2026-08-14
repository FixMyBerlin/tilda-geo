# Cutouts

## External cutouts

The processing can cutout external data in addition to the data generated from OSM.

### eUVM Berlin

#### Source

https://drive.google.com/drive/u/0/folders/1wEKkUayaySZ6AhsdrkTGbbeVAx1YJARs

#### Import / Update

Use the `data-schema` pipeline ([overview](../../../../data-schema/README.md), [skill](../../../../.cursor/skills/add-db-data-table/SKILL.md)). Specs are gitignored — seed them with `data-schema-publish --spec-only`.

**Point (`data.euvm_cutouts_point`) — example `spec.json`:**

```json
{
  "specVersion": 1,
  "table": "euvm_cutouts_point",
  "source": {
    "file": "euvm_cutouts_point.geojson",
    "provider": "eUVM Berlin",
    "documentation": "Google Drive: https://drive.google.com/drive/u/0/folders/1wEKkUayaySZ6AhsdrkTGbbeVAx1YJARs\n\nDownload the point GeoJSON delivery and load it with data-schema-load."
  },
  "import": {
    "srid": 4326,
    "geometryName": "geom",
    "fidColumn": "id",
    "selectColumns": ["type"],
    "expectedGeometryType": "Point",
    "layer": null
  },
  "indexes": [{ "name": "euvm_cutouts_point_geom_idx", "using": "gist", "columns": ["geom"] }],
  "consumedBy": "processing/topics/parking/cutouts/2_external_cutouts_euvm.sql"
}
```

**Polygon (`data.euvm_cutouts_polygon`) — same shape with:**

- `table` / `source.file` / index name → `euvm_cutouts_polygon*`
- `selectColumns`: `["type"]`
- `expectedGeometryType`: `"MultiPolygon"` (or `"Polygon"` depending on the delivery). Use WKB-style names in the spec; `data-schema-load` accepts ogrinfo’s spaced forms (e.g. `Multi Polygon`).

From `app/`:

```bash
bun run data-schema-pull
bun run data-schema-publish -- --table euvm_cutouts_point --spec-only
bun run data-schema-load -- --table euvm_cutouts_point --file /path/to/euvm_cutouts_point.geojson
bun run data-schema-publish -- --table euvm_cutouts_point
# repeat for euvm_cutouts_polygon
```

Then on staging and production: `/admin/data-schema` → Import for each table.

Processing still reads `data.euvm_cutouts_point` / `data.euvm_cutouts_polygon` via [`2_external_cutouts_euvm.sql`](2_external_cutouts_euvm.sql).
