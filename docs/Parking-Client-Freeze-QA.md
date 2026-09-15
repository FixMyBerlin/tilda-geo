# Parking freeze + QA baseline

When we freeze parking data for delivery, we always:

1. **Export** the freeze package with [`scripts/tilda-parkraum-euvm-export/freeze_with_qa.py`](../../scripts/tilda-parkraum-euvm-export/freeze_with_qa.py) (customer GPKGs + quantized QA GeoJSON + `qa/PACKAGE.md`). Prefer `prod` so the baseline SQL matches the freeze points.
2. **Generate** the new dated baseline on **production**: edit `base_table` / `target_table` in [`qa_create_new_voronoi_baseline.sql`](qa_create_new_voronoi_baseline.sql) and run the whole script. That builds `data.<target_table>` from live `public.*_quantized` (recalculated `count_reference` on **clipped** geometry), copying name + priority from `data.<base_table>` (usually `euvm_qa_voronoi`) and normalizing + clipping polygons to Berlin. Nightly processing no longer clips.
3. **Export** `data.<target_table>` from production as a **SQL dump** (TablePlus → SQL, or `pg_dump --table=data.<target_table>`). Put the file at `data-schema/<target_table>/<target_table>.sql`. Keep it as SQL — do not convert to GeoPackage/GeoJSON; an ogr2ogr round-trip would replace the text `id` primary key with an integer `ogc_fid`.
4. **Create the spec, load and verify**: paste the [agent prompt](#agent-prompt-step-4) below into an agent chat, filling in `<new_table>`, `<previous_table>`, and `<path>`. It stops before publish and reports the row count so you can compare it to the previous baseline.
5. **Publish** to S3 (CLI only; not the admin page):
   ```bash
   bun run data-schema-publish -- --table <target_table> --mode snapshot
   ```
   Use `--mode snapshot` so the previous dump stays under `snapshots/`. First-ever publish of a table may use `--mode override`.
6. **Import** on local, staging, and production via `/admin/data-schema` → Import (or MCP `data_schema_import`). This replaces empty placeholders from processing with the real baseline.
7. **(Decide)** Point [`9_qa_parkings_euvm_voronoi.sql`](../processing/topics/parking/9_qa_parkings_euvm_voronoi.sql) at the new `data.*` table and deploy, so nightly QA fills the stable public maps `qa_parkings_euvm` / `qa_parkings_euvm_priority`. `QaConfig` on `parkraum-berlin-euvm` keeps pointing at those public tables. Behaviour: [QA Documentation](QA-Documentation.md).

## Agent prompt (step 4)

Paste this after the SQL dump is on disk. Without an agent, do the same by hand from `app/`: copy the previous `spec.yaml`, then `bun run data-schema-load -- --table <target_table>` and `bun run data-schema-verify -- --table <target_table>`.

```markdown
Use the add-db-data-table skill for a new QA voronoi baseline, table
data.<new_table>. It was generated on production by
docs/qa_create_new_voronoi_baseline.sql and exported as a SQL dump at <path>.

Move the dump into data-schema/<new_table>/ and base the spec on the previous
baseline (run `bun run data-schema-pull` first, then copy
`data-schema/<previous_table>/spec.yaml`): source.file is the .sql dump, no
`import` block, a gist index on geom, and
`consumedBy: processing/topics/parking/9_qa_parkings_euvm_voronoi.sql`.

The source must stay a SQL dump: `id` is a text primary key and a GPKG/GeoJSON
round-trip would replace it with an integer ogc_fid.

Then run data-schema-load and data-schema-verify, and confirm `id` is still a
text primary key. Stop before publish and show me the row count so I can compare
it to the previous baseline.
```

## Artifacts

|         | Artifact                | Role                                                                                                                                                      |
| ------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(a)** | Core exports            | Delivery inputs: `parkings`, `parkings_no`, `parkings_separate`, `off_street_parking_areas`, `off_street_parking_points`                                  |
| **(b)** | Point backup (internal) | `parkings_quantized`, `off_street_parking_quantized` — keep as GeoJSON for audit / freeze package; not required for the baseline SQL                      |
| **(c)** | New QA baseline         | `data.<target_table>` created on production, exported as SQL, loaded/published via data-schema, then Import on every environment via `/admin/data-schema` |

## Client-specific packaging

Merging core exports into customer files (e.g. public/private GPKGs) is **client-specific**, not part of the freeze+QA process itself. For the eUVM parking delivery pipeline, use [`scripts/tilda-parkraum-euvm-export`](../../scripts/tilda-parkraum-euvm-export/) (`download.py`, `process.py`, optional `freeze_with_qa.py`). Older freezes without quantized API exports can fall back to [`scripts/2026-tilda-parking-export-quantize`](../../scripts/2026-tilda-parking-export-quantize).
