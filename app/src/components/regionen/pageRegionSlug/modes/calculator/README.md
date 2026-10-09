# Summieren mode (area calculator)

Route `/regionen/<region>/summieren`. Product description: [docs/Modes-Concept-Summary.md](../../../../../../../docs/Modes-Concept-Summary.md#summieren).

## Parts

- `PageModeCalculator.tsx` — the mode panel: dataset picker and `CalculatorResult` (totals and breakdown, `CalculatorBreakdown`).
- `CalculatorMap.tsx` — mounted by `RegionMap` only in this mode: the points of the selected dataset (`SourcesLayersCalculator`, once per part), the drawing surface, and the calculation.
- `calculatorDatasets.const.ts` — what can be summed and which regions offer it. A dataset is one or more sources that are summed together (`parts`) and the filter it opens with (`defaultFilter`); the sum and group-by keys are the `calculator` config of the sources. Parking ("Parkraum") is one dataset of two parts, the points along the streets and those off the street, and opens with the public parking of the first.
- `utils/useUpdateCalculation.ts` — the engine: `queryRenderedFeatures` on the dataset's layers, filtered to the drawn areas, written to the map store (`calculatorAreasWithFeatures`). It only sees rendered points, hence the viewport warning. A server-side engine would replace this one function.

## State

- `sum` URL param — `{ key?, filter?, style?, areas? }` (`calculatorModeParam.ts`), the shape of the other modes: `key` is the dataset (omitted for the region's first), `filter` the tag values the sum is narrowed to (omitted for the default filter of the dataset, so `{}` is "no filter"), `style` the tag the points are colored by (`utils/calculatorStyleColors.ts`; the breakdown is the legend). A group of the breakdown ignores the filter on its own tag, so its other values stay there to pick; points that are not summed (outside the areas or the filter) are dimmed on the map, not removed, because the engine reads rendered points. Opacity only ever means "summed or not", color only ever the style.
- `part` — the part of the dataset a point is from (`calculatorPartKey`) is used like a tag in filter, style and breakdown, but the points do not have it: the engine adds it to the features it reads, and the map resolves it per layer. Narrowed to one part, the breakdown shows the group-by keys of that source only. Ids are unique per source, so features are told apart by source and id.
- `sum.areas` — the drawn areas as one GeoJSON geometry, `Polygon` or `MultiPolygon`, like the geometry of a Prüfeintrag (`useCalculatorAreas.ts`). An area's id is its position (`part-0`, …). Updated once per finished edit. They stay in the URL in other modes.
- Tool, selection and a drag in progress live in the drawing package's own store. `useCalculatorLiveAreas()` returns the areas including a running drag; only the area labels use it. The calculation and the dimming of the points follow `sum.areas`, so they update when an edit is finished, not on every frame of a drag.
- Nothing is stored on the server.

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
