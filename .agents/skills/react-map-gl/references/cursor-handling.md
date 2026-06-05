# Cursor handling

react-map-gl `<Map>` accepts a **`cursor`** prop (CSS cursor string). Update it from **`onMouseMove`** / **`onMouseLeave`** based on **`event.features`** (see interactive-layer-ids.md).

## Tilda pattern

```tsx
// tilda-geo: RegionMap.tsx (cursor only)
const [cursorStyle, setCursorStyle] = useState('grab')

const updateCursor = (features: MapGeoJSONFeature[] | undefined) => {
  if (!features?.length) {
    setCursorStyle('grab')
    return
  }
  setCursorStyle('pointer')
}

const handleMouseMove = ({ features }: MapLayerMouseEvent) => {
  features = extractInteractiveFeatures(mapParam, features)
  updateCursor(features)
}

const handleMouseLeave = (_e: MapLayerMouseEvent) => {
  updateCursor([])
}

<MapGl
  cursor={cursorStyle}
  onMouseMove={handleMouseMove}
  onMouseLeave={handleMouseLeave}
  …
/>
```

## Behavior summary

| State                             | Cursor       | Notes                                                      |
| --------------------------------- | ------------ | ---------------------------------------------------------- |
| No features under pointer         | `grab`       | Default map pan                                            |
| Features on interactive layers    | `pointer`    | Actionable geometry                                        |
| Non-interactive map (note picker) | fixed `grab` | `NotesNewMap`: `interactiveLayerIds={[]}`, `cursor="grab"` |

## Implementation tips

- Apply the same feature filtering as click handlers (e.g. `extractInteractiveFeatures`) so cursor matches what is actually pickable at the current zoom.
- Reset on **`onMouseLeave`** — otherwise cursor can stick at `pointer` when leaving the map canvas.
- Use the Map **`cursor`** prop, not a wrapper div — it applies correctly to the canvas during drag.
- For drawing tools (MapboxDraw, calculator), temporarily override cursor while the tool is active.

## Minimal template

```tsx
const [cursor, setCursor] = useState('grab')

<Map
  cursor={cursor}
  interactiveLayerIds={pickableLayerIds}
  onMouseMove={({ features }) => {
    setCursor(features?.length ? 'pointer' : 'grab')
  }}
  onMouseLeave={() => setCursor('grab')}
/>
```
