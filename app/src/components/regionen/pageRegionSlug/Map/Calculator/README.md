# Calculator map drawing

Drawing uses [`@osm-editor-kit/react-map-gl-draw`](https://github.com/osm-editor-kit/react-map-gl-draw): the areas are a controlled value, the layers are declarative `<Source>`/`<Layer>`, and pointer gestures arrive through `<Map>` props.

- `drawing/useCalculatorDraw.ts` — the drawing surface (options, limits). `RegionMap` spreads its `mapProps` onto `<Map>`.
- `drawing/CalculatorMapDrawing.tsx` — `<DrawLayers>`, the area labels and the toolbar.
- `drawing/calculatorDrawStyles.ts` — layer styles.

## State

- `draw` URL param — jsurl-encoded list of `DrawArea` polygons (see `useDrawSession.ts`). Updated once per finished edit.
- Tool, selection and a drag in progress live in the package's own store. `useCalculatorLiveAreas()` returns the areas including a running drag, so the result follows the pointer.

There are no draw/edit modes. The first click starts an area; afterwards it can be changed directly. A further area starts from the plus button.
