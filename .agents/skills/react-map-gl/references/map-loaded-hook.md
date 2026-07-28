# Map loaded guard (useMapLoaded)

Parts of the map (style, sources, layers) are only safe to use **after** the map fires **`onLoad`**. Calling APIs earlier causes errors or silent no-ops — e.g. `getStyle()`, `queryRenderedFeatures()`, `setFeatureState()`.

react-map-gl issue [#2123](https://github.com/visgl/react-map-gl/issues/2123): `loaded` on the underlying map is the reliable signal; do not assume children mounted means the map is ready.

## Tilda pattern

Zustand flag set once in `onLoad`:

```tsx
// MapCanvas.tsx — handleLoad
const handleLoad = () => {
  markMapLoaded()
}

<Map id="mainMap" onLoad={handleLoad} … />
```

```tsx
// tilda-geo: useMapState.ts
mapLoaded: false,
markMapLoaded: () => set((state) => (state.mapLoaded ? state : { mapLoaded: true })),

export const useMapLoaded = () => useMapStore((state) => state.mapLoaded)
```

## Always guard map API usage

```tsx
// tilda-geo: UpdateFeatureState.tsx
const { mainMap } = useMap()
const mapLoaded = useMapLoaded()

useEffect(
  function syncSelectedFeatureStateToMap() {
    if (!mainMap || !mapLoaded) return
    // safeSetFeatureState(mainMap, …)
  },
  [currentSelectedFeatures, mainMap, mapLoaded],
)
```

```tsx
// tilda-geo: SidebarInspector.tsx
if (
  map &&
  mapLoaded && // before map is not completely loaded we can't queryRenderedFeatures()
  checkBounds.current &&
  inspectorSize.width !== 0
) {
  // fitBounds / queryRenderedFeatures
}
```

```tsx
// tilda-geo: useSelectedFeatures.ts
if (!run || !map || !mapLoaded || !mapBounds || !featuresParam) {
  return emptyArray
}
```

## Related loading signals

| Signal                         | Set when                 | Use for                                         |
| ------------------------------ | ------------------------ | ----------------------------------------------- |
| `mapLoaded` (`onLoad`)         | Style + map object ready | Feature state, queries, bounds fit              |
| `onData` / `onIdle` (tilda)    | Tile/source loading      | Loading indicator UI                            |
| `interactiveLayerIds` vs style | Can lag one tick         | Filter layer ids before `queryRenderedFeatures` |

Tilda wiring:

```tsx
<MapGl onLoad={handleLoad} onData={startMapDataLoading} onIdle={finishMapDataLoading} />
```

## Template for new apps

```tsx
// map-store.ts (or colocated zustand store)
const useMapStore = create(() => ({
  mapLoaded: false,
  actions: {
    markMapLoaded: () => set({ mapLoaded: true }),
  },
}))
export const useMapLoaded = () => useMapStore((s) => s.mapLoaded)
export const useMapActions = () => useMapStore((s) => s.actions)

// MapCanvas.tsx
const { markMapLoaded } = useMapActions()
<Map id="mainMap" onLoad={() => markMapLoaded()} />

// Any consumer
const mapLoaded = useMapLoaded()
const { mainMap } = useMap()
if (!mainMap || !mapLoaded) return null
```

## Do not

- Call `mainMap.getMap().getStyle()` or `queryRenderedFeatures` in render without `mapLoaded`.
- Treat `useMap()` returning a ref as “ready” — the ref exists before `onLoad`.
- Reset `mapLoaded` to false on every style change unless you explicitly handle `onLoad` again after `mapStyle` updates (if you change `mapStyle` at runtime, re-subscribe in `onLoad` or use style `load` events).
