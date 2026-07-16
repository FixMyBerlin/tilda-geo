# Map URL state (`map=zoom/lat/lng`)

Store viewport in query param **`map`** as `zoom/lat/lng` (e.g. `12.1/52.5/13.4`). Parse/serialize with Zod; round coordinates for clean URLs; sync on `onMoveEnd`.

**Default (TanStack Router / Start):** route `validateSearch` + `navigate({ search })` + `@tanstack/react-pacer` for throttled high-frequency updates.

## Format

```
?map=<zoom>/<lat>/<lng>
```

- **zoom**: 0–22, serialized to **1 decimal**
- **lat**: -90–90, precision depends on zoom
- **lng**: -180–180, same precision as lat

## Parser / serializer (shared util)

Use the same functions on the route, in server redirects, and in tests:

```tsx
// mapParam.ts
import { z } from 'zod'
import { roundPositionForURL } from './roundNumber'

export type MapParam = { zoom: number; lat: number; lng: number }

const MapParamSchema = z.tuple([range(0, 22), range(-90, 90), range(-180, 180)])

export const parseMapParam = (query: string) => {
  const parsed = MapParamSchema.safeParse(query.split('/'))
  if (!parsed.success) return null
  const [zoom, lat, lng] = parsed.data
  return { zoom, lat, lng } satisfies MapParam
}

export const serializeMapParam = ({ zoom, lat, lng }: MapParam) => {
  const [roundedLat, roundedLng, roundedZoom] = roundPositionForURL(lat, lng, zoom)
  return `${roundedZoom}/${roundedLat}/${roundedLng}`
}
```

## Rounding

Keep URLs short; increase lat/lng precision at higher zoom:

```tsx
const roundByZoom = (number: number | string, zoom: number) => {
  const latLngPrecisionByZoom = zoom >= 17 ? 5 : zoom < 13 ? 3 : 4
  return roundNumber(number, latLngPrecisionByZoom)
}

export const roundPositionForURL = (lat: number, lng: number, zoom: number) => {
  lat = roundByZoom(lat, zoom)
  lng = roundByZoom(lng, zoom)
  zoom = roundNumber(zoom, 1)
  return [lat, lng, zoom] as const
}
```

| Zoom    | Lat/lng decimal places |
| ------- | ---------------------- |
| &lt; 13 | 3                      |
| 13–16   | 4                      |
| ≥ 17    | 5                      |

Always round on **serialize**, not only on parse, so replace-state updates do not churn the URL.

## Slashes in the value — router or parser, not full encoding

`map` is `zoom/lat/lng`. The `/` characters are **part of the value**, not URL path segments.

**Do not** wrap `serializeMapParam()` in `encodeURIComponent` — that produces `12.1%2F52.5%2F13.4`. Parsing still works when decoded, but FMC share links use readable slashes.

**Do:** update through TanStack Router `search` or nuqs `createParser` — both encode `&`, `#`, etc. while keeping `/` readable in the value.

**Router setup:** FMC apps must wire `parseSearch` / `stringifySearch` in `router.tsx` (pretty JSON baseline) — skill `tanstack-start-conventions` → `router-search-serialization.md`.

## TanStack Router (preferred)

Validate once on the route; read/write typed search in components. See skill `tanstack-start-conventions`.

```tsx
// routes/regionen/$regionSlug.tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { parseMapParam, serializeMapParam } from '@/utils/mapParam'
import { mapParamFallback } from '@/utils/mapParamFallback'

const regionSearchSchema = z.object({
  map: z
    .string()
    .optional()
    .transform((s) => parseMapParam(s ?? '') ?? mapParamFallback),
})

export const Route = createFileRoute('/regionen/$regionSlug')({
  validateSearch: (search) => regionSearchSchema.parse(search),
  component: RegionPage,
})
```

```tsx
// RegionMap.tsx
import { useNavigate } from '@tanstack/react-router'
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

**Server redirects:** reuse `parseMapParam` / `serializeMapParam` in the route's redirect step and redirect builders (tilda: `getRegionRedirectUrl`). Note: on a hot map route, run the redirect/region resolution in the **`loader`** (gated by `loaderDeps`), not `beforeLoad`, so map pans stay client-only — see `tanstack-start-conventions` → `client-server-boundaries.md`.

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

Reuse parsers in:

- Redirect builders (`getRegionRedirectUrl`)
- Admin export links (`serializeMapParam`)
- Manual reads (`parseMapParam` from `URLSearchParams.get('map')`)

## Checklist

- [ ] Single canonical `MapParam` type and Zod tuple schema
- [ ] `roundPositionForURL` on every serialize
- [ ] TanStack Router: `validateSearch` + `navigate({ search, replace: true })` on `onMoveEnd`
- [ ] Without router search: nuqs `createParser` + `{ history: 'replace' }` on pan/zoom
- [ ] Never `encodeURIComponent(serializeMapParam(…))`
- [ ] `initialViewState` seeded from parsed param (see initial-view-state.md)
