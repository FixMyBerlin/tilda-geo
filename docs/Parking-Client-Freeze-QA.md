# Parking freeze + QA baseline

When we freeze parking data for delivery, we always:

1. **Export** the core tables and the quantized point backups from the freeze environment.
2. **Run** [`qa_create_new_voronoi_baseline.sql`](qa_create_new_voronoi_baseline.sql) on production: edit `base_table` / `target_table` in the `DECLARE` block, then run the script. That builds a new `data.*` voronoi baseline from live `public.*_quantized` (recalculated `count_reference`).
3. **(Decide)** Update the reference in [`9_qa_parkings_euvm_voronoi.sql`](../processing/topics/parking/9_qa_parkings_euvm_voronoi.sql) to the new `data.*` table and deploy, so nightly QA fills the stable public maps `qa_parkings_euvm` / `qa_parkings_euvm_priority`. `QaConfig` on `parkraum-berlin-euvm` keeps pointing at those public tables. Behaviour details: [QA Documentation](QA-Documentation.md).

## Artifacts

|         | Artifact                | Role                                                                                                                                                          |
| ------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(a)** | Core exports            | Delivery inputs: `parkings`, `parkings_no`, `parkings_separate`, `off_street_parking_areas`, `off_street_parking_points`                                      |
| **(b)** | Point backup (internal) | `parkings_quantized`, `off_street_parking_quantized` — keep as GeoJSON (or other export format) for audit / freeze package, not required for the baseline SQL |
| **(c)** | New QA baseline         | `data.<target_table>` created on production by the SQL above                                                                                                  |

## Client-specific packaging

Merging core exports into customer files (e.g. public/private GPKGs) is **client-specific**, not part of the freeze+QA process itself. For the eUVM parking delivery pipeline, use [`scripts/tilda-parkraum-euvm-export`](../../scripts/tilda-parkraum-euvm-export/) (`download.py`, `process.py`, optional `freeze_with_qa.py`). Older freezes without quantized API exports can fall back to [`scripts/2026-tilda-parking-export-quantize`](../../scripts/2026-tilda-parking-export-quantize).
