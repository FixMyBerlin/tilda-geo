# Map URL state (`map=zoom/lat/lng`)

Store viewport in query param **`map`** as `zoom/lat/lng` (e.g. `12.1/52.5/13.4`). Sync from the Map on `onMoveEnd`.

**URL contract** (format, rounding, `parseMapParam` / `serializeMapParam`, `validateSearch`, slash encoding, `loaderDeps`): skill `tanstack-router-conventions` → [map-search-param.md](../../tanstack-router-conventions/references/map-search-param.md).

**Default (TanStack Router / Start):** route `validateSearch` + `navigate({ search })` + `@tanstack/react-pacer` for throttled high-frequency updates.

## Format (summary)

```
?map=<zoom>/<lat>/<lng>
```

Full precision rules and shared util: [map-search-param.md](../../tanstack-router-conventions/references/map-search-param.md).

## Parser / serializer

Reuse the shared helpers from the router skill (tilda-geo: `.../useQueryState/utils/mapParam.ts`). Do **not** wrap `serializeMapParam()` in `encodeURIComponent`.

**Router setup:** pretty `parseSearch` / `stringifySearch` — `tanstack-router-conventions` → `router-search-serialization.md`.

## TanStack Router (preferred)

Validate once on the route; read/write typed search in components. Schema + `replace: true` writes: [map-search-param.md](../../tanstack-router-conventions/references/map-search-param.md).

```tsx
// RegionMap.tsx
import { useNavigate } from '@tanstack/react-router'
import { serializeMapParam } from '@/shared/routing/mapParam'
import { Route } from '@/routes/regionen/$regionSlug'

const mapViewport = Route.useSearch({ select: (s) => s.map })
const navigate = useNavigate({ from: Route.fullPath })

<Map
  initialViewState={{
    longitude: mapViewport.lng,
    latitude: mapViewport.lat,
    zoom: mapViewport.zoom,
  }}
  onMoveEnd={(event) => {
    const { latitude, longitude, zoom } = event.viewState
    void navigate({
      search: (prev) => ({
        ...prev,
        map: serializeMapParam({ zoom, lat: latitude, lng: longitude }),
      }),
      replace: true, // avoid history entry per pan frame
    })
  }}
/>
```

Use **`replace: true`** on viewport drags; use default push semantics when the user navigates to a new place explicitly.

**Server redirects / hot map routes:** see [map-search-param.md](../../tanstack-router-conventions/references/map-search-param.md) and `tanstack-start-conventions` → `client-server-boundaries.md`.

## nuqs (when TanStack Router search is not used)

Next.js, Pages Router, or existing nuqs trees (tilda wraps `PageRegionSlug` with `NuqsAdapter`). Same parse/serialize util; nuqs owns the query string.

```tsx
import { createParser, useQueryState } from 'nuqs'
import { parseMapParam, serializeMapParam } from './utils/mapParam'

const mapParamParser = createParser({
  parse: (query) => parseMapParam(query),
  serialize: (object) => serializeMapParam(object),
}).withDefault(mapParamFallback)

export const useMapParam = () => {
  const [mapParam, setMapParam] = useQueryState('map', mapParamParser)
  return { mapParam, setMapParam }
}
```

```tsx
onMoveEnd={(event) => {
  const { latitude, longitude, zoom } = event.viewState
  void setMapParam(
    { zoom, lat: latitude, lng: longitude },
    { history: 'replace' },
  )
}}
```

Register param keys in a central registry if server URL normalization must preserve them (tilda: `searchParamsRegistry`).

## Server / tests

Reuse parsers in redirects, export links, and `URLSearchParams` — checklist in [map-search-param.md](../../tanstack-router-conventions/references/map-search-param.md).

## Checklist

- [ ] Shared `parseMapParam` / `serializeMapParam` per router skill
- [ ] TanStack Router: `validateSearch` + `navigate({ search, replace: true })` on `onMoveEnd`
- [ ] Without router search: nuqs `createParser` + `{ history: 'replace' }` on pan/zoom
- [ ] Never `encodeURIComponent(serializeMapParam(…))`
- [ ] `initialViewState` seeded from parsed param (see initial-view-state.md)
