---
name: react-map-gl
description: >-
  react-map-gl/maplibre patterns for FMC geo apps: declarative Source/Layer (never addSource/addLayer),
  MapProvider + useMap(), interactiveLayerIds, flat Source/Layer, map-loaded guard, window.__mainMap debug
  exposure, Map event handlers (not useEffect), URL map state, initialViewState, cursor, feature state,
  missing images. Use when building or reviewing Map components, layers, click/hover handlers,
  setFeatureState, map URL sync, or agent/test map inspection in TanStack Start / Vite apps.
  Reference implementation: tilda-geo/app.
disable-model-invocation: true
---

# react-map-gl (MapLibre)

Conventions for `react-map-gl/maplibre` in FixMyBerlin / FMC projects. Import from `react-map-gl/maplibre` (not `react-map-gl` alone). Always import `maplibre-gl/dist/maplibre-gl.css`.

## When to apply

- Adding or changing `<Map>`, `<Source>`, `<Layer>`, controls, markers
- Click/hover/feature inspection wired to map events
- Syncing viewport to URL (`map=zoom/lat/lng`)
- Child components that need the map instance (feature state, fitBounds, queryRenderedFeatures)
- Debugging “map half loaded” errors, missing style images, or wrong click targets
- Highlighting selected/hovered features (`setFeatureState` vs layer `filter`)
- Reviewing code that uses `useEffect` to sync map camera, clicks, or hover
- Code calling `map.addSource`, `map.addLayer`, or effect-driven layer lifecycle
- Agent or E2E inspection of layer order, zoom, or rendered features (`window.__mainMap`)

## Reference reading order

1. [declarative-source-layer.md](references/declarative-source-layer.md) — **`<Source>` / `<Layer>` only; never `map.addSource` / `map.addLayer`**
2. [map-event-handlers.md](references/map-event-handlers.md) — **which `<Map>` handler for which use case; not useEffect**
3. [map-provider-wrapper.md](references/map-provider-wrapper.md) — **MapProvider parent; useMap(); never manual refs**
4. [interactive-layer-ids.md](references/interactive-layer-ids.md) — `interactiveLayerIds` + `event.features` (not raw MapLibre)
5. [map-loaded-hook.md](references/map-loaded-hook.md) — guard map API calls until `onLoad` / `useMapLoaded()`
6. [map-debug-exposure.md](references/map-debug-exposure.md) — **`window.__mainMap` in dev/Playwright; `exposeMainMapForDebugging` in `onLoad`**
7. [feature-state.md](references/feature-state.md) — **`setFeatureState` vs React `filter`; reset/diff; inspector sync**
8. [flat-source-layer.md](references/flat-source-layer.md) — sibling `<Source>` + `<Layer>`, required props
9. [layer-visibility-vs-unmount.md](references/layer-visibility-vs-unmount.md) — `layout.visibility` vs conditional render
10. [map-props-attribution-locale.md](references/map-props-attribution-locale.md) — `attributionControl={false}`, `locale`, `RTLTextPlugin`
11. [cursor-handling.md](references/cursor-handling.md) — `cursor` prop from hover state
12. [initial-view-state.md](references/initial-view-state.md) — uncontrolled `initialViewState` vs URL-driven vs bounds
13. [map-url-state.md](references/map-url-state.md) — `map=zoom/lat/lng` hook, rounding, nuqs
14. [map-images-missing.md](references/map-images-missing.md) — `styleimagemissing` + dynamic icons
15. [map-images-proactive.md](references/map-images-proactive.md) — proactive `addImage` for known sprites (vzk-bw)

Pair with: skill `nuqs` (URL parsers), skill `zustand-state-management` (map UI store like `useMapLoaded`), skill `playwright-skill` (E2E map helpers, `getMapLayerIds`).

## Non-negotiable rules

| Topic             | Rule                                                                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sources / layers  | **`<Source>` + `<Layer>` in JSX only.** **Never** `map.addSource` / `map.addLayer` (or remove\*) for app data. Show/hide via `layout.visibility` or conditional render — see declarative-source-layer.md. |
| Map events        | Camera, pointer, load, and tile lifecycle → `<Map>` callback props. **Not** `useEffect` + `map.on(…)` for the same behavior.                                                                              |
| Map access        | Wrap app map UI in `<MapProvider>`. Use `useMap()` keyed by `<Map id="…">`. **Never** pass `ref` to `<Map>` for child access.                                                                             |
| Map ready         | Guard `getStyle`, `queryRenderedFeatures`, `setFeatureState`, etc. with `useMapLoaded()` (set in `onLoad`).                                                                                               |
| Debug exposure    | In `onLoad`, call `exposeMainMapForDebugging(event.target)` (dev + Playwright only). Agents/tests read `window.__mainMap` — see map-debug-exposure.md.                                                    |
| Layers            | Flat siblings: one `<Source>` per source id, then `<Layer>` siblings (not nested layers under Source for refactorability).                                                                                |
| Clicks            | Put layer ids in `interactiveLayerIds`; read `event.features` in handlers — do not call `queryRenderedFeatures` for primary click picking unless syncing URL features.                                    |
| Feature highlight | Inspector/form truth in React; map tint via `setFeatureState` (paint) or React `filter` layer — see feature-state.md. Clear old state before applying new.                                                |
| Attribution       | `attributionControl={false}` on `<Map>`; add `<AttributionControl>` as child with desired position.                                                                                                       |
| Viewport URL      | Serialize `zoom/lat/lng` with zoom-aware lat/lng rounding; write on `onMoveEnd` with `history: 'replace'`.                                                                                                |
| View state        | Prefer **uncontrolled** `initialViewState` seeded from URL; do not mirror full viewState in React state unless you need programmatic camera control.                                                      |

## Quick import

```tsx
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapProvider, Map, Source, Layer, useMap } from 'react-map-gl/maplibre'
```
