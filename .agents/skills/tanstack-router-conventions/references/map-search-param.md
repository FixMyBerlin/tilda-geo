# Map search param (`?map=zoom/lat/lng`)

Canonical FMC viewport URL format from **tilda-geo** (`app/src/.../useQueryState/utils/mapParam.ts`). Use the same parse/serialize helpers on the route, in redirects, export links, and tests.

**Map component wiring** (`onMoveEnd`, `initialViewState`, MapProvider) → skill `react-map-gl` (`map-url-state.md`).

---

## Format

```
?map=<zoom>/<lat>/<lng>
```

Example: `?map=13/52.4989/13.4329`

| Part | Range    | Serialize precision                              |
| ---- | -------- | ------------------------------------------------ |
| zoom | 0–22     | **1** decimal                                    |
| lat  | −90–90   | by zoom: &lt;13 → 3, 13–16 → 4, ≥17 → 5 decimals |
| lng  | −180–180 | same as lat                                      |

Order is always **zoom / lat / lng** (not lon/lat first). `/` is **part of the value**, not a path segment.

---

## Parser / serializer (shared util)

```ts
// shared/routing/mapParam.ts (or feature-local equivalent)
import { z } from 'zod'
import { roundPositionForURL } from './roundNumber'

export type MapParam = { zoom: number; lat: number; lng: number }

// Coerce string segments from `split('/')` to numbers with range checks.
const MapParamSchema = z.tuple([
  z.coerce.number().min(0).max(22),
  z.coerce.number().min(-90).max(90),
  z.coerce.number().min(-180).max(180),
])

export const parseMapParam = (query: string): MapParam | null => {
  const parsed = MapParamSchema.safeParse(query.split('/'))
  if (!parsed.success) return null
  const [zoom, lat, lng] = parsed.data
  return { zoom, lat, lng }
}

export const serializeMapParam = ({ zoom, lat, lng }: MapParam) => {
  const [roundedLat, roundedLng, roundedZoom] = roundPositionForURL(lat, lng, zoom)
  return `${roundedZoom}/${roundedLat}/${roundedLng}`
}
```

**Fallback** when missing/invalid (tilda Berlin default):

```ts
export const mapParamFallback = { lat: 52.5, lng: 13.4, zoom: 12.1 }
```

Reject legacy / foreign shapes (`@52.8,13.6,12.5z`, bare strings) — `parseMapParam` returns `null`.

---

## Rounding (always on serialize)

Keep share URLs short; increase lat/lng precision only at higher zoom:

```ts
const roundNumber = (number: number | string, precision?: number) => {
  if (typeof number === 'string') {
    return Number.parseFloat(Number.parseFloat(number).toFixed(precision))
  }
  return Number.parseFloat(number.toFixed(precision))
}

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

Always round on **serialize**, not only on parse, so replace-state pans do not churn the URL with noise digits.

---

## Slashes — never `encodeURIComponent` the whole value

```ts
// ❌ Ugly share links: 13.5%2F52.4918%2F13.4261
encodeURIComponent(serializeMapParam({ zoom, lat, lng }))

// ✅ Readable: map=13.5/52.4918/13.4261
serializeMapParam({ zoom, lat, lng })
```

Wire Layer 1 pretty `parseSearch` / `stringifySearch` in `router.tsx` ([router-search-serialization.md](router-search-serialization.md)). If `map` ever goes through JSON stringify as a string value, also decode `%2F` → `/` in `makeSearchPretty`. Prefer a dedicated string param (this format) so `/` stays literal without JSON quotes.

---

## TanStack Router: `validateSearch` + writes

```ts
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { mapParamFallback, parseMapParam, serializeMapParam } from '@/shared/routing/mapParam'

const regionSearchSchema = z.object({
  map: z
    .string()
    .optional()
    .transform((s) => parseMapParam(s ?? '') ?? mapParamFallback),
})

export const Route = createFileRoute('/regionen/$regionSlug')({
  validateSearch: regionSearchSchema,
  // Do NOT put `map` in loaderDeps — pans must stay client-only (no loader re-run).
  component: RegionPage,
})
```

**Writes** (viewport sync — full Map wiring in `react-map-gl`):

```ts
void navigate({
  search: (prev) => ({
    ...prev,
    map: serializeMapParam({ zoom, lat: latitude, lng: longitude }),
  }),
  replace: true, // never push history per pan frame
})
```

Prefer a route-local `updateSearch` wrapper ([router-search-serialization.md](router-search-serialization.md)). High-frequency pans: throttle with `@tanstack/react-pacer` (`react-map-gl` → map-url-state).

Keep `map` **out of `loaderDeps`** so pans do not re-run the loader.

---

## Reuse everywhere

Same `parseMapParam` / `serializeMapParam`:

- Route `validateSearch` / `navigate({ search })`
- Server redirect builders (tilda: `getRegionRedirectUrl` — fill missing/invalid `map` from region default)
- Admin / QA export deep links
- Manual `URLSearchParams.get('map')` reads
- Tests (round-trip + reject `@lat,lng,z` shapes)

Register `map` in the app search-params allowlist / registry when redirects normalize URLs.

---

## Checklist

- [ ] Format `zoom/lat/lng` with shared `MapParam` type
- [ ] `roundPositionForURL` on every serialize
- [ ] Zod `validateSearch` transform → `MapParam` (+ fallback)
- [ ] Writes use `replace: true`; `map` **not** in `loaderDeps`
- [ ] Never `encodeURIComponent(serializeMapParam(…))`
- [ ] Pretty `parseSearch` / `stringifySearch` so `/` stays readable
- [ ] Redirects / exports use the same helpers

---

## Out of scope (TanStack Start)

Hot map routes with server redirects/auth: put that work in the **`loader`** (not `beforeLoad`), keep `map` out of `loaderDeps` — skill `tanstack-start-conventions` (client-server-boundaries). Map component wiring → `react-map-gl`.
