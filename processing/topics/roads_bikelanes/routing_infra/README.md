# Routing (`routing`)

Score-free road+bike edges for routing. Processing writes to `routing` (`roads_bikelanes_tables.lua`).

## Mental model

- One OSM way → **0..N rows**, but **one row per source object** (carriageway, each left/right lane, the path). No row is split by travel direction.
- Direction: **`oneway=yes|no`** (may a cyclist ride against the line?) plus geometry direction. With `yes` the line points in the legal direction (OSM `oneway=-1` → reversed).
- **`oneway_motor=yes`**: cars are one-way, bikes ride both ways (carriageway, Fahrradstraße). The line points along the car direction, so riding against it is contraflow. Routers can use this for a separate reverse cost.
- Left/right lanes stay on the centerline and use the same line direction as `bikelanes`: lines point in the riding direction (`cycleway:<side>:oneway`; without it right with the OSM way and left against it, on a oneway road both in the road direction). Two-way lanes keep left against and right with the OSM way. `offset` is signed relative to that line (`+` left / `-` right).
- Segments are distinguished by **`segment_id`**, **`side`**, and **`prefix`**.
- Join keys (in `tags`, like every rendering table; `parent_id` and `source_id` have expression indexes): **`parent_id`**, **`source_table`**, **`source_id`**. `source_table` is the edge type. Carriageway edges join `roads` on `way/{id}`; bikelane edges join `bikelanes` on the same id as `bikelanes.id`; path edges always join `roadsPathClasses` (category is the non-infra self cycleway id when present, else `mixedTrafficFoot`).

### Join symmetry (path edges ⊆ `roadsPathClasses`)

`routing` does not copy full tags. Consumers join `source_table`/`source_id`. That only works if every emitted join key exists in the target table.

| `source_table`     | Edge                                          | Must exist in that table          |
| ------------------ | --------------------------------------------- | --------------------------------- |
| `roads`            | Carriageway (`mixedTrafficMotor`)             | `roads.id = source_id`            |
| `bikelanes`        | Bikelane infra (left/right/self)              | `bikelanes.id = source_id`        |
| `roadsPathClasses` | Path (self category id or `mixedTrafficFoot`) | `roadsPathClasses.id = source_id` |

How to keep the last row true: **do not emit a path edge unless `roads_bikelanes_roads.lua` would insert the same OSM way into `roadsPathClasses`.** `roads_bikelanes_roads.lua` skips a way for `roads` / `roadsPathClasses` when `category_is_sidepath` says so (OSM sidewalk / `parent_road` sidepath) or when `context.restriction.level` is `roads` (see § Exclusions). `build_segments` drops path edges in the same two cases. If you change path-table inclusion, change `category_is_sidepath` or `helper/access_restriction.lua` — not a copy in `build_segments`.

Do **not** run `category_is_sidepath` on bikelane edges. `category_is_sidepath` is true when `parent_road` is set, which would drop centerline-derived `footwayBicycleYes*` / `sidewalk:*` that must stay (they join `bikelanes`, not the path table). Apply it only on the path-edge branch.

Check: after processing, `routing` rows with `tags->>'source_table' = 'roadsPathClasses'` left-joined to `roadsPathClasses` on `tags->>'source_id' = id` must have 0 misses.

### Edge types (`source_table`)

| `source_table`     | When                                                                                                                                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bikelanes`        | Any cycleway object with `infrastructureExists` and a category (left/right from OSM side tags, or self)                                                                                                                                                                                                       |
| `roads`            | Motor-road classes, unless self infra uses the centerline id (Fahrradstraße, Fußgängerzone, …); one mixed-traffic edge (`mixedTrafficMotor`). A Mittellage lane (`cyclewayOnHighwayBetweenLanes`) keeps the carriageway edge; the lane row gets id `way/N/cycleway/self` (unique next to carriageway `way/N`) |
| `roadsPathClasses` | Path-like highway without bikelane infra (self category id when present, else `mixedTrafficFoot`)                                                                                                                                                                                                             |

### Exclusions

Which ways are not public, and why, is decided once per way by `helper/access_restriction.lua` (tags only, before any geometry) and passed as `context.restriction` (`nil` = public). `exit_processing` keeps the hard exits (highway class, `area`, pier/track, `access=no`, `foot=no` on a footway, `bicycle=no` on a cycleway). The writers and `build_segments` read the level; there is no second list of access values.

| Level   | Reasons                                                                                                                                                                                    | `bikelanes`, `roads`, `roadsPathClasses`, other tables | Bikelane edge | Carriageway / path edge |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------- | ----------------------- |
| `way`   | `access` (and `foot` on footway, `bicycle` on cycleway) `private`/`delivery`/`permit`; `service=*` except `alley` (and except `bicycle=designated` / `bicycle:left\|right\|both` not `no`) | none                                                   | none          | none                    |
| `roads` | `access` (and `foot` on footway, `bicycle` on cycleway) `destination`/`customers`, unless the resolved `bicycle` is explicitly allowed; `indoor=yes`; `informal=yes`                       | no `roads` / `roadsPathClasses` row                    | kept          | none                    |

Precedence `way` > `roads`; `reason` (e.g. `access=destination`) is the strongest one. `access=private` & co. cannot be lifted. `service`, `indoor` and `informal` can: if the way has a hint of bike infrastructure (`may_have_bike_infra`: tag check, generous on purpose) and the bikelane categorisation then finds bike infrastructure of its own (`has_own_bike_infra`), the way is public again, including its `roads` row and carriageway / path edge. A way with `level = 'way'` that has no hint, or that the categorisation finds no bike infrastructure on, is written to no table.

`inclusion_rules.prohibited_highway` (motorway/trunk, own or parent `highway`) is the per-segment guard.

| Condition                                                                         | Result   |
| --------------------------------------------------------------------------------- | -------- |
| Own or parent `highway` in `motorway`/`motorway_link`/`trunk`/`trunk_link`        | excluded |
| Any path edge that `roadsPathClasses` omits (sidewalk/sidepath, or `roads` level) | excluded |
| `footwayBicycleYes*` and other bikelane categories on a sidewalk                  | kept     |

Unlike CQI scoring, **non-indexable categories** (`needsClarification`, `data_no`, …) are still emitted when cycling is allowed.

#### Cycling not allowed: `access_bicycle`

An edge where the resolved `bicycle` access (`bicycle` → `vehicle` → `access`) does not allow cycling (`bicycle=no`, `vehicle=destination`, `vehicle=private`, …) is a normal `routing` edge. It is published as `access_bicycle` (`no`, `destination`, `private`, `customers`, `delivery`, `permit`); the way keeps all its rows in the other tables. Routers decide on `access_bicycle`: an empty value (no access tag) or one of `sanitize_access_tags.routable_bicycle_access` (`yes`, `designated`, `permissive`, `use_sidepath`, `optional_sidepath`, `discouraged`, `dismount`) allows cycling, any other value does not. That set is the only list of routable values. Lanes derived from the centerline (`source_table=bikelanes`, `side=left|right`) do not inherit the carriageway's access.

### Pipeline

```
access_restriction (per way) → build_segments → inclusion_rules (prohibited_highway) → resolve_motor_road_context → build_public_tags → routing
```

`segment.tags` of carriageway and path edges is the raw OSM way, for the two steps in the middle. `build_public_tags` never publishes from it: those edges take `shared_result_tags` (same values as `roads` / `roadsPathClasses`), bikelane edges take their row from `extract_bikelanes`.

Writer: `roads_bikelanes_routing_infra.lua`. Topic-docs: `topic-docs/roads_bikelanes/routing.yaml`.

CQI scoring lives on the CQI branch — see `cycling_quality_index/README.md`.
