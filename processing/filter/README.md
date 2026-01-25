# About

**Osmium Tag Filter** are used in [`tagFilter`](/processing/steps/filter.ts).
They are checked in and always applied.

**Osmium Bbox Filter** are used in [`bboxesFilter`](/processing/steps/filter.ts).
They are only used when .env `PROCESS_ONLY_BBOX` is active and never checked in.

**ID Filter** is used in [`idFilter`](/processing/steps/filter.ts).
It is only used when .env `ID_FILTER` is active (for testing/debugging specific OSM IDs).
