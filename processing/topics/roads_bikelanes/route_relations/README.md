# `route_relations`: which routes a way belongs to

Decided and built in October 2026 ([private-issues#3432](https://github.com/FixMyBerlin/private-issues/issues/3432)). This file records why it works the way it does, what it costs, and when to rethink it.

## What it is

Ways in `roads`, `roadsPathClasses` and `bikelanes` get `route_relations`: the OSM route relations they belong to (`bicycle`, `mtb`, `bus`, `foot`, `hiking`) and networks from external data such as the Radnetz Berlin, e.g. `bicycle:2788485;bus:1234567;radnetz_berlin:Vorrangnetz`. The format is described in the topic-docs chapter [`routen.md`](../../../../topic-docs/roads_bikelanes/chapters/routen.md); why it looks like this: [comment on #3432](https://github.com/FixMyBerlin/private-issues/issues/3432#issuecomment-6170890683).

## How it is built (approach "B")

1. `roads_bikelanes` `process_relation`: for every route relation of a listed type, write one row per member way (`osm2pgsql.way_member_ids`) into the processing-internal table `_routeRelationMembers`.
2. [`6_route_relations.sql`](../6_route_relations.sql): aggregate the rows per way and write `tags.route_relations` onto the three tables.

It all happens in one topic, so it also works with `PROCESS_ONLY_TOPICS=roads_bikelanes` and `SKIP_UNCHANGED`. osm2pgsql processes ways before relations, so the membership is not known while Lua processes a way. That's why the attach is a SQL step after the import.

Networks from external data use approach "C": a pseudo tag CSV is read in Lua and written per output line, because the way and each of its sides can be in different classes ([`pseudo_route_relations.lua`](pseudo_route_relations.lua), source: [`pseudoTags/infraveloNetzSource/README.md`](../../../pseudoTags/infraveloNetzSource/README.md)).

## Why this approach

Three ways were built and benchmarked on Berlin+Brandenburg (5 alternating rounds, 2026-10-14). Raw results and the benchmark code (runner, monitor, variants A/B/C as a patch) are archived in a [comment on #3432](https://github.com/FixMyBerlin/private-issues/issues/3432#issuecomment-6171446421).

| Approach                       | How                                                                          | Extra time on the nightly path                                   | Verdict                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| A: osm2pgsql two-stage         | `select_relation_members` marks member ways; stage 2 reprocesses them in Lua | **+25–30 s (+15–20 %)** on `roads_bikelanes`, clearly measurable | Not chosen: still needs the same SQL attach, pays for reprocessing ~50k ways |
| **B: member table + SQL join** | as above                                                                     | not measurable against run-to-run noise (±15–25 s); attach ~2 s  | **Chosen**: smallest, conventional, same-run                                 |
| C: pseudo-tag CSV              | afterthought exports way→relation CSV, next run imports it in Lua            | not measurable; export < 1 s                                     | Not chosen: 1 day delay; only needed if Lua must _use_ the membership        |

All three produced identical coverage (34,279 roads, 12,891 paths, 19,147 bikelanes with a bicycle route).

## What it costs (Brandenburg, all five types, 2026-10-14)

- Relation pass: 4 s for 20,187 relations; SQL step: 7 s.
- `_routeRelationMembers`: 879,681 rows, 55 MB. Bus makes up 75 % of them.
- Ways with `route_relations`: roads 102,749 of 307,649, paths 32,375 of 438,027, bikelanes 35,539 of 71,403.
- Value length on roads: average 42, p95 124, max 810 characters. In Berlin, a single way can be in up to 95 bus relations (estimate from the Berlin extract).

Germany has not been measured.

## When to rethink

Related topics that need a different mechanism (nodes on ways, native MLT): [comment on #3432](https://github.com/FixMyBerlin/private-issues/issues/3432#issuecomment-6170918313).

- **Lua needs the membership while processing a way**, e.g. a way is classified differently because it is on a Radschnellverbindung. B cannot do this; the SQL step runs after Lua.
  - Use **A** if the result must be from the same run and +15–20 % on `roads_bikelanes` is acceptable.
  - Use **C** if one day of delay is fine; it costs almost nothing.
- **More route types or networks:** watch the value length and tile size; bus already dominates.
- **Tiles get too heavy on busy streets:** limit which types go into the tiles, e.g. exclude `bus` at low zoom via `stylingKeys`, before changing the format.
- **Processing time grows noticeably:** rerun the benchmark runner from the archived patch. It measures both topics plus the attach step per variant, alternates rounds and records CPU, RAM and disk.
