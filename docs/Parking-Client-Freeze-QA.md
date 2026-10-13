# Parking freeze + QA baseline

When we freeze parking data for delivery, we always:

1. **Export** the freeze package with [`scripts/tilda-parkraum-euvm-export/freeze_with_qa.py`](../../scripts/tilda-parkraum-euvm-export/freeze_with_qa.py) (customer GPKGs + `qa/PACKAGE.md`). The delivered `parking_public.gpkg` is also the input for the reference in step 3: its parking lines and lots carry the delivery-date `capacity` and tag values (e.g. `condition_category_primary`) that the indicators need.
2. **(Only if the cell set itself changes)** Build/refresh the **cell table** on production: edit `base_table` / `target_table` in [`qa_create_new_voronoi_baseline.sql`](qa_create_new_voronoi_baseline.sql) and run the whole script. That clips and validates `data.<target_table>` (id, geom, name, priority — no reference values, see the note at the top of that file) against Berlin. Skip this step when reusing an existing, already-clipped cell table (e.g. `data.euvm_qa_voronoi_2026` for both parking and bikelanes). Use the latest dated cell table as `base_table`: its borders are already straightened (`euvm_qa_voronoi` is the delivered original).
   - **Straighten the cell borders** when the base table still had the dense delivered borders (a vertex every few metres), with [`scripts/2026-tilda-qa-voronoi-simplify`](../../scripts/2026-tilda-qa-voronoi-simplify/): `uv run simplify.py --table <target_table>` reports, `--write` updates `data.<target_table>` and its `.sql`. Junctions stay, neighbours keep identical borders and the ids stay.
   - A changed cell table needs a new reference (step 3): the reference is measured on the cell geometry, so both have to come from the same borders.
3. **Build the reference table**: the amount per cell, indicator and tag value at delivery date. It must be measured with the same code the nightly run uses ([Measure.md](Measure.md)), so both ways below call the QA functions:
   - **From the delivered files** (local database with the cell table): `FMC/scripts/2026-tilda-qa-reference`, `--dataset parking`. It loads the public parking lines and lots of `parking_public.gpkg` and writes `data.qa_parkings_euvm_reference_2026` plus its SQL dump. Go on with step 5.
   - **On production at delivery date**: build `_qa_features` like [`9_qa_parkings.sql`](../processing/topics/parking/9_qa_parkings.sql) does (everything above its `CALL`), then `CALL tilda_qa_write_reference('parking_euvm', <config_id>, 'data.qa_parkings_euvm_reference_2026');`. Go on with step 4.
   - Either way one run computes the reference for **every** indicator (e.g. `total`, `condition_category_primary`).
   - **Sanity check (required)**: the sum of `amount` for `indicator_key = 'total'` must be close to the sum of `capacity` of the delivered public lines and lots (2026-06-03: 1,070,080 of 1,070,908 spaces; the rest lies outside every cell). A large or unexplained delta means the input is wrong — stop and ask.
4. **Export** `data.qa_parkings_euvm_reference_2026` from production as a **SQL dump** (TablePlus → SQL, or `pg_dump --table=data.qa_parkings_euvm_reference_2026`). Put the file at `data-schema/<target_table>/<target_table>.sql`. Keep it as SQL — do not convert to GeoPackage/GeoJSON; there is no geometry column here, but ogr2ogr round-trips can still mangle numeric/text typing on non-spatial tables.
5. **Create the spec, load and verify**: paste the [agent prompt](#agent-prompt-step-5) below into an agent chat, filling in `<new_table>`, `<previous_table>`, and `<path>`. It stops before publish and reports the row count so you can compare it to the previous reference table.
6. **Publish** to S3 (CLI only; not the admin page):
   ```bash
   bun run data-schema-publish -- --table <target_table> --mode snapshot
   ```
   Use `--mode snapshot` so the previous dump stays under `snapshots/`. First-ever publish of a table may use `--mode override`.
7. **Import** on local, staging, and production via `/admin/data-schema` → Import (or MCP `data_schema_import`). Until then, the config's indicators have no values (the nightly logs them as missing).
8. **Point the config at it**: set `QaConfig.referenceTable` to the new table and `QaConfig.referenceFrozenAt` to the freeze date (admin UI) and deploy. The trusted-editor check only counts edits from that date on ([QA Documentation §3](QA-Documentation.md#3-trusted-osm-editors-automatic-ok)). Nightly QA ([`9_qa_parkings.sql`](../processing/topics/parking/9_qa_parkings.sql)) picks it up on the next run. Behaviour: [QA Documentation](QA-Documentation.md).

## Agent prompt (step 5)

Paste this after the SQL dump is on disk. Without an agent, do the same by hand from `app/`: copy the previous `spec.yaml`, then `bun run data-schema-load -- --table <target_table>` and `bun run data-schema-verify -- --table <target_table>`.

```markdown
Use the add-db-data-table skill for a new QA reference table, table
data.<new_table>. It was generated on production by
CALL tilda_qa_write_reference(...) (processing/qa/qa_functions.sql) and
exported as a SQL dump at <path>.

Move the dump into data-schema/<new_table>/ and base the spec on the previous
reference table (run `bun run data-schema-pull` first, then copy
`data-schema/<previous_table>/spec.yaml`): source.file is the .sql dump, no
`import` block, a plain index on (area_id, indicator_key), and
`consumedBy: processing/qa/qa_functions.sql` (tilda_qa_load_reference).

Then run data-schema-load and data-schema-verify. Stop before publish and show
me the row count so I can compare it to the previous reference table.
```

## Bikelanes reference

For a bikelanes `QaConfig` the reference table is built the same way:

- **On production at delivery date**: build `_qa_features` like
  [`5_qa_bikelanes.sql`](../processing/topics/roads_bikelanes/5_qa_bikelanes.sql) does (everything
  above its `CALL`: the bikelanes moved to their street side, `amount = length`), then
  `CALL tilda_qa_write_reference('bikelanes', <config_id>, 'data.qa_bikelanes_<name>_reference_<year>');`
  and steps 4–8 above. The customer's merged roads+bikelanes network is **not** a valid input — QA
  reads TILDA's own `bikelanes` table; see
  [QA-Documentation.md](QA-Documentation.md#scope-tilda-data-not-the-customers-merged-network).
- **From an old export (infraVelo, 2026-01-29)**: that state only exists as a TILDA export, not in
  a database. `data.qa_bikelanes_infravelo_reference_2026` is written by
  `FMC/scripts/2026-tilda-qa-reference`, `--dataset bikelanes` (README there). It does not move the
  lines to the street side: until August 2026 the exported geometry was already offset.

There is no separate "cell clip" step for bikelanes today — it reuses the parking cell table
(`data.euvm_qa_voronoi_2026`, `areaFilter: all`).

## Artifacts

|         | Artifact                       | Role                                                                                                                                                      |
| ------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(a)** | Core exports                   | Delivery inputs: `parkings`, `parkings_no`, `parkings_separate`, `off_street_parking_areas`, `off_street_parking_points`                                  |
| **(c)** | Cell table (only if changed)   | `data.<target_table>` clipped/validated on production, exported as SQL, loaded/published via data-schema, then Import on every environment                |
| **(d)** | Reference table (every freeze) | `data.qa_parkings_euvm_reference_<year>` / `data.qa_bikelanes_<name>_reference_<year>`, measured from (a) with the QA functions, same publish/Import path |

## Client-specific packaging

Merging core exports into customer files (e.g. public/private GPKGs) is **client-specific**, not part of the freeze+QA process itself. For the eUVM parking delivery pipeline, use [`scripts/tilda-parkraum-euvm-export`](../../scripts/tilda-parkraum-euvm-export/) (`download.py`, `process.py`, optional `freeze_with_qa.py`).
