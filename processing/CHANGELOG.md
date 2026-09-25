# Changelog of schema changes

Manual and incomplete list of changes to processing output. Attribute documentation for all datasets lives in `topic-docs/` YAML (built into in-app docs via `topic-docs-build`); this file tracks schema and value-contract changes over time.

## 2026-09

### `bikelanes`, `routing`

- Rename `parent_highway` → `parent_road`. Value is the TILDA `roads.road` class of the parent centerline (same classifier as `road`), not the raw OSM `highway`.
- `adjoining_road`: on non-crossings a usable OSM `is_sidepath:of` wins over the sidepath CSV (mapper override). Unusable `:of` (typo, street name, trunk) falls through to the CSV. Crossings stay CSV-only. `:of` does not produce `residential_priority_road`; the coarser class is kept. CSV maxspeed is kept only when it belongs to the published class.
- New `todos_lines` id `adjoining_of_vs_csv` when non-crossing `:of` and CSV differ. Table-only; crossings are not listed (the two sources name different roads).

### `routing` (experimental)

- New table: score-free road + bike edges for routing. **One row per source object**: one OSM way can become several rows (carriageway, left/right lanes), but never two rows for the same object. Direction lives in `oneway` / `oneway_motor` plus the geometry direction, like most routers expect (one edge + direction flags).
- Edge type is the `source_table` tag: `roads` (carriageway, mixed traffic), `bikelanes` (left/right/self bike infra from OSM tags), `roadsPathClasses` (path-like highway without bike infra). `id` equals `source_id` (`way/{id}`, bikelane ids like `way/{id}/cycleway/left`). Exception: a Mittellage lane on the centerline gets `way/{id}/cycleway/self` so it does not clash with the carriageway `way/{id}`; its `source_id` is still `way/{id}`.
- `oneway` is always `yes` or `no` (can a cyclist ride against the line?). With `yes` the geometry points in the legal direction (OSM `oneway=-1` → reversed). Bike infra edges map `bikelanes.oneway`: `implicit_yes` → `yes`; `assumed_no` and `car_not_bike` → `no`.
- `oneway_motor=yes` (carriageway and self bike infra such as Fahrradstraße): cars are one-way, bikes ride both ways. Geometry points along the car direction, so riding against the line is contraflow.
- Left/right bike lanes stay on the road centerline like `bikelanes`: left (`offset` > 0) runs against the OSM way, right runs with it.
- Carriageway edges always use `mixedTrafficMotor` (assigned in processing, never a `bikelanes.category`). Path edges keep a non-infra self category id when present, else `mixedTrafficFoot`. Unclear / non-indexable `bikelanes.category` values are still emitted when cycling is allowed.
- Self bike infra on the centerline (Fahrradstraße, Fußgängerzone Rad frei, shared path on a service road) replaces the carriageway edge. A Mittellage lane (`cyclewayOnHighwayBetweenLanes`, unclear Mittellage as `needsClarification`) is added next to the carriageway edge instead.
- Dropped when cycling is not allowed (`bicycle` access `no`/`private`/…), when `informal=yes` and bicycle access is unresolved, when own or parent `highway` is `motorway`/`trunk` (including `_link`), or when a path edge would not enter `roadsPathClasses` (OSM sidewalk/sidepath, indoor, informal, destination/customers access — same helper as the roads writer).
- Tags: `category`, `road`, `parent_road`, `maxspeed` (carriageway own speed), `adjoining_road`, `adjoining_maxspeed` (motor road beside the bike infra: on `side=self` same value as `bikelanes`, on `side=left|right` the parent road's class and speed from `bikelanes.parent_road` / `parent_maxspeed`), `access_bicycle` (resolved bicycle access, including `use_sidepath` and `dismount`; those edges stay in the graph; not set on left/right lanes, which do not inherit the carriageway's access), `prefix`, `offset` (left/right lanes only; same visual sideways shift as `bikelanes`), `side`, `oneway`, `oneway_motor`, plus `name`/`length`/`surface`/`smoothness`/`width` when present. Docs: `topic-docs/roads_bikelanes/routing.yaml`.
- Join keys in `tags` (same `id`/`tags`/`meta`/`geom`/`minzoom` shape as other rendering tables; `parent_id` and `source_id` have expression indexes): `parent_id`, `source_table`, `source_id`. Path edges always join `roadsPathClasses`.
- `minzoom`: major TILDA `road` classes → 8; minor roads → 10 if length ≥ 250 m else 12; paths/tracks/service/sidepaths → 12 if length ≥ 500 m else 13.
- Export: can be enabled per region (`/api/export/{region}/routing`).
- **Experimental:** schema, ids, direction rules, and categories may still change. Do not treat this table as a stable contract yet.

### `todos_lines`

- Rename column `table` → `source_table` (same values `bikelanes` / `roads`; unique `(id, source_table)`). Tile/inspector property follows the new name.

### `bikelanes`

- Rename `_parent_highway` → `parent_highway` (OSM `highway=*` of the parent centerline for mapped-on-road / derived segments). Inspector composit lookup follows the new key.
- Add `parent_maxspeed` on those derived segments (same maxspeed derivation as the parent road).
- Add `adjoining_road` and `adjoining_maxspeed` on path-like / sidepath features: indicator of danger from nearby motor traffic (class and maxspeed of the relevant road, not membership). Parallel accompanying street on sidepaths; the crossed street on crossings. Sources: sanitized OSM `is_sidepath:of` wins on non-crossings; otherwise the previous run’s sidepath estimation (`roads.road`); crossings use the estimation only. Also set on independently routed paths next to a motor road. Fahrradstraße / Fußgängerzone-Rad-frei do not get `adjoining_*`.
- `oneway`: `oneway:bicycle=no` together with `oneway=-1` is now `car_not_bike` (same as `oneway=yes`), so contraflow cycling is recognized on reversed oneways.

### `roadsPathClasses`

- Add `adjoining_road` and `adjoining_maxspeed` (same nearby-motor-road meaning as `bikelanes`).

### `parkings`, `parkings_no`, `parkings_quantized`

- `meta` (`updated_at`, `updated_by`, `changeset_id`) is filled again (was `{}`). A merged parking line keeps the meta of its most recently edited source way; quantized points inherit it.

### `off_street_parking_areas`, `off_street_parking_quantized`

- `meta` now comes from the OSM object and carries `updated_at`, `updated_by` and `changeset_id` (was empty). Obstacle and crossing source data got the same fix.

### `parkings_edges`

- New table: zoomed-out on-street parking network. One linestring per chain between graph vertices (degree ≠ 2). Object id is the OSM node pair `start_node`-`end_node` (suffix when two geometries share the same pair). The network is the same `has_parking` ways as on-street parking lines (including service/driveways with explicit `parking:*` tags).
- `capacity_left` / `capacity_right` are the public stall sums on that kerb (`operator_type=public`). `capacity_private_left` / `capacity_private_right` are the private sums when present (omitted when 0). `parkings_no` is excluded.
- Per side, the operator with more (rounded) capacity wins (tie → public). `operator_type_*`, `condition_category_*`, `parking_*`, and `surface_*` come from that subset only and are omitted when the rounded capacity is 0.
- `minzoom`: length < 50 m → 13, else 0. On-street `parkings` lines are no longer tiled below z14; this table is the overview.
- Capacity on each edge comes from `parkings` that overlap that edge's clipped kerb (node-node piece), not a length share of the whole OSM way. A parking line that straddles a junction is split by intersection length. Separately mapped parking areas (`source=separate_parking_areas`, street_side and lane) are matched to the nearest kerb within 6 m; a parking whose pieces are all below 20% of its length keeps its largest piece.

### `parkings`

- `minzoom` is 14 (was 0). The TILDA map at low zoom shows `parkings_edges`.
- Add `condition_category_primary`: first matching token from `condition_category` in the map-style priority list. Rendering only; the full string remains in `condition_category`.
- Separate `street_side` `side` (left/right) uses the highest-scoring nearby road, not a sum of all nearby ways. Any weakly matching neighbour (not only footways) can no longer flip the side with an unweighted ±1 vote.

### `off_street_parking_areas`

- `minzoom` follows polygon area (m²): < 200 → 14, ≥ 200 → 13, ≥ 600 → 12, ≥ 2500 → 11, ≥ 10000 → 10 (was always 0). Labels stay at least z11.
- Add `condition_category_primary` (same as `parkings`). Also written on `off_street_parking_points`; quantized points inherit it from areas.

### `bikelanes`

- Geometry now stays on the road **centerline**. Bikelane geometries derived from the centerline are no longer shifted sideways in the database (removed the `ST_OffsetCurve` step in the former `2_move_bikelanes.sql`). This makes geometry-based analyses simpler: no artificial left/right displacement to account for, and the two sides of a street share the same reference line.
- **Geometry direction** of derived bikelanes: `…/right` runs in the **OSM way direction**. `…/left` (`offset` > 0) runs against the OSM way, in right-hand-traffic flow. On `…/left` rows, `mapillary_forward`/`mapillary_backward` and `traffic_sign:forward`/`traffic_sign:backward` are swapped so they follow that line. Right and centerline rows keep OSM way direction.
- The `offset` attribute is unchanged in meaning (signed meters, `+` left / `-` right, half the road width) but is now consumed **only by the map style** for a visual `line-offset`, not by the database geometry. It was added to the bikelanes tile `stylingKeys` so it is available at all rendered zoom levels.
- Map-style note: the sideways separation is reproduced visually for **line** layers via a zoom-scaled `line-offset` derived from `offset`. The meter→pixel conversion is calibrated for ~52.5° latitude (center of Germany) and is off by roughly ±9% at the edges of Germany. **Symbol/text** layers placed along the line (width/surface/traffic-sign labels, `symbol-placement: line-center`) cannot be perpendicular-offset via the style and now render on the centerline.

## 2026-06

### All tables

- Move attribute documentation into `topic-docs/` YAML for all datasets. Parking tables already used this system; atlas topics (`barrierAreas`, `barrierLines`, `roads`, `roadsPathClasses`, `bikelanes`, `bikelanesPresence`, `bikeSuitability`, `bikeroutes`, `boundaries`, `landuse`, `places`, `poiClassification`, `publicTransport`, `bicycleParking_points`, `trafficSigns`, `todos_lines`) and additional parking tables (`parkings_quantized`, `off_street_parking_quantized`) are now documented the same way.
- Documented attributes, allowed values, and cross-table refs are validated by `topic-docs-build` and `topic-docs-coverage-check`.
- Add `minzoom` column to all output tables. Values are derived from map styles and topic-specific generalization settings (replacing hard-coded or style-only zoom logic where it existed before).
- Refactor all processing topics to a unified data contract (barrier pattern): geometry modules own filters and table definitions; `result_tags` builders apply explicit sanitizers; unknown values are logged via `separate_tags` and not persisted.
- Reserve `osm_*` keys for documented raw passthrough only. Remove duplicate `osm_*` copies of fields that are already exported as sanitized semantic keys.
- Shared sanitizers in `topics/helper/sanitize_tags.lua` enforce predictable value ranges (for example `access=yes` → `public`, string fields stripped of control characters).

### `poiClassification`

- Unknown `shop`, `amenity`, `tourism`, or `leisure` values now map to `*-fallback` type suffixes (for example `shop-fallback`) instead of passing through raw OSM values.
- Category resolution uses alias mapping (for example `shop=beauty` → category `Einkauf`, `shop=cafe` → `Freizeit`).
- Import filtering for amenity/tourism/leisure values is stricter and aligned with the documented allowlists.

### `barrierAreas`, `barrierLines`

- Remove `circumference` from output tags. The value is still computed internally to filter elongated water areas but is no longer exported.
- Exclude ways with `attraction=amusement_ride` from barrier processing.

### `bicycleParking_points`

- Remove bulk `osm_*` passthrough copies of sanitized attributes. Keep `osm_capacity` and `osm_capacity:cargo_bike` for raw capacity strings only.
- Export sanitized semantic fields explicitly: `lit`, `position`, `indoor`, `maxstay`, `surface`, `surveillance`, `operator_type`.

### `landuse`

- Sanitize `access` through the shared access allowlist (`access=yes` → `public`, and so on).

### `places`

- Sanitize free-text fields (`name`, `website`, `wikidata`, `wikipedia`, `capital`, `population:date`) through `safe_string`.

### `trafficSigns`

- Apply explicit sanitizers for `traffic_sign`, direction fields, and documented `osm_traffic_sign:*` / `osm_direction` passthrough keys.

## 2026-01-14

### `bikelanes`

- Categorize bike infrastructure of `category=crossing` only when way is below 100 meters length. Otherwise it becomes `needClarification` and a todo-note given that those are most likely miss-taggings.

## 2025-12-11

### `roadsPathClasses`

- When a way (esp. `path`, `track`) in `roadsPathClasses` is also present in `bikelanes`, we now add `bicycle_self` (mostly), `bicycle_left`, `bicycle_right`. Those fields are only present when a `bikelanes.category` is present. The keys follow what we have for `roads` and `bikelanesPresence` but behave a bit differently to keep the data slim.

### `bikelanes`

- (Beta) Add `width_effective` to `bikelanes`. This value is considered experimental for now and will likely change later when we rework how we process `width`.

## 2025-11-26

### `bikelanes`

- Categorize `cycleway:SIDE=lane` + `cycleway:SIDE:lane=crossing` as `category=crossing`.
- The conditions for protected bike lanes `category=cyclewayOnHighwayProtected` exclude `cycleway:SIDE=share_busway` cases; those are correctly categorized as `sharedBusLaneBusWithBike` even when physical separation is present.

## 2025-11-20

### `bikelanes`

- Sometimes ways are marked `access=no` due to road closures. We use our `lifecycle` system to show those in TILDA as `lifecycle=blocked`.
  We check `note` and `description` for a fixed set of terms.
- The conditions for protected bike lanes `category=cyclewayOnHighwayProtected` are now stricter:
  - `cycleway:SIDE:lane=advisory` means the category is never applied
  - `cycleway:SIDE:traffic_mode:left=parking` only applies when also `segregated` is missing; this helps to separate infra on the highway from infra off highway ("Seitenraum")

## 2025-10-27

### `bikelanes`

- `traffic_sign`: For `category=cyclewayOnHighwayBetweenLanes` (Radweg in Mittellage), set `traffic_sign=never` unless a traffic sign is specified by the `traffic_sign:lanes` schema (which we never expect to happen).
- `traffic_sign`: Allow free text traffic sign values. Before, only values prefixed with `DE:` (and error cases) where allowed.

## 2025-10-23

### `bikelanes`, `roads`, `roadsPathClasses`

- Treat the combination of `access=no` with an indication that the road is blocked due to construction as a `lifecycle="construction_no_access"` case. This allows adding temporarily blocked ways to the data by checking for construction-related terms in `access:reason`, `description`, or `note` fields (case-insensitive matching for "construction" and "baustelle"). This will check for `access=no` but also `highway=cycleway+bicycle=no` / `highway=footway+foot=no`.

## 2025-10-13

### `bikelanes`

- For `category=crossing`, use the `surface` from the parent highway if none is given and data is derived from the centerline (tagged as `cycleway:SIDE=crossing`)

## 2025-10-09

### `bikelanes`, `roads`, `roadsPathClasses`

- Exclude ways that are tagged [`leisure=track`](https://wiki.openstreetmap.org/wiki/Tag:leisure%3Dtrack). Sometimes they have a double use, bust generally they are private and not part of the every day road network.

### `bikelanes`

- Include ways tagged with `highway=path + foot=no + bicycle=designated`. They become `category=needsClarification` and have a todo campaign on radinfra.de to resolve the unexpected tagging. Usually those can be retagged as `highway=cycleway`.

### `roads`, `roadsPathClasses`

- Transform `highway=path + foot=yes|designated|nil + bicycle=no` into a `highway=footway` and `highway=path + foot=no + bicycle=yes|designated|nil` into a `highway=cycleway`.
- Exclude ways with `access=customers` (all access keys).

## 2025-10-03

### `bikelanes`

- Include ways on `highway=track` when also bike tagging present; those get a TILDA `description` notice when shared with other traffic modes.
- Use the `width:lanes`, `surface:colour:lanes`, `surface:lanes`, `source:width:lanes`, `smoothness:lanes` data for `cyclewayOnHighwayBetweenLanes`.
- If no `cycleway:right:width` is given for `cyclewayOnHighway*`, look at the last value of `width:lanes`.

## 2025-09-24

### `bikelanes`

- Fix duplicated geometries for some `sharedBusLaneBusWithBike`, `sharedBusLaneBikeWithBus` cases

## 2025-09-11, -16

### `bikelanes`

- Add attributes `operator_type`, `covered`, `informal`
- Include ways that are privately operated, indoor or informal
- Include ways that are `access=destination` in the data
- Include ways on `highway=service` when also bike tagging present; those get a TILDA `description` notice when shared with other traffic modes.
- Categorize bicycle roads with "Kfz frei" as `bicycleRoad_vehicleDestination`

### `roads`, `roadsPathClasses`

- Add attributes `operator_type`, `covered`
- Include ways that are privately operated (still excluding indoor, informal)
- Include ways on `highway=service` when also bike tagging present

## 2025-07-29

### `roads`, `roadsPathClasses`, `bikelanes`

- Ways in `construction` are now transformed into their provided infrastructure, including prefixed data `construction:*`
- With `lifecycle=construction` to indicate this transformation
- And `lifecycle=temporary` to indicate temporary ways during construction (based on `temporary=yes`)

## 2025-07-14, -16

### All tables

- Add `updated_by` as the OSM user name of the account to last change this object
- Add `changeset_id` as the id of the OSM changeset
- Modify `updated_at` which was a time string and is now the time in seconds since the epoch (midnight 1970-01-01)
- Remove `updated_age`, use `updated_at` instead

## 2025-07~07

### `bikelanes`, `roads`

- Introduce `mapillary`, `mapillary_forward`, `mapillary_backward`, `mapillary_traffic_sign`

  For `bikelanes` mapped on the centerlines those are the `cycleway:left|right:*` tags with a fallback to the centerline tags.

## 2025-07~02

### `bikelanes`

- Introduce `surface_color` as sanitized value
- Remove `osm_surface:colour`

- Introduce `separation_left`, `separation_right` as sanitized values
- Introduce `marking_left`, `marking_right` as sanitized values
- Introduce `traffic_mode_left`, `traffic_mode_right` as sanitized values
- Introduce `buffer_left`, `buffer_right` as number (meters) values
- Remove `osm_separation*`, `osm_marking*`, `osm_traffic_mode*` values
- Rename bikelane category `cyclewayOnHighwayProtected` (was: `protectedCyclewayOnHighway`)
- Improve bikelane category `cyclewayOnHighwayProtected`

### `roads`, `roadsPathClasses`

- Rename `road_oneway` to `oneway_road`
- Rename `road_oneway:bicycle` to `oneway_bicycle`
- Remove `highway=service + service=drive-through` from the data; we did not render this

## 2025-06

### `roads*`, `bikelanes`

- Rework `surface` sanitization
- Introduce `surface=mosaic_sett|small_sett|large_sett`

## Older changes

Older changes are not tracked here.
