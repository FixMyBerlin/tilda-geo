# About

**Osmium Tag Filter** are used in [`tagFilter`](/processing/steps/filter.ts).
They are checked in and always applied.

**Osmium Bbox Filter** are used in [`bboxesFilter`](/processing/steps/filter.ts).
When .env `PROCESS_ONLY_BBOX` is active, a single global bbox extract is created and reused for all topics.
Without `PROCESS_ONLY_BBOX`, topic-specific bbox filters from topic config (for example `parking`) are used as before.
Generated bbox filter artifacts are never checked in.
