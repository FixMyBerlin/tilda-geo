# Sidepath pseudo tags

This folder contains roads_bikelanes sidepath pseudo-tag logic:

- sidepath CSV loader and lookup helper (`_is_sidepath`)
- dedicated source table writer for sidepath estimation input
- SQL export pipeline for `is_sidepath_estimation.csv`
- sidepath export entry used by `processing/steps/afterthoughts.ts`

### Skip unchanged export

In the afterthoughts phase (after `Processing: Finished`), `exportSidepathData` builds `is_sidepath_estimation.csv` from the current DB for the **next** run. Whether `roads_bikelanes` ran is taken from `ranTopics` (the set returned by `processTopics`), not from `willSkipTopic()` — hashes are updated during the run, so a fresh skip check at afterthought time can disagree with what actually executed. When `roads_bikelanes` did not run (`SKIP_UNCHANGED`, `PROCESS_ONLY_TOPICS`, weekend schedule, etc.), export is skipped only if an existing CSV is present; otherwise export runs from the current DB. When `roads_bikelanes` ran this run, the CSV is always regenerated from the fresh DB even if the OSM file and `pseudo_tags_sidepath/` are unchanged.

Mapillary pseudo-tag helpers are intentionally kept in:
`processing/topics/roads_bikelanes/pseudo_tags_mapillary_coverage/`.
