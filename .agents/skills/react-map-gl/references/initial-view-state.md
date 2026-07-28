# initialViewState and camera control

react-map-gl supports **uncontrolled** camera (`initialViewState` + internal map state) and **controlled** camera (`longitude` / `latitude` / `zoom` / `onMove`). FMC apps standardize on **uncontrolled map + URL as source of truth**, not mirrored React viewState.

## Technique matrix

| Pattern                                               | When to use                            | Tilda example                                                     |
| ----------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| `initialViewState` from URL, handler writes URL       | Shareable viewport in query params     | `RegionMap` (`onMoveEnd`), `NotesNewMap` (`onMove` + `onMoveEnd`) |
| `initialViewState` with `bounds` + `fitBoundsOptions` | Open map framed on a feature           | `NotesNewMap` when note feature exists                            |
| Controlled `longitude`/`latitude`/`zoom`              | Rare — programmatic camera every frame | Not used in tilda                                                 |
| Do not use `hash` prop                                | Conflicts with app query params        | Comment in RegionMap                                              |

## URL seed, uncontrolled camera

```tsx
// tilda-geo: RegionMap.tsx
const { mapParam, setMapParam } = useMapParam()

if (!mapParam) return null

const writeMapParam = (event: ViewStateChangeEvent) => {
  const { latitude, longitude, zoom } = event.viewState
  void setMapParam({ zoom, lat: latitude, lng: longitude }, { history: 'replace' })
}

;<MapGl
  initialViewState={{
    longitude: mapParam.lng,
    latitude: mapParam.lat,
    zoom: mapParam.zoom,
  }}
  onMoveEnd={writeMapParam}
/>
```

**Why uncontrolled:** Avoid feedback loops between React state and map internal transform. URL updates use `history: 'replace'` so pan/zoom does not flood browser history. Initial mount reads URL once into `initialViewState`.

**Do not** also pass `longitude={…} latitude={…} zoom={…}` unless you intentionally control the camera — that forces controlled mode and re-syncs every render.

**`onMoveEnd` vs `onMove`:** Same handler shape works for both. Use **`onMoveEnd` only** when the URL may lag slightly behind the camera (main map). Wire **`onMove` and `onMoveEnd` to the same handler** when something UI-bound must track the viewport during the gesture — e.g. `NotesNewMap` keeps a fixed marker while the map pans underneath (`onMove={writeMapParam} onMoveEnd={writeMapParam}`). Always pass `{ history: 'replace' }` in either case.

## Bounds-based initial view

When geometry exists, fit bounds once at mount:

```tsx
let initialViewState: MapProps['initialViewState'] = {
  longitude: newNoteMapParam.lng,
  latitude: newNoteMapParam.lat,
  zoom: newNoteMapParam.zoom,
}
if (osmNewNoteFeature) {
  initialViewState = {
    bounds: bbox(osmNewNoteFeature.geometry) as [number, number, number, number],
    fitBoundsOptions: { padding: 100, maxZoom: 17 },
  }
}
```

Use **`initialViewState` only** for the first frame. To move the camera later, call methods on the map instance — still **uncontrolled** (no `longitude`/`latitude`/`zoom` props).

## Programmatic camera (after load)

**Access:** `const { mainMap } = useMap()` → `mainMap` is a react-map-gl `MapRef`. MapLibre camera APIs live on `mainMap.getMap()` or, inside Map handlers, on **`event.target`**.

**Guard:** only after `useMapLoaded()` (see map-loaded-hook.md).

### In a click handler (Trassenscout)

Inside `onClick`, `event.target` is the MapLibre map — call `fitBounds` directly:

```tsx
// onClick — event.target is the MapLibre map
const handleClickMap = (event: MapLayerMouseEvent) => {
  const map = event.target
  const geometry = event.features?.at(0)?.geometry // or from React props / URL / API
  if (!map || !geometry) return

  const bounds = bbox(geometry) as [number, number, number, number]
  map.fitBounds(
    [
      [bounds[0], bounds[1]],
      [bounds[2], bounds[3]],
    ],
    { padding: 60, duration: 1000 },
  )
}
```

### From a sibling component (useMap)

When the camera move is not tied to the same event (e.g. “zoom to selection” button, deep link with `?f=` features):

```tsx
const { mainMap } = useMap()
const mapLoaded = useMapLoaded()

function zoomToFeatures(features: GeoJSON.Feature[]) {
  if (!mainMap || !mapLoaded || features.length === 0) return

  const bounds = bbox(featureCollection(features)) as [number, number, number, number]
  mainMap.fitBounds(
    [
      [bounds[0], bounds[1]],
      [bounds[2], bounds[3]],
    ],
    { padding: 40, maxZoom: 16 },
  )
}
```

`MapRef.fitBounds` is the react-map-gl wrapper; `mainMap.getMap().fitBounds(…)` is equivalent.

**URL side effect:** On an uncontrolled map, `fitBounds` / `flyTo` still fires **`onMoveEnd`**. Tilda’s `RegionMap` will write the new viewport to `?map=` — usually what you want for shareable links. If you need to move the camera **without** updating URL, handle that in `writeMapParam` (skip write for programmatic moves) — rare in FMC apps.

| API                                            | Use when                                    |
| ---------------------------------------------- | ------------------------------------------- |
| `initialViewState.bounds` + `fitBoundsOptions` | Frame once at **mount**                     |
| `map.fitBounds(…)` / `map.flyTo(…)`            | User action or deep link **after** load     |
| Controlled `longitude`/`latitude`/`zoom`       | Camera must mirror React every frame (rare) |

## Guard: null map param

Both maps `return null` until URL param is parsed — avoids rendering `<Map>` with undefined center.

## Anti-patterns

```tsx
// ❌ Controlled + URL + initialViewState fight
const [viewState, setViewState] = useState(…)
<Map {...viewState} onMove={(e) => setViewState(e.viewState)} initialViewState={…} />

// ❌ hash prop alongside custom ?map=
<Map hash … />  // tilda: interferes with URL state

// ❌ fitBounds in render without mapLoaded guard
// ❌ fitBounds(mainMap) in render — run from handler or explicit user action
```

## Decision flow

```
Need shareable viewport?
  yes → URL param + initialViewState from URL + writeMapParam on onMoveEnd (and onMove when needed)
  no  → static initialViewState or bounds

Need to follow live external state every frame?
  yes → controlled longitude/latitude/zoom (rare)
  no  → uncontrolled + imperative fitBounds when needed
```
