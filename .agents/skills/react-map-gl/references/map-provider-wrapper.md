# MapProvider + useMap()

react-map-gl exposes the map instance to **any descendant of `<MapProvider>`** via `useMap()`, keyed by the `<Map id="…">` prop. Child components of `<Map>` are not the only consumers — sidebars, inspectors, and sync helpers often sit **next to** `<Map>` in the layout.

## Rule

1. One parent wraps all map-related UI: `<MapProvider>…</MapProvider>`.
2. `<Map id="mainMap">` (or another stable id) lives inside that tree.
3. Any component that needs the map calls `const { mainMap } = useMap()` — the key matches the `id`.
4. **Do not** use `ref={mapRef}` on `<Map>` and thread refs through props. That breaks when siblings need the map and fights react-map-gl’s context model.

## Tilda pattern

`MapInterface` wraps the entire map page — map, sidebars, controls — in `MapProvider`:

```tsx
// tilda-geo: MapInterface.tsx
import { MapProvider } from 'react-map-gl/maplibre'

export const MapInterface = () => (
  <MapProvider>
    <div className="relative flex h-full w-full flex-row gap-4">
      <RegionMap /> {/* contains <Map id="mainMap"> */}
      <SidebarLayerControls />
      <SidebarInspector /> {/* useMap() — sibling of Map, not child */}
      {/* …controls, debug… */}
    </div>
  </MapProvider>
)
```

`RegionMap` sets the id; siblings use the same key:

```tsx
// tilda-geo: RegionMap.tsx
<MapGl id="mainMap" …>
  <UpdateFeatureState />   {/* useMap() inside Map children — also fine */}
  {/* sources, layers, controls */}
</MapGl>
```

```tsx
// tilda-geo: UpdateFeatureState.tsx — child of Map
const { mainMap } = useMap()

// tilda-geo: SidebarInspector.tsx — sibling of Map, still works
const { mainMap: map } = useMap()
```

## Minimal template (copy for new apps)

```tsx
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapProvider, Map, useMap } from 'react-map-gl/maplibre'

const MAP_ID = 'mainMap'

function MapCanvas() {
  return (
    <Map
      id={MAP_ID}
      initialViewState={{ longitude: 13.4, latitude: 52.5, zoom: 12 }}
      mapStyle="/api/map-style"
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
    >
      {/* Source/Layer children */}
    </Map>
  )
}

function MapSidebar() {
  const { [MAP_ID]: map } = useMap() // or: const { mainMap } = useMap() when id="mainMap"
  // map?.getMap(), map?.queryRenderedFeatures(), etc. — only after loaded (see map-loaded-hook.md)
  return null
}

export function MapPage() {
  return (
    <MapProvider>
      <div className="flex h-full">
        <MapCanvas />
        <MapSidebar />
      </div>
    </MapProvider>
  )
}
```

## Multiple maps

Each `<Map id="uniqueId">` registers separately. `useMap()` returns `{ uniqueId: MapRef, … }`. Tilda’s note-creation modal uses `id="newOsmNoteMap"` while the main map uses `id="mainMap"` — both stay under the same `MapProvider` from `MapInterface`.

## Anti-patterns

```tsx
// ❌ Manual ref — do not use for cross-component map access
const mapRef = useRef<MapRef>(null)
<Map ref={mapRef} />
<Sidebar mapRef={mapRef} />

// ❌ MapProvider only around Map — siblings cannot useMap()
<MapProvider><Map /></MapProvider>
<Sidebar /> {/* useMap() returns empty */}
```

## Getting the native MapLibre instance

`useMap()` returns a react-map-gl `MapRef`. For MapLibre APIs:

```tsx
mainMap?.getMap() // maplibregl.Map
```

Use `mainMap` (react-map-gl wrapper) for `setFeatureState` helpers that expect `MapRef`; use `getMap()` for style/source APIs.
