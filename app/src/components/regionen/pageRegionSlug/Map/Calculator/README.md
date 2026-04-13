# Calculator map drawing

Drawing uses [TerraDraw](https://github.com/JamesLMilner/terra-draw) with the MapLibre adapter (`terra-draw-maplibre-gl-adapter`), mounted via `react-map-gl` `useControl` (see `drawing/CalculatorMapDrawingControl.ts`).

## URL state

- `draw` — jsurl-encoded list of `DrawArea` polygons (see `useDrawSession.ts`).
- Draw mode (`polygon` / `edit`) is local React UI state in `CalculatorControls`.

## References

- React Map GL `useControl`: https://visgl.github.io/react-map-gl/docs/api-reference/use-control
- TerraDraw styling: https://github.com/JamesLMilner/terra-draw/blob/main/guides/5.STYLING.md
