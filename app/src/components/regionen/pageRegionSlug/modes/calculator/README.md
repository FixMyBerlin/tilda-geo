# Summieren mode (area calculator)

Route `/regionen/<region>/summieren`. Product description: [docs/Modes-Concept-Summary.md](../../../../../../../docs/Modes-Concept-Summary.md#summieren).

## Parts

- `PageModeCalculator.tsx` — the mode panel: dataset picker and `CalculatorResult` (totals and breakdown, `CalculatorBreakdown`).
- `CalculatorMap.tsx` — mounted by `RegionMap` only in this mode: the points of the selected dataset (`SourcesLayersCalculator`), the drawing surface, and the calculation.
- `calculatorDatasets.const.ts` — what can be summed and which regions offer it. The sum and group-by keys are the `calculator` config of the dataset's source.
- `utils/useUpdateCalculation.ts` — the engine: `queryRenderedFeatures` on the dataset's layers, filtered to the drawn areas, written to the map store (`calculatorAreasWithFeatures`). It only sees rendered points, hence the viewport warning. A server-side engine would replace this one function.

## State

- `sum` URL param — `{ key?, filter?, areas? }` (`calculatorModeParam.ts`), the shape of the other modes: `key` is the dataset (omitted for the region's first), `filter` the tag values the sum is narrowed to. A group of the breakdown ignores the filter on its own tag, so its other values stay there to pick; filtered-out points are dimmed on the map, not removed, because the engine reads rendered points.
- `sum.areas` — the drawn areas as one GeoJSON geometry, `Polygon` or `MultiPolygon`, like the geometry of a Prüfeintrag (`useCalculatorAreas.ts`). An area's id is its position (`part-0`, …). Updated once per finished edit. They stay in the URL in other modes.
- Tool, selection and a drag in progress live in the drawing package's own store. `useCalculatorLiveAreas()` returns the areas including a running drag, so the result follows the pointer.
- Nothing is stored on the server.

## Drawing

Drawing uses [`@osm-editor-kit/react-map-gl-draw`](https://github.com/osm-editor-kit/react-map-gl-draw): the areas are a controlled value, the layers are declarative `<Source>`/`<Layer>`, and pointer gestures arrive through `<Map>` props.

- `drawing/useCalculatorDraw.ts` — the drawing surface (options, limits), enabled in this mode. `RegionMap` spreads its `mapProps` onto `<Map>`.
- `drawing/CalculatorMapDrawing.tsx` — `<DrawLayers>`, the area labels and the toolbar.
- `drawing/calculatorDrawStyles.ts` — layer styles.

There are no draw/edit modes. The first click starts an area; afterwards it can be changed directly. A further area starts from the plus button.

## Old links

URL version 4 converts them: `draw` becomes `sum.areas` (`migrations/0004_calculator_mode.ts`), and a "Summieren: …" subcategory switched on in `?config=` opens this mode with that dataset (`server/regions/migrateRemovedConfigEntries.server.ts`).
