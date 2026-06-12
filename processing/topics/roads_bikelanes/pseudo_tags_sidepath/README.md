# Sidepath pseudo tags

This folder contains roads_bikelanes sidepath pseudo-tag logic:

- sidepath CSV loader and lookup helper (`_is_sidepath`)
- dedicated source table writer for sidepath estimation input
- SQL export pipeline for `is_sidepath_estimation.csv`
- sidepath export entry used by `processing/steps/afterthoughts.ts`

### Skip unchanged export

In the afterthoughts phase (after `Processing: Finished`), `exportSidepathData` builds `is_sidepath_estimation.csv` from the current DB for the **next** run. When `roads_bikelanes` did not run (`SKIP_UNCHANGED`, `PROCESS_ONLY_TOPICS`, or global reruns), export is skipped only if an existing CSV is present for the next run; otherwise export runs from the current DB. When the topic ran but the OSM file and `pseudo_tags_sidepath/` are unchanged, an existing CSV is reused.

Mapillary pseudo-tag helpers are intentionally kept in:
`processing/topics/roads_bikelanes/pseudo_tags_mapillary_coverage/`.
