# Summieren mode (area calculator)

Route `/regionen/<region>/summieren`. Product description: [docs/Modes-Concept-Summary.md](../../../../../../../docs/Modes-Concept-Summary.md#summieren).

## The rule

Every feature keeps its own geometry and carries amounts (numeric tags: `capacity`, `area`, `length` in meters). An area gets the share of a feature that lies inside it: a point all or nothing, a line by length, a polygon by area. The sum is `share × amount`, computed on the server in PostGIS, so it does not depend on the zoom or on what the map shows, and it can be fractional (89.6 parking spaces). The panel shows parking spaces as whole numbers, rounded down (`utils/roundCapacity.ts`); each row is rounded on its own, so the rows of a group can add up to less than the total. The same rule is used by QA and Statistik: [`processing/measure/measure_functions.sql`](../../../../../../../processing/measure/measure_functions.sql).

## Parts

- `PageModeCalculator.tsx` — the mode panel: dataset picker and `CalculatorResult` (totals and breakdown, `CalculatorBreakdown`).
- `calculatorDatasets.const.ts` — what can be summed and which regions offer it; the mode owns these definitions. A dataset is a folder of tables that are summed together. It names its `measureDatasets` (the SQL functions `tilda_measure_<name>`), the amounts it sums (`sumKeys`), the filter it opens with (`defaultFilter`) and its `parts`: the tables that are summed together. A part has the id of the SQL `part`, the map source that serves its table as tiles (`sourceId`, also the source of the tag translations), the tags it is broken down by (`groupByKeys`) and its layers on the map. Parking ("Parkraum") is one dataset of two parts, the lines along the streets and the areas off the street, and opens with the public parking of the first. Streets and paths are summed per direction of travel (`length_directions`, see `docs/Measure.md`), like the Statistik: a line that is not a oneway counts twice.
- `server/calculator/` — `getCalculatorSumsFn({ regionSlug, datasetId, areas })`. Everyone who can see the region may call it. The server takes tables, tags and amounts from the dataset definition, which the region must offer; nothing of the SQL comes from the client. `sumMeasureFeatures` runs one query: every polygon of `areas` is an area (`part-0`, …), plus `combined`, their union, so an overlap is not counted twice. It returns one row per area, part and combination of group-by values: `{ area, properties, sums }`. The query is stopped after 30 seconds (`status: 'timeout'`), which the panel shows as "area too large".
- `useCalculatorQuery.ts` — TanStack Query on that function, keyed by region, dataset and `sum.areas`. While new areas are summed the rows before stay ("Wird summiert …").
- `utils/calculateMetricSummaries.ts` — totals and breakdown from the rows: filter, groups and ratios are computed in the browser, so a click on a filter needs no request.
- `CalculatorMap.tsx` — mounted by `RegionMap` only in this mode. The layers of the categories are hidden meanwhile (`LayersAtlasGeo`), so the map shows only what is summed; the layer controls say so:
  - `SourcesLayersCalculator` — the features of the dataset from the tiles of the part sources: lines, areas (fill and outline) or points. What does not match the filter is dimmed.
  - `CalculatorAreasMask` — dims the map outside the drawn areas: one polygon over the world with the areas cut out, above the dataset and below the drawing.
  - the drawing surface.

## State

- `sum` URL param — `{ key?, filter?, style?, areas? }` (`calculatorModeParam.ts`), the shape of the other modes: `key` is the dataset (omitted for the region's first), `filter` the tag values the sum is narrowed to, one or several per tag: a click on a value in the breakdown adds it, a click on a selected value removes it (omitted for the default filter of the dataset, so `{}` is "no filter"), `style` the tag the features are colored by (`utils/calculatorStyleColors.ts`; the breakdown is the legend). A group of the breakdown ignores the filter on its own tag, so its other values stay there to pick. Opacity only ever means "summed or not" (the filter on the features, the mask outside the areas), color only ever the style.
- `part` — the part of the dataset a feature is from (`calculatorPartKey`) is used like a tag in filter, style and breakdown, but the features do not have it: the server adds it to its rows, and the map resolves it per layer. Narrowed to some parts, the breakdown shows the group-by keys of those parts only.
- `sum.areas` — the drawn areas as one GeoJSON geometry, `Polygon` or `MultiPolygon`, like the geometry of a Prüfeintrag (`useCalculatorAreas.ts`). An area's id is its position (`part-0`, …). Updated once per finished edit. They stay in the URL in other modes.
- Tool, selection and a drag in progress live in the drawing package's own store. `useCalculatorLiveAreas()` returns the areas including a running drag; only the area labels use it. The sums and the mask follow `sum.areas`, so they update when an edit is finished, not on every frame of a drag.
- Nothing is stored on the server.

## Tiles and tags

The map filters and colors by the tags in the tiles; the sums use the tags in the database. Below the zoom that `interactivityConfiguration` sets for a table (9 for bikelanes, roads, paths and bicycle parking) the tiles only hold its styling keys, so a filter or style on another tag (`surface`, `oneway` of bikelanes, `access`, …) shows on the map from that zoom on. The sums are not affected.

## Drawing

Drawing uses [`@osm-editor-kit/react-map-gl-draw`](https://github.com/osm-editor-kit/react-map-gl-draw): the areas are a controlled value, the layers are declarative `<Source>`/`<Layer>`, and pointer gestures arrive through `<Map>` props.

- `drawing/useCalculatorDraw.ts` — the drawing surface (options, limits), enabled in this mode. `RegionMap` spreads its `mapProps` onto `<Map>`.
- `drawing/CalculatorMapDrawing.tsx` — `<DrawLayers>`, the area labels, the first-step hint, undo / redo, and "done" / "cancel" while drawing.
- `CalculatorPanelActions.tsx` — the actions in the panel header, like "new entry" in the other modes: a further area and the help. Deleting is the bin next to each area in the result; it goes through `draw.replace()` so it can be undone.
- `drawing/calculatorDrawStyles.ts` — layer styles.

Undo and redo come from the package (`createDrawHistory()` in `useCalculatorDraw.ts`, buttons in the shared `ModeMapUndoRedo`). Every finished edit is one step and one URL update; while an area is drawn, a step is one corner. The steps are kept in memory for this drawing surface only (Prüflisten have their own), survive a mode switch like the areas do, and are gone after a reload. If the areas change without the drawing surface (a pasted link, the browser's back button), the steps no longer fit and are ignored.

There are no draw/edit modes. The first click starts an area; afterwards it can be changed directly. A further area starts from the plus in the panel header.

## Old links

URL version 4 converts them: `draw` becomes `sum.areas` (`migrations/0004_calculator_mode.ts`), and a "Summieren: …" subcategory switched on in `?config=` opens this mode with that dataset (`server/regions/migrateRemovedConfigEntries.server.ts`).
