# Cycleway oneway corrections (Berlin)

Berlin ways with a wrong `cycleway:both:oneway=yes`, `cycleway:left:oneway=yes` or `cycleway:oneway=yes` on a two-way road (mostly tagged by FMC accounts in 2025). Read as the wiki says, these give left lanes and tracks that run with the way, against the cars next to them. TILDA corrects them before it derives the direction, as if the OSM edit were already done. The OSM edit runs in parallel; the list shrinks as it goes.

## a. Source

The project `infravelo-radnetz` finds the ways and checks their history ([`osm-cleanup/oneway-2026-11/`](https://github.com/FixMyBerlin/infravelo-radnetz/tree/main/osm-cleanup/oneway-2026-11), rules in its README). `scripts/build_cleanup.py` writes the CSV; it is regenerated about once a week and checked in.

```
osm_id
4316773
4323788
```

Only the ids: TILDA derives the change itself, see c.

## b. Get the data

- `download.ts` fetches https://raw.githubusercontent.com/FixMyBerlin/infravelo-radnetz/main/osm-cleanup/oneway-2026-11/cycleway-oneway-corrections.csv to `/data/pseudoTagsData/cycleway_oneway_corrections.csv` on every run.
- Diffing workflow (`PROCESSING_DIFFING_MODE`): `fixed` keeps the CSV of the reference run, all other modes download.
- A failed download never stops the processing: the file from the last run is used, or none (then nothing is corrected).

## c. Use the data

- `load_merged_pseudo_tags.lua` marks the listed ways, `apply_pseudo_tags.lua` calls `apply_cycleway_oneway_correction.lua` before the oneway tags are normalized.
- It removes the four `cycleway:*:oneway` keys where they are `yes`. On a covered side with a track it sets the side default (left `-1`, right `yes`), the same as the planned OSM edit.
- Ways last edited on or after 2026-11-22 count as corrected in OSM and stay as tagged, also false positives of the list.
