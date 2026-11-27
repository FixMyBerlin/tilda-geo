# Changelog of schema changes

Manual and incomplete list of changes to processing output. Attribute documentation for all datasets lives in `topic-docs/` YAML (built into in-app docs via `topic-docs-build`); this file tracks schema and value-contract changes over time.

## 2026-11

### `bikelanes`: `category` of `highway=cycleway` tagged as sidepath

- `highway=cycleway` with `cycleway=sidepath` is `cycleway_adjoining` (with `is_sidepath=no`: `cycleway_isolated`), like `is_sidepath=yes`; before `needsClarification`. The other sidepath tags count too, so the mistagging `highway=cycleway` + `footway=sidewalk` (5 ways in Berlin) is `cycleway_adjoining` now.
- These ways get the oneway default of adjoining cycleways (`oneway=implicit_yes`, `routing.oneway=yes`) and the todo `missing_oneway` instead of `needs_clarification`.
- On a road, `cycleway:<side>=sidepath` stays `needsClarification`.

### `bikelanes`: `category` of `highway=cycleway` with `traffic_sign=none`

- `highway=cycleway` with `traffic_sign=none` ('anderer Radweg', no mandatory-use sign) is `cycleway_adjoiningOrIsolated` (or `_adjoining` / `_isolated` with sidepath tags); before `needsClarification`.
- `highway=cycleway` without any `traffic_sign` stays `needsClarification`.

### `routing`: new attributes `tunnel`, `dual_carriageway`, `roundabout`

- `tunnel` is the sanitized value of `roads` / `bikelanes` (`yes`, also for `tunnel=building_passage`).
- `dual_carriageway=yes` when the edge belongs to one carriageway of a road with separated directions (`roads.oneway=yes_dual_carriageway`).
- `roundabout=yes` for ways with `junction=roundabout|circular`.

### `bikelanes`: `category`, `traffic_mode_left|right` – carriageway side of lanes on the road

- For lanes and tracks tagged on the road (`cycleway:left|right|both`), the second left/right (`…:separation:left`, `…:traffic_mode:left`, buffer, marking) is read in the riding direction of the lane ([Key:separation](https://wiki.openstreetmap.org/wiki/Key:separation)). The carriageway is usually left of the lane, but right of it when the lane rides with its line on the left side of the way, e.g. `cycleway:left=lane` on `oneway=yes` or `cycleway:right=lane` on `oneway=-1`. Before, the carriageway was always assumed on the left.
- `cyclewayOnHighwayProtected` needs the physical separation (or `traffic_mode=parking`) on the carriageway side now. Example: `oneway=yes` + `cycleway:left=lane` + `cycleway:left:separation:right=bollard` is protected, `…:separation:left=bollard` (kerb side) is not.
- Without an explicit `traffic_mode`, `parking:<side>` of the road becomes `traffic_mode_left` (kerb side) when the carriageway is right of the lane; before always `traffic_mode_right`.
- `separation_left|right`, `buffer_left|right`, `marking_left|right` and `traffic_mode_left|right` are published unchanged; they are relative to the published line in riding direction.
- Separately mapped cycleways ridden against their drawing direction (`oneway=-1`, `oneway:bicycle=-1`) have the road on the right of the way: `cyclewayOnHighwayProtected` checks `separation:right` there. No such way in Berlin has a separation that counts.
- A wrong `cycleway:left:oneway=yes` or `cycleway:both:oneway=yes` on a two-way road turns the left lane around, so its carriageway is right. In Berlin the FMC cases are corrected before (see the correction CSV below); other such tags give a wrong carriageway side until they are fixed in OSM.
- A contraflow lane on the left of a `oneway=yes` road (`oneway:bicycle=no`) needs `cycleway:left:oneway=-1`. Without it the lane is read as riding with the cars, and its detail tags and parking come out mirrored. About 50 Berlin ways are listed for mapping in FixMyBerlin/infravelo-radnetz#15 and #18.

### `bikelanes`: corrected direction of FMC cycleway oneway tags in Berlin (temporary)

- Ways in `cycleway-oneway-corrections.csv` (FixMyBerlin/infravelo-radnetz, `osm-cleanup/oneway-2026-11/`, about 2,400 Berlin ways) are corrected before the direction is derived: `cycleway:both|left:oneway=yes`, `cycleway:oneway=yes` and `cycleway:right:oneway=yes` are dropped, a track on a corrected side gets its side default (`cycleway:left:oneway=-1`, `cycleway:right:oneway=yes`). Same change as the planned OSM edit.
- Ways last edited on or after 2026-11-22 are used as tagged. The list is regenerated in that repo; TILDA downloads it on every run.
- Temporary: removed once the OSM edit is done (FixMyBerlin/infravelo-radnetz#12, #13).

### `bikelanes`, `roads`, `bikelanesPresence`: sidewalks and `cyclewayOnHighwayProtected`

- A protected bikelane (PBL) comes only from `cycleway:<side>=lane|track` on the road, a separately mapped `highway=cycleway`, or a separately mapped `highway=path` with `bicycle=designated`. Before, other ways with a physical separation (`separation:left=bump|bollard|…`) or parking on the left were PBLs, too: sidewalks mapped on the road (`sidewalk:<side>=*`), footways and e.g. `highway=service` sidepaths.
- A sidewalk mapped on the road (`sidewalk:<side>=*`) is only a bikelane with `sidewalk:<side>:bicycle=yes|designated` or a traffic sign; the category follows from these tags as for separately mapped sidewalks (e.g. `bicycle=yes` or `DE:1022-10` is `footwayBicycleYes_*`, `DE:240` is `footAndCyclewayShared_*`). Example: `sidewalk:right=lane` + `sidewalk:right:separation:left=bump` without bicycle tags was a PBL, now it is no bikelane.
- `sidewalk:<side>=separate|no` with bicycle tags no longer adds a bikelane on the road. The separately mapped sidewalk is a bikelane only with its own bicycle tags; in Berlin 26 separate sidewalks have none, so their bicycle access is no longer shown until they are tagged.
- `bikelane_left|right` in `roads` and `bikelanesPresence` follow: a road whose only bikelane was such a sidewalk is `not_expected` (e.g. Fahrradstraßen) or `missing` (roads with `sidewalk:<side>=separate` and no `cycleway:<side>` tags).

### Access: `roads`, `roadsPathClasses`, `bikelanes`, `routing`

#### Which ways are public

- Which ways are not public is decided in one place now (`helper/access_restriction.lua`), for all four tables.
- `access=destination|customers` (also `foot` on a footway, `bicycle` on a cycleway) no longer takes a way out of `roads` / `roadsPathClasses` when cycling is allowed explicitly on the way itself (`bicycle`, else `vehicle`, else `access`, is `yes`, `designated`, `permissive`, `discouraged` or `dismount`), e.g. `access=destination` with `bicycle=yes`. `use_sidepath` does not count: like `cycleway=separate` it points to a path next to the way. Before, `routing` had the carriageway or path edge of such a way without a row in `roads` / `roadsPathClasses` to join.
- `highway=service` ways without `service` or with `service=alley` stay public, as before. Service ways with any other `service` value (`driveway`, `parking_aisle`, `emergency_access`, `drive-through`, …) are now public when they have bike infrastructure of their own, e.g. `traffic_sign=DE:240` (`footAndCyclewayShared_*`).
- `bicycle:left|right|both` no longer keeps such a service way public: no bikelane category reads these keys. `bicycle=designated` still does.
- `indoor=yes` and `informal=yes` ways with bike infrastructure of their own are public in `roads` / `roadsPathClasses` too (they were already in `bikelanes`).
- A way that is not public for `roads` / `roadsPathClasses` (`indoor` or `informal` without bike infrastructure of its own, `access=destination|customers` without permission to cycle on the way) no longer has a carriageway or path edge in `routing` either. For `indoor` and `informal` this holds even with a `bicycle` tag.
- `roads.road` can now be `service_driveway`, `service_parking_aisle` or `service_emergency_access`: service ways with bike infrastructure of their own or `bicycle=designated`. `service=parking_aisle` was misspelled in the road classification and became `service_uncategorized` before.
- `access=no` (also `foot=no` on a footway) no longer drops a way when cycling is explicitly allowed on the way itself (same values as above, not `use_sidepath`), e.g. a forest track with `access=no` + `bicycle=yes` or a Fahrradstraße with `access=no` + `bicycle=designated`. `access=no` + `bicycle=use_sidepath` is mostly a closed road at a construction site and stays out. `bicycle=no` on a cycleway still drops it. Refs [tilda-geo#409](https://github.com/FixMyBerlin/tilda-geo/issues/409), [radinfra.de#15](https://github.com/FixMyBerlin/radinfra.de/issues/15).
- `access=private|delivery|permit` (also `foot` on a footway, `bicycle` on a cycleway) no longer drops a way with `bicycle=designated` (resolved via `vehicle`), e.g. a signposted cycle path (Z240) through a private area. `bicycle=yes` does not lift them.
- A way whose resolved `bicycle` access does not allow cycling (`bicycle=no`, `vehicle=destination`, `vehicle=private`, …) is public in all four tables, see `routing` below.
- On a bicycle road (`bicycle_road=yes`, or `traffic_sign=DE:244*` like the `bicycleRoad` category, including the Fahrradzone DE:244.3; an explicit `bicycle_road=no` wins over the sign) without a `bicycle` tag, `bicycle` reads as `designated`: cycling is always allowed there, and `vehicle=destination` or `access=destination` means „Anlieger frei“ for motor vehicles. Before, such a Fahrradstraße had `access_bicycle=destination` in `routing`, `access=destination` took it out of `roads`, and `access=no` dropped it. An explicit `bicycle=*` still wins. About 86 ways in Germany, 5 in Berlin.
- Only `access` restricts a way (it includes pedestrians), plus `foot` on a footway and `bicycle` on a cycleway. `vehicle`, `motor_vehicle` and `bicycle` elsewhere never do: `access=private` drops a way, `vehicle=private` keeps all its rows with `access_bicycle=private`.
- `access=no` is decided with the other access values, after the `construction:` prefix is removed: `construction:access=no` now drops a way like `construction:access=private`.

#### Access values

- Access values are mapped on all access keys before (`transform_access_values`), so `roads` and `routing` see the same values and fewer edges are dropped for an unpublished value:
  - `unknown` and `optional_sidepath` read as no tag. `access=unknown` ways keep their `routing` edge now. `optional_sidepath` is no longer an `access_bicycle` value: the carriageway is mixed traffic, `cycleway=separate` shows the path next to it.
  - `official` reads as `designated`; `military`, `emergency`, `psv`, `bus` as `no`; `residents`, `employees`, `restricted` as `private`.
  - `bicycle=mtb` (mountain bike trails, mostly `path` / `track` with `mtb:scale`) drops the way from all tables: TILDA looks at everyday cycling.
  - A list reads as its most open value: `agricultural;destination` as `destination`, `private;delivery` as `delivery`.
  - Numbers for Germany: [tilda-geo#425](https://github.com/FixMyBerlin/tilda-geo/pull/425), section „Zugangswerte vereinheitlichen“.

#### `routing`: `access_bicycle`

- New edges: carriageway and path edges where cycling is not allowed (resolved `bicycle` access `no`, `destination`, `private`, `customers`, `delivery`, `permit`, `agricultural_or_forestry`, e.g. `bicycle=no`, `vehicle=destination`, `vehicle=private`) are in `routing`. They have `access_bicycle` set to that value. Routers filter on `access_bicycle`: empty (no access tag) or `yes`, `designated`, `permissive`, `use_sidepath`, `discouraged`, `dismount` allows cycling, every other value does not. Motorway and trunk stay out.
- The carriageway of a `motorroad=yes` (Kraftfahrstraße) is no longer in `routing`, like motorway and trunk: cycling is prohibited there, whatever `bicycle` says. Before, a `primary` with `motorroad=yes` was a carriageway edge, often with `access_bicycle=no`. Bike infrastructure tagged on the way (`cycleway:<side>=track|lane`) keeps its own edge. The `roads` row stays. Numbers for Germany: [tilda-geo#425](https://github.com/FixMyBerlin/tilda-geo/pull/425), section „Kraftfahrstraßen“.
- `access_bicycle` has the new values `destination`, `private`, `customers`, `delivery`, `permit`, `agricultural_or_forestry` (it had `no` before). Lanes on the centerline (`side=left|right`) do not inherit the carriageway access.
- An edge whose bicycle access value is still not published after the mapping above (e.g. `bicycle=limited`, `access=foot`) is not in `routing`.

### `bikelanes`: `oneway` without a tag follows the position

- Without `oneway` / `oneway:bicycle`, paths next to a road (`*_adjoining`) are `implicit_yes` and paths away from roads (`*_isolated`) `assumed_no`, as in StVO § 2 Abs. 4; `*_adjoiningOrIsolated` keep the category default. A track tagged on the road (`cycleway:<side>=track`) follows the other side of the road instead: `implicit_yes` when that side has cycling infrastructure (lane, track, `separate`, a sidewalk open to bicycles), `assumed_no` when it has none. Before, the category alone decided: `cycleway_adjoining` was `assumed_no`; `footAndCyclewayShared_isolated`, `footAndCyclewaySegregated_isolated` and `footwayBicycleYes_isolated` were `implicit_yes`. In Germany about 6,230 km change to `implicit_yes` and 1,070 km to `assumed_no`. Trade-off and numbers: https://github.com/FixMyBerlin/tilda-geo/pull/424.

### `roads`, `roadsPathClasses`, `bikeSuitability`, `bikelanes`, `bikelanes_presence`, `routing`: line direction on `oneway=-1`

- Lines of a way tagged `oneway=-1` or `oneway:bicycle=-1` point in the direction of travel now, so the published `oneway=yes` holds for the line. Before, `-1` was published as `yes` while the line kept the drawing direction of the way, so it pointed against the traffic. This applies to the way's own rows: `roads`, `roadsPathClasses`, `bikeSuitability`, `bikelanes_presence` and the `bikelanes` row of the way itself. With `oneway=-1` and `oneway:bicycle=no` (e.g. a Fahrradstraße with two-way cycling) the line follows the motor vehicle direction. Lanes tagged on the road keep their rule; `todos_lines` keep the drawing direction.
- On these reversed rows the pairs that follow the way are swapped: `*:forward`/`*:backward` (`mapillary_*`, `traffic_sign:*`, `osm_maxspeed:*`) and left/right (`bikelane_*`, `traffic_mode_*`, `separation_*`, `buffer_*`, `marking_*`, and the side hints in `description` like `TILDA_surface_right`). In Berlin this affects about 275 lines.
- `routing` path edges are reversed on `oneway=-1` also when only motor traffic is one-way, like the other edges.

### `bikelanes`: `category`

- A cycleway with the footway as its own line on its **left** (`highway=cycleway` + `traffic_mode:left=foot`, no separation on the left) is `footAndCyclewaySegregated_*` now, like `traffic_mode:right=foot` before. Ways are drawn in the riding direction, so a one-way cycleway cannot be reversed to put the footway on its right. In Berlin 16 ways change from `cycleway_*` to `footAndCyclewaySegregated_*`.

### `todos_lines` (bikelanes): `__mapillary` todos and priorities on lanes

- Lanes, tracks and sidewalks tagged on the road (`cycleway:left|right|both`, `sidewalk:left|right|both`) use the road's `mapillary_coverage`. Before, they never got a `__mapillary` todo (e.g. `advisory_or_exclusive__mapillary`, `needs_clarification__mapillary`, `unexpected_bicycle_access_on_footway__mapillary`) and never priority 1 from coverage, also in the regular campaigns. The MapRoulette challenges of the `__mapillary` campaigns gain tasks for them.

### `roads`, `roadsPathClasses`, `bikeSuitability`, `highwayAreas`, `bikelanes`: `description`

- `description` is written by TILDA: hint codes first (`TILDA_<hint>` or `TILDA_<hint>=<value>`), then the OSM texts unchanged as ``OSM-`description`: <text>`` and ``OSM-`note`: <text>``, joined with `;`. Before, it was `description` or `note` plus German `TILDA-Hinweis: …` sentences, split at `;` and sorted. A `note` that repeats the `description` is left out. The codes and their texts are documented as values of `roads.description` in the topic docs; downloads show the codes.
- The older hints are codes now: `TILDA_access_road`, `TILDA_shared_agricultural`, `TILDA_closed_construction`, `TILDA_closed_blocked`.

### `roads`, `roadsPathClasses`, `bikeSuitability`: `surface`

- Without a valid `surface`, the worst of `surface:bicycle*`, `surface:forward|backward` and `surface:left|right` (by derived smoothness) is the surface, with the new `surface_source=tag_directional`. Before, these ways had no surface.
- Every other of these values is a hint: `TILDA_surface_bicycle`, `TILDA_surface_bicycle_right|left`, `TILDA_surface_right|left`, each `=<surface>`. Hints name sides only: `forward` is the right half, `backward` the left half; a side value wins over a direction value.

### `bikelanes`: `surface`, `smoothness`

- Fahrradstraßen, pedestrian areas and `sharedMotorVehicleLane` read `surface:bicycle` and `smoothness:bicycle` first; the hints `TILDA_surface_strip` and `TILDA_smoothness_strip` name the surface and smoothness of the rest of the road. Cycleways and foot/cycle paths use `surface:bicycle` as their surface without a hint.
- These bikelanes also read `surface:forward|backward` and `surface:left|right` of their own way, like `roads`: without a valid `surface`, the worst value is the surface (`surface_source=tag_directional`, the tagged `smoothness` still applies); every other value is a hint `TILDA_surface_right|left` or `TILDA_surface_bicycle_right|left` (`forward` is the right half, `backward` the left half). Example: a shared foot/cycle path with `surface=paving_stones` and `surface:left=asphalt` gets `TILDA_surface_left=asphalt`.
- Lanes and bus lanes without their own `cycleway:<side>:surface` take, from the road, `surface:bicycle`, then the bicycle, side or direction value of their half (`surface:<side>`, `surface:forward` for the right lane), then `surface`; new `surface_source=parent_highway_tag_directional`.

### `roads`, `roadsPathClasses`, `bikelanes`: `lifecycle`

- Bikelanes and sidewalks of a road with `temporary=yes` are `lifecycle=temporary` now (before only the road), like they already were for `construction`.
- `construction:cycleway=*` without a side only makes the bikelanes `lifecycle=construction`, no longer the road.
- `lifecycle=construction_no_access` and `lifecycle=blocked` also read `fixme`, next to `access:reason`, `description` and `note`. Mappers often keep the reason only there, e.g. `access=no` + `fixme=access=no und bicycle=no wegen Baustelle`. A restricted access tag is still required. In Berlin 8 ways change. Side keys like `cycleway:right:fixme` are not read.

### `bikelanes`, `routing`, `todos_lines`: `oneway`, `offset`

- `oneway=-1` (one-way against the drawing direction of the way) and `oneway=1` are explicit values now, also as `oneway:bicycle=-1` and `cycleway:<side>:oneway=-1`. They give `oneway=yes`. Before, `-1` counted as "not tagged" (`assumed_no` / `implicit_yes`). `routing` reverses the edge of own lines, now also for `oneway:bicycle=-1`.
- `missing_oneway` only lists own geometries. Lanes and tracks tagged on the road are left out, because the campaign led to `cycleway:both:oneway=yes`, which is wrong for the left side of a two-way road. Without a tag, lanes stay `implicit_yes` and tracks `assumed_no`.
- Lines of lanes and tracks tagged on the road point in the riding direction in `bikelanes` and `routing`, following `cycleway:<side>:oneway`. Without it, on a oneway road (also a roundabout) both sides run in the road direction; before, the left line always ran against the way. A contraflow lane needs `cycleway:<side>:oneway=-1`; `cycleway=opposite_lane|opposite_track` gets it. Two-way lanes keep left against and right with the way.
- `bikelanes.offset` and `routing.offset` are signed relative to the line now (`+` left / `-` right of its direction), so most values are negative. Before, the sign was relative to the way.

### `roads`, `bikelanes`, `parkings`, `routing`: `oneway=-1`, roundabouts

- One-way tags (also `construction:*`) are cleaned once at the start of `roads_bikelanes` and `parking`: `1` and `true` become `yes`, a roundabout (also `junction=circular`) without `oneway` gets `oneway=yes`. Later steps only read `yes`, `-1` and `no`.
- `roads.oneway`, `roads.oneway_bicycle` and `parkings.road_oneway` publish `oneway=-1` as `yes` (without the direction). Before, `-1` was `disallowed`. Roundabouts are `oneway=yes` now.
- On `oneway=-1` roads the side rules follow the direction of travel: `cycleway=lane|track` without a side is the left side of the way (the right side is `not_expected`), `cycleway=opposite_lane|opposite_track` is the right side with `cycleway:right:oneway=yes`, and a cycleway with `oneway=-1` takes `traffic_sign:backward`. Before, these roads were handled like two-way roads.
- Roundabouts count as one-way everywhere: `routing` carriageway edges of roundabouts are `oneway=yes` (before `no`), and so are `bikelanes` rows of the way itself.
- The parking road width uses the oneway fallback for `oneway=-1` and roundabouts, so parking capacities there can change.

### `bikelanes`, `routing`: `oneway` of `sharedMotorVehicleLane`

- `cycleway=shared_lane` (also `cycleway:<side>=shared_lane`) without `cycleway:<side>:oneway` is `implicit_yes` now, before `assumed_no`. Each row is one side of the road, so it is the motor vehicle lane of that side and runs in one direction. The `routing` lane edges of these rows are `oneway=yes`; the carriageway edge is unchanged.

### `roads`, `roadsPathClasses`, `bikelanes`, `parkings`, `routing`: `width`

- `parse_length` reads the seven most used decimal commas (`0,3`, `0,5`, `0,6`, `1,5`, `2,2`, `2,5`, `2,50`), which were empty before. A negative length is empty now.
- `width` and `width_effective` are empty for `0`: new helper `parse_width`. So `offset` and the parking road width use the highway fallback then. `buffer_*` keeps `0`.
- New `todos_lines` id `unusual_width` for `roads` and `bikelanes`: a `width` we can't read, `0` or negative, or above 50 m (published as it is). Table-only. When the `bikelanes` row of the way itself has the todo, `roads` does not list it a second time. `check_date`, `check_date:width`, `survey:date`, `survey:date:width` or `survey_date` closes it, also on the road of a lane.

### `routing`: sanitized tags, `informal`

- Carriageway and path edges publish the sanitized values of `roads` / `roadsPathClasses` instead of raw OSM tags. `width` is a number in meters or empty (was the OSM text, e.g. `5,7`, which aborted the export). `surface` uses the same values as `roads` (e.g. `dirt` is now `ground`). `smoothness` is also derived from `surface` and other tags, like in `roads`.
- New tag `informal` (`yes` when present), like on `bikelanes`, `roads` and `roadsPathClasses`. Ways with `informal=yes` are in `routing` only when they have own bike infrastructure, so these edges are now marked.
- `prefix`, `parent_road`, `adjoining_road`, `adjoining_maxspeed` no longer read an OSM tag of the same name. No change in the data: no way in Germany has these tags (2026-10).

## 2026-10

### Summieren: `tilda_measure_sum`

- New column `missing`: per metric, the number of features without a number for it (they are not in `sums`). Summieren shows them in a column of their own.

### `bicycleParking_points`, `bicycleParking_areas`

- New `kind` tag, the first key of the row: `bicycle_parking`, `cargo_bike_parking` (`cargo_bike=designated`, or only `capacity:cargo_bike` without normal spaces), `small_electric_vehicle_parking` (`small_electric_vehicle_parking`, `kick-scooter_parking`), `mobility_hub` and `bicycle_rental` (not `shop` or `virtual`). Multipolygon relations of these kinds are added as areas with a centroid point, so `bicycleParking_areas.geom` is a multipolygon now.
- One row per kind. An OSM object with normal and cargo spaces (`capacity` and `capacity:cargo_bike`) gives two rows: `bicycle_parking` with `capacity` = total minus cargo spaces, and `cargo_bike_parking` with `capacity` = cargo spaces (`cargo_bike=designated` without cargo spaces gives one `cargo_bike_parking` with the total). The row ids: the first row keeps the object id (`way/123`), the others add the kind (`way/123/cargo_bike_parking`). `capacity:cargo_bike` is no longer a tag of the rows.
- Removed `osm_capacity` and `osm_capacity:cargo_bike`. A `capacity` or `capacity:cargo_bike` that is not a number is reported in `bicycleParking_errors`.
- Geometry of a split object is placed per kind, `tags.geometry_transform` says how: `area_split` (outline cut across its long axis by the length the stands need, a bicycle stand every 1.2 m and a cargo bike stand every 2.0 m, 2 bikes each; the bicycle part on the min end, each point on its part), `line_halves` (open way cut in the middle, each point in the middle of its half; the line is kept in the internal table `_bicycleParking_lines`) and `point_offset` (node: the bicycle part 1 m west, the cargo bike part 1 m east).
- `bicycle_parking` (the type of stand) is renamed to `stand_type`, so it does not read like `kind`. It accepts more values of the wiki (e.g. `rack`, `safe_loops`, `building`, `floor`), which were logged as errors before.
- New tags: `network`, `rental_type` (from `bicycle_rental`: `docking_station`, `dropoff_point`, `key_dispensing_machine`), `in_mobility_hub=yes` on the points and areas inside a mobility hub area.
- `position` is read from `<amenity>:position` (e.g. `small_electric_vehicle_parking:position`) before `bicycle_parking:position` and `position`. New values: `shoulder`, `traffic_island`, `parklet`, `playground`, `driveway`, `public_property`.
- `cargo_bike=designated` is kept as `access_cargo_bike` (before it was logged as an error). `access` allows `members` and `no`.
- A parking without `capacity` has no `capacity`. There is no estimate.
- Summieren: a mobility hub is not counted as a parking (the parkings inside it are). New amount `objects` (1 per row); a parking without `capacity` counts only there, no longer as 1 space. The cargo spaces of a split object are counted under `cargo_bike_parking`.

### `roads`, `roadsPathClasses`, `bikelanes`: `route_relations`

- New key `route_relations`: the OSM route relations a way belongs to, grouped by `route=*`, e.g. `bicycle:2788485,12138805;bus:1234567`. Route types: `bicycle`, `mtb`, `bus`, `foot`, `hiking`. Also the Berlin cycling network from infraVelo as pseudo relation per line, e.g. `radnetz_berlin:Vorrangnetz`, from the infravelo-radnetz repo. Why and how: [topics/roads_bikelanes/route_relations/README.md](topics/roads_bikelanes/route_relations/README.md).

### Topic `bikeroutes` renamed to `routes`; new tables `mtbroutes`, `busroutes`, `footroutes`, `hikingroutes`

- The topic now writes one table per route type. `bikeroutes` keeps its name and content. The error table is now `routes_errors` (was `bikeroutes_errors`). Use `PROCESS_ONLY_TOPICS=routes` instead of `bikeroutes`.

### `roads`, `routing`, `bikelanes`

- Fix: `maxspeed` is now read from `zone:maxspeed` (e.g. `DE:30`, `30`) and from `source:maxspeed=DE:zone:30` (colon form) when the way has no `maxspeed` tag. Before, these values gave no `maxspeed`.

### Summieren: `bicycle_parking`

- Fix: a bicycle parking mapped as an area was summed twice, as the area and as the point at its centroid. `tilda_measure_bicycle_parking` now reads `bicycleParking_points` only.

### `parkings_edges_labels` (new), `parkings_labels`

- New point table `parkings_edges_labels`: one point at the middle of each `parkings_edges` line with capacity, minzoom 14. Keys: `capacity_*`, `capacity_private_*`, `operator_type_*`, `angle` (upright text angle along the edge, degrees for MapLibre `text-rotate`) and `flipped` (true when the text was turned by 180°, so the edge's left side is below the text). The map shows the capacity per edge once instead of repeating it along the line.
- `parkings_labels`: new key `angle`, the upright text angle along the parking line.

### `parkings`

- Tagged `capacity` of a parking line that is cut into several segments: the rounding remainder goes to the longest segment. When two segments have exactly the same length, the one with the lower segment id now gets it. Before, the choice was random, so `capacity` could move between the two segments from one run to the next. The sum per parking line is unchanged.

### `parkings_quantized`, `off_street_parking_quantized`

- Removed (tables, exports, tiles). QA, Statistik and Summieren measure the features in their own geometry instead of generated points: a parking line or lot that crosses the border of an area counts with the share of its `capacity` that lies inside (`processing/measure/measure_functions.sql`, [docs/Measure.md](../docs/Measure.md)).

### `aggregated_lengths`

- Kilometers per Bundesland and Kreis are measured on the lines instead of on a point every 100 m, so a line that crosses a boundary counts on each side with the exact share of its length. Values move by about 1 km in single classes. Still kilometers per direction (a line that is not oneway counts twice).

### QA tables (`qa_*_indicators`)

- Amounts per cell are measured on the lines and areas instead of on generated points (bikelanes: a point every 5 m; parking: a point per space), so they can be fractional. A reference table has to be written with the same code as the nightly run reads it; references written from points must be rebuilt.

## 2026-09

### `roads`, `roadsPathClasses`, `bikelanes`, `bikelanesPresence`, `bikeSuitability`, `routing`

- Network noise, detected once on the `routing` graph (one geometry per OSM parent way): **islands** (the way touches no other line) and **short dangling tips** (`length` < 20 m, one end attached, the other free, nothing else touching the way). Single pass: a way that only becomes a tip once its own tips are hidden stays. Lines outside `routing` (eg. motorways) count as connectors; with `PROCESS_ONLY_BBOX` (local dev), ways not fully inside the bbox (minus ~10 m) are skipped. Map tables: `minzoom` is at least 14, so the lines stay in the data and in the z14 tile (overzoomed) and the inspector still works. `routing`: the rows are removed from the graph and moved to `_routing_discarded` (`discard_reason` `island` | `stub`, not published) for debugging. `todos_lines` is unchanged. SQL: `topics/roads_bikelanes/4_hide_network_noise.sql`.

### `parkings`, `off_street_parking_areas`, `parkings_edges`, `parking_errors`

- New `condition_category=invalid`: a `*:conditional` value the classifier reads has broken syntax (unbalanced or nested brackets, `@` inside the condition, a part without `value @ condition`; also `maxstay` values with a broken `@`). We can not tell the real restriction, so we do not guess (dropping e.g. `no_stopping @ …` would read as free parking). `condition_category_primary` / `condition_category_left|right` carry `invalid` too (last in the priority list); map styles have no own colour and use the fallback on purpose.
- The broken tags are logged to `parking_errors` (`SANITIZED_VALUE`) with their original key, e.g. `parking:both:restriction:conditional`, so they can be fixed in OSM. Real examples: `no_stopping @ (Mo-Sa 07:00-19:00; PH off)...)`, `no_parking @ (Mo-Fr 09:00-20:00; Sa 09:00-18:00; none @ residents`.
- `maxstay=1 hour @ (Mo-Fr …)` without `:conditional` is read like `maxstay:conditional` → `time_limited (1 hour) (Mo-Fr …)` instead of nested brackets.
- Street parkings from `parking:left|right|both:*` now log rejected sanitizer values to `parking_errors` too (previously dropped silently).
- Docs: `condition_category_primary` and `condition_category_left|right` document `default` ("Keine Zuordnung": category not in the style priority list, e.g. `no_standing`). `capacity_source=area` (off-street) was already documented via `valuesAdd`.
- `condition_category_primary` is now computed in Lua next to `condition_category` (was a SQL function at finalize). Same values; it is now also on `parkings_no` and `parkings_separate`.
- `condition_category_primary` / `condition_category_left|right`: new priority order. Special-use spaces win over prohibitions, and `time_limited` over zone rules: `disabled`, `disabled_private`, `taxi`, `loading`, `charging`, `car_sharing`, `no_parking`, `no_stopping`, `bus_lane`, `private`, `assumed_private`, `vehicle_restriction`, `access_restriction`, `maxweight`, `time_limited`, `mixed`, `residents`, `paid`, `unspecified`, `free`, `assumed_free`, `invalid`. E.g. `bus_lane (05:00-19:00);taxi (19:00-05:00)` is now `taxi` (was `bus_lane`). The order lives in `helper/condition_category_primary.lua`; map styles match by value.
- `condition_category` details: the mapper typo `weightrating` is written as `maxweightrating` (with single spaces around `<`/`>`), e.g. `no_stopping (maxweightrating > 7.5)`. Free text in details (e.g. opening_hours comments like `"large events"`) is sanitized like other free-text tags: control characters removed, HTML-like tags become `[…]`.
- `condition_category` details now only hold processed values for comments, `maxstay` and `access`; what we do not know is logged to `parking_errors` (original OSM key) so the lists can grow:
  - opening_hours comments (`"…"`) become tokens: `large_events`, `doctors`, `illegible`, `mobile_library`; unknown text → `other_comment`. Table: `topics/parking/helper/condition_detail_tokens.lua`.
  - `maxstay` durations get one spelling (`30 min` → `30 minutes`, `1 h` → `1 hour`). A bare number gets an assumed unit and is still logged: below 10 hours, from 10 on minutes (`2` → `2 hours`, `120` → `120 minutes`). Unknown values (e.g. `maxstay=left`) → `time_limited` without the value; a conditional interval is kept.
  - Time conditions (weekdays, times, months) are checked atom by atom (`topics/parking/helper/condition_syntax.lua`). Unambiguous mistakes are rewritten: weekday case and German weekdays (`Mo-FR`, `Mo-Do` → `Mo-Th`), `9:00` → `09:00`, `06:00-18` → `06:00-18:00`, `07:00-0900`, `12:00.18:00`, typographic dashes. Atoms we do not understand become `other_condition` (e.g. `no_parking (Mo-Fr other_condition)` for `Mo-Fr 076:00-09:00`). Complex but valid conditions pass unchanged.
  - `access` / `motor_vehicle`: only known values are shown as detail of `access_restriction`. Other values → `access_restriction` without detail. `unknown` is treated as not tagged (e.g. `paid;access_restriction (unknown)` → `paid`).
- `parking_errors`: new `_error_type=REWRITTEN_VALUE` for tags with a clear mistake that we corrected (weekday spelling, times like `9:00`, `maxstay` without unit, `weightrating`). `SANITIZED_VALUE` stays for values we did not understand and replaced or ignored. Both carry the original OSM key and value. All decisions are made in one place: `topics/parking/helper/sanitize_condition_tags.lua`.
- Note: condition detail strings are mostly passed through from OSM verbatim (only fee inversion and time subtraction rebuild them), so casing like `mo-Fr` can appear. The inspector translates weekdays case-insensitively.

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
- Dropped when cycling is not allowed (`bicycle` access `no`/`private`/…), when `informal=yes` and bicycle access is unresolved, when own or parent `highway` is `motorway`/`trunk` (including `_link`) or the carriageway has `motorroad=yes`, or when a path edge would not enter `roadsPathClasses` (OSM sidewalk/sidepath, indoor, informal, destination/customers access — same helper as the roads writer).
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
