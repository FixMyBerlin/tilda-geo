# Per-topic osmium tag-filter split (abandoned)

**Status:** Reverted (2026-06-28). Do not reintroduce multiple full-region `osmium tags-filter` passes without reading this first.

## What we tried

Commit `Processing: Split tag filter per topic to increase performance` moved the monolithic `filter-expressions.txt` union into per-topic profiles (`roadsBikelanes`, `features`, `relations`, `barriers`, `landcover`, `parking`). Each topic was meant to run osm2pgsql on a smaller PBF instead of the shared union clip.

The hypothesis: _roads_bikelanes does not need buildings/leisure/parking keys, so a narrower input should speed up osm2pgsql._

## What we measured (Berlin-full dev, `PROCESS_ONLY_BBOX`, all topics, cold filter cache)

Preset bbox `13.0883,52.3382,13.7611,52.6755`, `SKIP_DOWNLOAD=1`, `SKIP_UNCHANGED=0`, `SKIP_WARM_CACHE=1`.

### Pipeline wall time

| Pipeline                                                  | Wall time  | `roads_bikelanes` topic |
| --------------------------------------------------------- | ---------- | ----------------------- |
| Monolithic filter → shared bbox → all topics              | ~36–39 min | **2:34**                |
| Per-profile filter on full Brandenburg → per-profile bbox | ~42 min    | **2:56**                |

Net: **~5 min slower** on a full nightly-style run.

### Why smaller PBF did not speed up `roads_bikelanes`

osm2pgsql logs for the same topic:

| Input                                                        | PBF ways      | osm2pgsql way stage | Throughput      |
| ------------------------------------------------------------ | ------------- | ------------------- | --------------- |
| Shared union clip (`bbox_extracted`, ~124 MB)                | **1,576,293** | **148 s**           | **~11k ways/s** |
| Highways-only clip (`roadsBikelanes_bbox_extracted`, ~37 MB) | **541,786**   | **167 s**           | **~3k ways/s**  |

The narrow file has **fewer ways and less disk I/O**, but osm2pgsql got **slower**, not faster.

**Reason:** import time is dominated by **Lua work on highway ways**, not by parsing ignored objects. In the union file, ~1M non-highway ways are rejected almost immediately (~11k ways/s average). In the highways-only file, almost every way runs the full `roads_bikelanes` Lua path (~3k ways/s). The expensive highway count is the same (~540k); we only removed cheap skips.

With a **warm** profile cache (no upfront osmium), osm2pgsql on the narrow clip was ~**13 s** faster — not enough to pay for extra osmium work.

### Extra osmium cost

Old pipeline:

```
download → monolithic tags-filter ONCE → bbox ONCE → every topic reads the same clip
```

Per-topic split (cold cache):

```
download → tags-filter on FULL region per profile (×5) → bbox per profile → osm2pgsql
```

Each profile scan reads all of Brandenburg (~325 MB download) before Berlin clip. That upfront cost is charged **before** the topic timer starts and wiped out any osm2pgsql savings.

## Lessons

1. **Smaller osm2pgsql input ≠ faster** when the topic Lua only does heavy work on a subset of objects anyway; skipping irrelevant ways in Lua is cheap.
2. **Watch osm2pgsql ways/s**, not just PBF size — a drop from 11k/s to 3k/s with fewer ways is a red flag that you removed skip-fast objects, not expensive work.
3. **Never repeat full-region osmium** when one shared filter + bbox already exists — amortize upfront I/O across all topics.
4. **Cold-cache nightly runs** are what matter; warm-cache micro-wins are misleading.

## Current pipeline (restored)

```
download (regional PBF)
  → monolithic osmium tags-filter ONCE   (filter-expressions.txt)
  → optional global bbox ONCE            (PROCESS_ONLY_BBOX / topic bboxes)
  → each topic → osm2pgsql on shared or topic-bbox clip
```

See [`filter/README.md`](../filter/README.md) and [`index.ts`](../index.ts).

## If we ever revisit narrowing inputs

Only pursue this if profiling shows osm2pgsql parse/I/O as the bottleneck for a specific topic (unlikely for highway-heavy Lua today).

**Target architecture** — combine correctness of the monolithic clip with per-topic narrowing **without** re-scanning the full download:

```
monolithic tags-filter ONCE (on download)
  → bbox extract ONCE (shared clip, ~Berlin size)
    → per-topic narrow tags-filter on the clip ONLY
      → osm2pgsql
```

Properties:

- One expensive Brandenburg pass (same as today).
- Narrow osmium runs on ~100 MB clip, not ~325 MB region.
- Topology inside the clip matches the legacy monolithic → bbox order.

Do **not** repeat: per-profile `tags-filter` on the full regional download before bbox.

## Related docs

- [`osm2pgsql-number-processes.md`](osm2pgsql-number-processes.md) — thread-pool benchmarking on the same host class
