# infraVelo Radnetz Berlin

Which OSM ways, and which of their derived side lines, belong to the Berlin cycling network (Radnetz Berlin), and with which class. TILDA shows this as a pseudo relation in `route_relations`, e.g. `radnetz_berlin:Vorrangnetz`. Why it is modelled like a route: [topics/roads_bikelanes/route_relations/README.md](../../topics/roads_bikelanes/route_relations/README.md).

## a. Source

The project `infravelo-radnetz` matches the network delivery (2025, later 2026) to OSM and writes **one** CSV for the whole project. There is only ever this one file.

```
osm_id,id_suffix,infravelo_netz
812944114,,V
4425411,cycleway/left,V
4425411,cycleway/right,V
```

- `osm_id`: OSM way id
- `id_suffix`: second part of the TILDA id; empty for the way itself, otherwise `cycleway/left`, `cycleway/right`, `sidewalk/left`, `sidewalk/right`
- `infravelo_netz`: `V` Radvorrangnetz, `E` Radergänzungsnetz, `S` sonstiges Netz
- At most one row per (`osm_id`, `id_suffix`); several rows per `osm_id` (the way and its sides)

## b. Get the data

- The CSV is checked into the public repo `infravelo-radnetz` ([`tilda-pseudo-tags/`](https://github.com/FixMyBerlin/infravelo-radnetz/tree/main/tilda-pseudo-tags), background in [private-issues#3755](https://github.com/FixMyBerlin/private-issues/issues/3755)). Its content is public anyway: every line in the tiles carries its TILDA id and class.
- `download.ts` fetches it on every run from https://raw.githubusercontent.com/FixMyBerlin/infravelo-radnetz/main/tilda-pseudo-tags/infravelo-netz.csv to `/data/pseudoTagsData/infravelo_netz.csv` (about 350 KB, so no change detection).
- A new delivery is a commit in `infravelo-radnetz`; the next TILDA run picks it up.
- Diffing workflow (`PROCESSING_DIFFING_MODE`): `fixed` keeps the CSV of the reference run, all other modes download.
- A failed download never stops the processing: the file from the last run is used, or none (then the pseudo relation is skipped).

## c. Use the data

- `load_merged_pseudo_tags.lua` reads the CSV and translates `V`/`E`/`S` into `Vorrangnetz`, `Ergänzungsnetz`, `Sonstiges`.
- `apply_pseudo_tags.lua` keeps the classes of a way per suffix (`_radnetz_berlin`).
- `route_relations/pseudo_route_relations.lua` picks the class of exactly the line being written (way or side, from its TILDA id) for `roads`, `roadsPathClasses` and `bikelanes`.
- The value is public (tiles, inspector, exports), like the OSM route relations.
