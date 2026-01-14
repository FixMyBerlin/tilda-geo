# Changelog of schema changes

This is an manual and incomplete list of change to the data structure.

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

- For `category=crossing`, use the `surface` from the parent highway if none is given and data is derived from the centerline (tagged as `cyclway:SIDE=crossing`)

## 2025-10-09

### `bikelanes`, `roads`, `roadsPathClasses`

- Exclude ways that are tagged [`leisure=track`](https://wiki.openstreetmap.org/wiki/Tag:leisure%3Dtrack). Sometimes they have a double use, bust generally they are private and not part of the every day road network.

### `bikelanes`

- Include ways tagged with `highway=path + foot=no + bicycle=designated`. They become `category=needsClarification` and havea todo campaign on radinfra.de to resolve the unexpected tagging. Usually those can be retagged as `highway=cycleway`.

### `roads`, `roadsPathClasses`

- Transform `highway=path + foot=yes|designated|nil + bicycle=no` into a `highway=footway` and `highway=path + foot=no + bicycle=yes|designated|nil` into a `highway=cycleway`.
- Exclude ways with `access=customers` (all access keys).

## 2025-10-03

### `bikelanes`

- Include ways on `highway=track` when also bike tagging present; those get a TILDA `description` notice when shared with other traffic modes.
- Use the `width:lanes`,`surface:colour:lanes`, `surface:lanes`, `source:width:lanes`, `smoothness:lanes` data for `cyclewayOnHighwayBetweenLanes`.
- If no `cyclway:right:width` is given for `cyclewayOnHighway*`, look at the last value of `width:lanes`.

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

### `roads`, `roadsPathClasses`,

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

  For `bikelanes`mapped on the centerlines thore are the`cycleway:left|rigth:\*` tags with a fallback to the centerline tags.

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
