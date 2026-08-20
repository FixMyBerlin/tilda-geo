# Parking freeze + QA baseline

When we freeze parking data for delivery, we always:

1. **Export** the core tables and the quantized point backups from the freeze environment.
2. **Run** [`qa_create_new_voronoi_baseline.sql`](qa_create_new_voronoi_baseline.sql) on production: edit `base_table` / `target_table` in the `DECLARE` block, then run the script. That builds a new `data.*` voronoi baseline from live `public.*_quantized` (recalculated `count_reference`).
3. **Publish** `data.<target_table>` from a local machine with `bun run data-schema-publish` (S3 writes are CLI-only). Copy the production-generated table into local `data.*` first. Staging and other environments then Import **latest**. Use `--mode snapshot` only when keeping the previous dump. Publish the undated base table `data.euvm_qa_voronoi` once as well so the generator SQL can be re-run outside production.
4. **Import** that published dump on staging and on each developer machine via `/admin/data-schema` → Import (instead of empty placeholders from processing).
5. **(Decide)** Update the reference in [`9_qa_parkings_euvm_voronoi.sql`](../processing/topics/parking/9_qa_parkings_euvm_voronoi.sql) to the new `data.*` table and deploy, so nightly QA fills the stable public maps `qa_parkings_euvm` / `qa_parkings_euvm_priority`. `QaConfig` on `parkraum-berlin-euvm` keeps pointing at those public tables. Behaviour details: [QA Documentation](QA-Documentation.md).

## Artifacts

|         | Artifact                | Role                                                                                                                                                          |
| ------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(a)** | Core exports            | Delivery inputs: `parkings`, `parkings_no`, `parkings_separate`, `off_street_parking_areas`, `off_street_parking_points`                                      |
| **(b)** | Point backup (internal) | `parkings_quantized`, `off_street_parking_quantized` — keep as GeoJSON (or other export format) for audit / freeze package, not required for the baseline SQL |
| **(c)** | New QA baseline         | `data.<target_table>` created on production by the SQL above, then published as a `data-schema` artifact and imported on staging/dev via `/admin/data-schema` |

## Client-specific packaging

Merging core exports into customer files (e.g. public/private GPKGs) is **client-specific**, not part of the freeze+QA process itself. For the eUVM parking delivery pipeline, use [`scripts/tilda-parkraum-euvm-export`](../../scripts/tilda-parkraum-euvm-export/) (`download.py`, `process.py`, optional `freeze_with_qa.py`). Older freezes without quantized API exports can fall back to [`scripts/2026-tilda-parking-export-quantize`](../../scripts/2026-tilda-parking-export-quantize).
