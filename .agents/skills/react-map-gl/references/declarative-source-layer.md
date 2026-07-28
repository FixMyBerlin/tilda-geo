# Declarative `<Source>` / `<Layer>` (not `addSource` / `addLayer`)

react-map-gl is a **reactive** wrapper around MapLibre. Sources and layers belong in the **React tree** as `<Source>` and `<Layer>` components — not as imperative calls on the map instance.

Upstream: [Adding custom data](https://visgl.github.io/react-map-gl/docs/get-started/adding-custom-data) · [Source API](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/source) · [Layer API](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/layer)

## Rule

**Do:** Declare sources and layers as JSX under `<Map>`. Let react-map-gl diff props into the style.

**Don't:** Call `map.addSource`, `map.addLayer`, `map.removeSource`, or `map.removeLayer` from `onLoad`, `useEffect`, or event handlers to manage app layers.

Read each pair together — a **Don't** line is never a recommendation on its own.

## Why imperative `addSource` / `addLayer` is wrong here

| Imperative (MapLibre tutorial style)                                | Declarative (react-map-gl)                                                                                     |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| You own add/remove lifecycle and must clean up                      | react-map-gl syncs mount/unmount and prop updates                                                              |
| Style can drift from React state (URL, toggles, selection)          | React state drives what is on the map                                                                          |
| Layers added imperatively are easy to miss in `interactiveLayerIds` | Declarative `<Layer id>` stays aligned with picking — see [interactive-layer-ids.md](interactive-layer-ids.md) |
| Easy to double-add or leak sources on re-render                     | Stable `id` + React `key` — see [flat-source-layer.md](flat-source-layer.md)                                   |

MapLibre’s own guides show `map.addSource` / `map.addLayer` for vanilla JS. In FMC apps on react-map-gl, that pattern **fights** the library’s style diffing and our [event-handler model](map-event-handlers.md).

## Anti-pattern

```tsx
// ❌ Imperative — bypasses react-map-gl; duplicates lifecycle; hard to sync with URL/toggles
const handleLoad = () => {
  const map = mainMap.getMap()
  map.addSource('regions', { type: 'vector', url: pmtilesUrl })
  map.addLayer({
    id: 'regions-fill',
    type: 'fill',
    source: 'regions',
    'source-layer': 'default',
    paint: { 'fill-color': '#3b82f6' },
  })
}
```

```tsx
// ❌ Effect-driven add/remove — same problems; cleanup often wrong on fast navigation
useEffect(() => {
  const map = mainMap?.getMap()
  if (!map || !mapLoaded) return
  map.addSource(SOURCE_ID, { type: 'geojson', data: features })
  map.addLayer({ id: LAYER_ID, type: 'fill', source: SOURCE_ID, … })
  return () => {
    if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
  }
}, [mainMap, mapLoaded, features])
```

Use declarative JSX instead — structure, props, and keys: [flat-source-layer.md](flat-source-layer.md). Show/hide via `layout.visibility` or conditional render (not `map.setLayoutProperty`): [layer-visibility-vs-unmount.md](layer-visibility-vs-unmount.md). Wire picks on `<Map>` with `interactiveLayerIds` + handlers: [map-event-handlers.md](map-event-handlers.md), [interactive-layer-ids.md](interactive-layer-ids.md).

## Imperative APIs that are still OK

These do **not** replace `<Source>` / `<Layer>` for app data — see each doc for when they apply:

- `map.addImage` / `styleimagemissing` — [map-images-missing.md](map-images-missing.md)
- `map.setFeatureState` on existing layers — [feature-state.md](feature-state.md)
- Other guarded `getMap()` calls after load — [map-loaded-hook.md](map-loaded-hook.md)

If you reach for `getMap()` to **create** a source or layer, stop and add JSX instead.

## Checklist for reviews

- [ ] No `addSource` / `addLayer` / `removeSource` / `removeLayer` for application map data
- [ ] No effect-driven layer lifecycle when declarative `<Source>` / `<Layer>` would work
- [ ] No `map.setLayoutProperty(…, 'visibility', …)` when `<Layer layout={…} />` suffices — [layer-visibility-vs-unmount.md](layer-visibility-vs-unmount.md)
