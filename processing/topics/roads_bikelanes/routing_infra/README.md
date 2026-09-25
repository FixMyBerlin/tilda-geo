# Routing (`routing`)

Score-free directed road+bike edges for routing. Processing writes to `routing` (`roads_bikelanes_tables.lua`).

## Mental model

- One OSM way → **0..N rows** (directed travel edges).
- Carriageway edges use **travel-oriented geometry** (line direction matches legal cycling direction).
- Virtual bikelanes stay on the centerline. Left side (`offset` > 0) runs against the OSM way, same as `bikelanes`. Right side runs with the OSM way.
- Segments are distinguished by **`segment_id`**, **`side`**, and **`prefix`**.
- Join keys (in `tags`, like every rendering table; `parent_id` and `source_id` have expression indexes): **`parent_id`**, **`source_table`**, **`source_id`**. `source_table` is the edge type. Carriageway edges join `roads` on `way/{id}`; bikelane edges join `bikelanes` on the same id as `bikelanes.id`; path edges always join `roadsPathClasses` (category is the non-infra self cycleway id when present, else `mixedTrafficFoot`).

### Join symmetry (path edges ⊆ `roadsPathClasses`)

`routing` does not copy full tags. Consumers join `source_table`/`source_id`. That only works if every emitted join key exists in the target table.

| `source_table`     | Edge                                          | Must exist in that table          |
| ------------------ | --------------------------------------------- | --------------------------------- |
| `roads`            | Carriageway (`mixedTrafficMotor*`)            | `roads.id = source_id`            |
| `bikelanes`        | Bikelane infra (left/right/self)              | `bikelanes.id = source_id`        |
| `roadsPathClasses` | Path (self category id or `mixedTrafficFoot`) | `roadsPathClasses.id = source_id` |

How to keep the last row true: **do not emit a path edge unless `roads_bikelanes_roads.lua` would insert the same OSM way into `roadsPathClasses`.** Both writers call `excluded_from_roads_tables.lua` (OSM sidewalk / `parent_road` sidepath, indoor, informal, `access`/`foot` in `private|no|delivery|permit|destination|customers`). If you change path-table inclusion, change that helper — not a copy in `build_segments`.

Do **not** run `excluded_from_roads_tables` / `category_is_sidepath` on bikelane edges. `category_is_sidepath` is true when `parent_road` is set, which would drop centerline-derived `footwayBicycleYes*` / `sidewalk:*` that must stay (they join `bikelanes`, not the path table). Apply the helper only on the path-edge branch.

Check: after processing, `routing` rows with `tags->>'source_table' = 'roadsPathClasses'` left-joined to `roadsPathClasses` on `tags->>'source_id' = id` must have 0 misses.

### Edge types (`source_table`)

| `source_table`     | When                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bikelanes`        | Any cycleway object with `infrastructureExists` and a category (left/right from OSM side tags, or self)                                                                                                                              |
| `roads`            | Motor-road classes, unless self infra uses the centerline id (Fahrradstraße, Fußgängerzone, …); mixed-traffic directed edges (`mixedTrafficMotor*`). A Mittellage lane (`cyclewayOnHighwayBetweenLanes`) keeps the carriageway edges |
| `roadsPathClasses` | Path-like highway without bikelane infra (self category id when present, else `mixedTrafficFoot`)                                                                                                                                    |

### Exclusions

Segments are skipped when (`inclusion_rules.lua` / `build_segments.lua` / `excluded_from_roads_tables.lua`):

| Condition                                                                                                          | Result   |
| ------------------------------------------------------------------------------------------------------------------ | -------- |
| `informal=yes` with no resolved `bicycle` access                                                                   | excluded |
| Disallowed `bicycle` access (`no`, `private`, …)                                                                   | excluded |
| Own or parent `highway` in `motorway`/`motorway_link`/`trunk`/`trunk_link`                                         | excluded |
| Any path edge that `roadsPathClasses` omits (sidewalk/sidepath, indoor, informal, destination/customers access, …) | excluded |
| `footwayBicycleYes*` and other bikelane categories on a sidewalk                                                   | kept     |

Unlike CQI scoring, **non-indexable categories** (`needsClarification`, `data_no`, …) are still emitted when cycling is allowed.

### Pipeline

```
build_segments → inclusion_rules.exclude_segment → resolve_motor_road_context → build_public_tags → routing
```

Writer: `roads_bikelanes_routing_infra.lua`. Topic-docs: `topic-docs/roads_bikelanes/routing.yaml`.

CQI scoring lives on the CQI branch — see `cycling_quality_index/README.md`.
