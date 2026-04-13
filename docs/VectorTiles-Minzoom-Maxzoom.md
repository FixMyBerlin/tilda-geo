# Vector Tiles `minzoom`, `maxzoom` Features

## Reduce the Vector Tile Size

We have several systems in place to reduce the amount of data that is part of our vector tiles.

These systems help reduce the vector tile size, allowing the app to function effectively.

Without these systems, some vector tiles would exceed 5 MB and load very slowly. The main **limitations** are:

- DB: how fast the database can compute the vector tile
- Network: how quickly the tile can be delivered
- Maplibre / WebGL: whether the vector tile data can be rendered on the map at all (gaps in the map)

## Always Use Function Sources

Our vector tiles are served by [Martin](https://maplibre.org/martin/introduction.html).

Our general setup is:

- [osm2pgsql](https://osm2pgsql.org/doc/manual.html) creates a table for each vector tile dataset that we want to serve (but we don't use that directly).
- Our [`post-processing-hook`]() creates [a Postgres function for each table](app/src/registerSQLFunctions/registerGeneralizationFunctions.ts) that holds all the logic defined below.
  This is where our data gets reduced.
- Our [cache-warming](./Cache-Warming.md) runs on certain datasets and zoom levels to cache larger vector tiles so users don't have to wait for the DB part to render the tiles.

The Postgres functions are standardized for all datasets, meaning we use the same generalization features (with default values) described below for all datasets.

## Glossary

```
  0---4=minzoom->----<-maxzoom=12----22
  globe---------------------------trees
  zoomed out------------------zoomed in
```

## 1. LUA/SQL: Filter _Objects_ by `minzoom`

**Goal:**

Allow us to decide which OSM objects to filter.
Using LUA, we can make this decision early while working with the data and use LUA instead of SQL.

**Definition:**

An object with `minzoom: 11`…

- …will be visible at zoom levels 11 to 22
- …but hidden from zoom 12 onward (12..0).

**How it works:**

Step 1: All our LUA tables have a `minzoom` column. The default value is 0, which deactivates them.

For roads, for example, we can decide in LUA, based on the object tags, to set a different `minzoom`:

Example: [`processing/…/RoadGeneralization.lua`](`processing/topics/roads_bikelanes/roads/RoadGeneralization.lua`) has a list of highway values that get `minzoom=11`.

Step 2: Our [generalizationFunction](app/src/registerSQLFunctions/registerGeneralizationFunctions.ts) uses this `minzoom` to filter the rows (see `WHERE (geom && ST_TileEnvelope(z, x, y)) AND z >= minzoom`).

## 2. SQL: Simplify Geometries

**Goal:**

When zoomed out, we want to deliver simplified geometries because we don't need the precision, and it saves a lot of data.

The precision is based on the zoom level, so it becomes less precise as we zoom out.

At some point, we show the original data.

**Definition & How it works:**

- Zoom 14+ (`SIMPLIFY_MAX_ZOOM`) will show original data.
- Zoom 4-14 (`SIMPLIFY_MIN_ZOOM`-`SIMPLIFY_MAX_ZOOM`) will show simplified data.
- Zoom 0-4 (`SIMPLIFY_MIN_ZOOM`) is blocked by [`<Map minZoom={SIMPLIFY_MIN_ZOOM}>`](app/src/app/regionen/[regionSlug]/_components/Map/Map.tsx).

## 3. SQL: Filter _Properties_ by `minzoom`

**Goal:**

Allow us to reduce the size of a vector tile by filtering the properties.

**Definition:**

An object with `minzoom: 11`…

- …will show all properties at zoom levels 11 to 22
- …but only the `stylingKeys` properties from zoom 12 onward (12..0).

**How it works:**

- The properties (`stylingKeys`) and `minzoom` are defined in a configuration at [`generalization/interacitvityConfiguartion.ts`](app/src/app/regionen/[regionSlug]/_mapData/mapDataSources/generalization/interacitvityConfiguartion.ts).
- Our [generalizationFunction](app/src/registerSQLFunctions/registerGeneralizationFunctions.ts) will filter the properties based on the requested zoom level and config.

_Map / Interaction:_

On our map, we have two modes based on zoom level and dataset:

- A styling-only mode that disallows selecting features.
- Our regular mode when features can be selected.

The reason is that our Map UI relies on the vector tile feature properties to show in our `<Inspector />` component.

Therefore, our `<Map />` component will use the same config to change the cursor and disable selecting objects. The disabled state shows a "not allowed" cursor. The logic is in [`extractInteractiveFeatures`](app/src/app/regionen/[regionSlug]/_components/Map/Map.tsx).

## 4. Maplibre: "Overzooming" and Disabled Data Loading by Zoom

**Goal:**

- Disallow the map from zooming below `SIMPLIFY_MIN_ZOOM`.
- Prevent data from loading for unsupported zoom levels.

**Definition:**

[Testcase](https://codesandbox.io/p/sandbox/wispy-rgb-2pjg87)

| Component            | Allowed         | Prohibited                                                                            |
| -------------------- | --------------- | ------------------------------------------------------------------------------------- |
| `<Map minZoom=4>`    | zoom >= minZoom | zoom < minZoom cannot zoom out further                                                |
| `<Map maxZoom=4>`    | zoom <= maxZoom | zoom > maxZoom cannot zoom in further                                                 |
| `<Source minzoom=4>` | zoom >= minzoom | zoom < minZoom data hidden; no requests made                                          |
| `<Source maxzoom=4>` | zoom <= maxzoom | zoom > maxZoom data visible but **overzoomed**; no requests (pmtiles: fewer requests) |
| `<Layer minzoom=4>`  | zoom >= minzoom | zoom < minZoom data hidden; no requests made                                          |
| `<Layer maxzoom=4>`  | zoom < maxzoom  | zoom >= maxZoom data hidden; no requests made                                         |

Comments:

- `Map.minZoom` must use the capital `Z`.

Docs:

- `Map.maxZoom` / `Map.minZoom`:
  - Maplibre: Docs too brief to be useful https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/#maxzoom
  - ReactMapGL: Docs too brief to be useful https://visgl.github.io/react-map-gl/docs/api-reference/map#maxzoom
- `Source.maxzoom` / `Source.minzoom`:
  - Maplibre: Docs too brief to be useful https://maplibre.org/maplibre-gl-js/docs/API/classes/VectorTileSource/#maxzoom
  - ReactMapGL: -
- `Layer.maxzoom` / `Layer.minzoom`:
  - Maplibre: Docs too brief to be useful https://maplibre.org/maplibre-style-spec/layers/#minzoom
  - ReactMapGL: -

**How it works:**

- `<Map>` has a `minZoom`.
- Sources all have a `minzoom`/`maxzoom` that is usually based on `SIMPLIFY_MIN_ZOOM` / `SIMPLIFY_MAX_ZOOM`.
  - Gotcha: `maxzoom` should never be below `SIMPLIFY_MAX_ZOOM` for our TILDA data. If it is, we will _overzoom_ the simplified geometries (see **2**), which can lead to invalid geometries and crashes.
- Layers should not have their own `minzoom`/`maxzoom`.
