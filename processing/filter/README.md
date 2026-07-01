# About

**Osmium Tag Filter** are used in [`nightlyTagFilter`](/processing/steps/filter.ts) and [`weekendTagFilter`](/processing/steps/filter.ts).
They are checked in and always applied.

The nightly filter ([`filter-expressions-nightly.txt`](/processing/filter/osmiumTagFilter/filter-expressions-nightly.txt)) runs once on every pipeline run. Weekend-heavy tags (`wr/landuse`, `wr/building`, `wr/leisure`) live in [`filter-expressions-weekend.txt`](/processing/filter/osmiumTagFilter/filter-expressions-weekend.txt) and are applied from the regional download only for topics with `schedule: 'weekend'`. `wr/leisure` is currently also kept in the nightly filter to preserve existing POI/barrier behavior until relation ownership is cleaned up separately.

**Osmium Bbox Filter** are used in [`bboxesFilter`](/processing/steps/filter.ts).
When .env `PROCESS_ONLY_BBOX` is active, one bbox extract is created per active schedule PBF and reused for all topics on that schedule.
Without `PROCESS_ONLY_BBOX`, topic-specific bbox filters from topic config (for example `parking`) are used as before.
Generated bbox filter artifacts are never checked in.
