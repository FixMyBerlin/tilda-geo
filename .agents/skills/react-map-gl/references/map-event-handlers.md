# Map event handlers (not useEffect)

react-map-gl wraps MapLibre as a **reactive** React component. Map-driven behavior belongs on **`<Map>` callback props**, not on `useEffect` + `map.on(…)` or polling `useMap()` in effects.

Upstream: [State management](https://visgl.github.io/react-map-gl/docs/get-started/state-management) · [Map callbacks](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/map#callbacks) · [MapLayerMouseEvent](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/types#maplayermouseevent) · [Examples (controlled / basic)](https://github.com/visgl/react-map-gl/tree/master/examples/get-started)

## Rule

Read each pair together — a **Don't** line is never a recommendation on its own.

1. **Do:** Handle camera, pointer, load, and tile lifecycle on `<Map>` props.  
   **Don't:** `useEffect` + `map.on('moveend' | 'click' | 'mousemove' …)` to mirror the same behavior.

2. **Do:** Read `event.features` from pointer handlers when using `interactiveLayerIds`.  
   **Don't:** `useEffect` + `queryRenderedFeatures` on every pointer move.

3. **Do:** Use `onMove` / `onMoveEnd` for viewport → URL (see initial-view-state.md).  
   **Don't:** `useEffect` watching `map.getCenter()` / bounds to write URL.

4. **Do:** Use `onLoad` once for “map ready” (see map-loaded-hook.md).  
   **Don't:** Assume `useMap()` ref means the style is ready.

5. **Do:** Use `useEffect` only to **push external React state into the map** after load, or for APIs **without** a Map prop (e.g. `styleimagemissing`).  
   **Don't:** Use `useEffect` as the primary input path for user gestures.

## Use-case → handler

| Use case                                        | Handler                                                              | FMC examples                                                                                            | Notes                                                                                                                                                                                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Map/style ready; one-time setup                 | **`onLoad`**                                                         | Tilda `RegionMap` → `markMapLoaded()`, disable rotation; Trassenscout `SwitchableMap` → Playwright hook | Sets `useMapLoaded`. Not the same as “tiles finished”.                                                                                                                                                                             |
| Tiles/style loading UI                          | **`onData`** + **`onIdle`**                                          | Tilda `RegionMap` → loading indicator on/off                                                            | `onData` fires often; `onIdle` = no camera transition + tiles loaded + animations done ([docs](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/map#onidle)). Trassenscout: `onIdle={() => setMapLoading(false)}`. |
| Viewport → URL or bounds state                  | **`onMoveEnd`** (and **`onMove`** when UI must track during gesture) | Tilda `RegionMap`, `NotesNewMap`                                                                        | Do not use `onZoomEnd` alone — zoom is a move ([RegionMap comment](https://github.com/FixMyBerlin/tilda-geo)).                                                                                                                     |
| Feature click / pick                            | **`onClick`**                                                        | Tilda inspector; Trassenscout `BaseMap`, `SwitchableMap`, `AcquisitionAreaMap`                          | Requires `interactiveLayerIds`. Use `event.features`, not manual hit-test in effects.                                                                                                                                              |
| Right-click / context menu                      | **`onContextMenu`**                                                  | Trassenscout `AcquisitionAreaMap`                                                                       | Same `features` as click when `interactiveLayerIds` set.                                                                                                                                                                           |
| Hover cursor                                    | **`onMouseMove`** + **`onMouseLeave`**                               | Tilda `RegionMap`; Trassenscout `BaseMap`, `SwitchableMap`                                              | See cursor-handling.md.                                                                                                                                                                                                            |
| Hover highlight (feature-state or global state) | **`onMouseMove`** + **`onMouseLeave`**                               | Tilda `RegionMap` (`setFeatureState` hover); Trassenscout `useMapHighlight` wired in `BaseMap`          | Keep handler on Map, not `mousemove` listener in effect.                                                                                                                                                                           |
| Click selection + `setFeatureState`             | **`onClick`** (in handler)                                           | Trassenscout `BaseMap.handleClickInternal`; Tilda `RegionMap.handleClick` → store                       | Prefer updating map in the **same** handler as the click when possible.                                                                                                                                                            |
| Imperative camera after click                   | **`onClick`** → `event.target.fitBounds(…)`                          | Trassenscout `SubsubsectionMap`                                                                         | Use `event.target` (MapLibre map) inside the handler.                                                                                                                                                                              |
| Draggable pin                                   | **`<Marker onDrag` / `onDragEnd>`**                                  | Trassenscout `SwitchableMap`, upload location maps                                                      | Not Map `onDrag*` — marker is a separate component ([Marker docs](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/marker)).                                                                                       |
| Drawing tools                                   | **`useControl`** / control callbacks                                 | Tilda calculator TerraDraw                                                                              | Side-effect lives on the control, not a generic map effect.                                                                                                                                                                        |

### Handlers we rarely use

| Handler                                                   | Why skip in FMC apps                                                                     |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `onZoom` / `onZoomEnd`                                    | Redundant with `onMove` / `onMoveEnd` for viewport sync                                  |
| `onRender`                                                | Fires every frame; avoid for app logic                                                   |
| `onMouseEnter` / `onMouseOver`                            | `onMouseMove` + `onMouseLeave` cover our cursor/hover needs                              |
| Controlled `onMove` + `longitude`/`latitude`/`zoom` props | Prefer uncontrolled + URL (initial-view-state.md) unless you need full controlled camera |

## Anti-pattern vs allowed `useEffect`

### Anti-pattern — map events in `useEffect`

```tsx
// ❌ Duplicates onMoveEnd; fights React lifecycle; easy to leak listeners
useEffect(() => {
  const map = mainMap?.getMap()
  if (!map) return
  const onMoveEnd = () => {
    const c = map.getCenter()
    setMapParam({ lat: c.lat, lng: c.lng, zoom: map.getZoom() })
  }
  map.on('moveend', onMoveEnd)
  return () => {
    map.off('moveend', onMoveEnd)
  }
}, [mainMap])
```

```tsx
// ✅
<Map
  onMoveEnd={(e) => {
    const { latitude, longitude, zoom } = e.viewState
    void setMapParam({ lat: latitude, lng: longitude, zoom }, { history: 'replace' })
  }}
/>
```

```tsx
// ❌ Polling map state for hover
useEffect(() => {
  if (!mainMap) return
  const id = setInterval(() => {
    /* queryRenderedFeatures … */
  }, 50)
  return () => clearInterval(id)
}, [mainMap, pointer])
```

```tsx
// ✅
<Map
  interactiveLayerIds={layerIds}
  onMouseMove={({ features }) => updateCursor(features)}
  onMouseLeave={() => updateCursor([])}
/>
```

### Allowed — bridge **React → map** after load

When selection/bounds come from **React state or URL** (not from the gesture that just happened), a guarded effect is fine:

```tsx
// Tilda: UpdateFeatureState.tsx — inspector selection from store → setFeatureState
useEffect(
  function syncSelectedFeatureStateToMap() {
    if (!mainMap || !mapLoaded) return
    // diff previous vs current; safeSetFeatureState(…)
  },
  [currentSelectedFeatures, mainMap, mapLoaded],
)
```

```tsx
// Trassenscout: SwitchableMap — restore form selection highlight after remount
useEffect(() => {
  if (isPin || !mainMap || mapLoading) return
  // setFeatureState({ selected: true }) from form field values
}, [mainMap, mapLoading, …])
```

```tsx
// Trassenscout: AcquisitionAreaMap — React toggles selection, effect paints feature-state
// (Could also setFeatureState inside onClick; effect is OK when state lives in parent.)
useEffect(function syncPotentialAreaFeatureState() {
  if (!mainMap) return
  const map = mainMap.getMap()
  if (!map.getSource(SOURCE_ID)) return
  for (const area of potentialAcquisitionAreas) {
    map.setFeatureState(…, { selected: area.selected })
  }
}, [mainMap, potentialAcquisitionAreas])
```

**Prefer the handler when the gesture and the map update are the same turn:** Trassenscout `BaseMap` clears/sets `selected` inside `onClick`; Tilda `RegionMap` runs click logic in `handleClick` and uses a child effect only for **store-driven** highlight sync.

### Allowed — no Map callback prop

```tsx
// Tilda: RegionMap — styleimagemissing has no react-map-gl prop
useEffect(function subscribeToMissingStyleImages() {
  if (!mainMap) return
  const handler = (e: MapStyleImageMissingEvent) => { … }
  mainMap.on('styleimagemissing', handler)
  return () => { mainMap.off('styleimagemissing', handler) }
}, [mainMap])
```

Protocol registration (`pmtiles`) in `useEffect` on mount is also fine — not map gesture sync.

## Tilda `RegionMap` wiring (reference)

```tsx
<MapGl
  interactiveLayerIds={interactiveLayerIds}
  onLoad={handleLoad} // map ready
  onData={startMapDataLoading} // loading indicator
  onIdle={finishMapDataLoading}
  onMoveEnd={handleMoveEnd} // URL + bounds
  onClick={handleClick} // inspector + URL features
  onMouseMove={handleMouseMove} // cursor + hover feature-state
  onMouseLeave={handleMouseLeave}
/>
```

## Trassenscout `BaseMap` pattern

Central map wraps handlers once; consumers pass through:

```tsx
<MapComponent
  onMouseMove={handleMouseMoveInternal}  // highlight + cursor + parent
  onMouseLeave={handleMouseLeaveInternal}
  onClick={handleClickInternal}          // selection feature-state + parent
  onLoad={onLoad}
  onIdle={onIdle}
  interactiveLayerIds={[…]}
/>
```

Compose domain logic in the handler or a small hook (`useMapHighlight`) — still invoked **from** `onMouseMove`, not from an effect.

## Checklist for reviews

- [ ] Viewport sync uses `onMoveEnd` / `onMove`, not `map.on('moveend')` in `useEffect`
- [ ] Clicks/hover use `onClick` / `onMouseMove` with `interactiveLayerIds`
- [ ] `onLoad` sets map-ready flag before `queryRenderedFeatures` / `getStyle`
- [ ] Loading UI uses `onData`/`onIdle` or similar, not guessing from render
- [ ] Any `useEffect` touching the map is **React → map** sync with `mapLoaded` guard, or a MapLibre event without a prop
- [ ] Marker drag uses `<Marker onDragEnd>`, not Map drag handlers

## Related chapters

- [declarative-source-layer.md](declarative-source-layer.md) — `<Source>` / `<Layer>` only; handlers assume declarative layers
- [feature-state.md](feature-state.md) — `setFeatureState` vs React filter, reset/diff, inspector sync, limitations
- [interactive-layer-ids.md](interactive-layer-ids.md) — `event.features`
- [map-loaded-hook.md](map-loaded-hook.md) — `onLoad`
- [initial-view-state.md](initial-view-state.md) — `onMoveEnd` / `onMove`
- [cursor-handling.md](cursor-handling.md) — `onMouseMove` / `onMouseLeave`
