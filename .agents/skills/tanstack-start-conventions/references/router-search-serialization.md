# Router search serialization (clean share URLs)

TanStack Router’s default `stringifySearch` percent-encodes characters that are safe in query values but ugly in the location bar: `"`, `,`, `'`, `(`, `)`, `:`, `;`, `[`, `]`, `{`, `}`, `/`, etc. Parsing still works, but share links look like `answers=%7B%22sidepath%22%3A%22yes%22%7D` instead of readable text.

**Primary reference:** `osm-traffic-sign-tools` → `routerSearch.ts` (JSON parse/stringify + selective decode).  
**FMC region apps:** also see map slashes (`react-map-gl` → `map-url-state.md`) and optional jsurl for very large objects (below).

**Official:** [TanStack Router — custom search param serialization](https://tanstack.com/router/latest/docs/framework/react/guide/search-params#custom-search-param-serialization)

---

## Required `router.tsx` setup

Every FMC TanStack Start app **must** wire custom `parseSearch` / `stringifySearch` in `createRouter` — even before any param needs special encoding. Start with the pretty-JSON wrapper; add per-param serializers in `validateSearch` / Zod preprocess as needed.

```ts
import { createRouter } from '@tanstack/react-router'
import { routerSearch } from '@/shared/routing/routerSearch' // or feature-local path

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    trailingSlash: 'never',
    parseSearch: routerSearch.parse,
    stringifySearch: routerSearch.stringify,
    // …context, defaultPreload, error/pending components, Query integration
  })
  return router
}
```

Also required on the root route (canonical URLs):

```ts
beforeLoad: ({ location }) => {
  const { pathname, searchStr, hash } = location
  if (pathname.length <= 1 || !pathname.endsWith('/')) return
  const stripped = pathname.replace(/\/+$/, '') || '/'
  throw redirect({
    href: `${stripped}${searchStr}${hash ? `#${hash}` : ''}`,
    replace: true,
  })
},
```

Pair with `trailingSlash: 'never'` in `createRouter`.

---

## Layer 1 — pretty JSON (default for all apps)

Wrap TanStack Router’s built-in JSON (de)serialization. **Parse** stays the default (`parseSearchWith(JSON.parse)`). **Stringify** runs the default, then selectively decodes safe characters so arrays, objects, and punctuation read cleanly.

```ts
import { parseSearchWith, stringifySearchWith } from '@tanstack/react-router'

const parseSearch = parseSearchWith(JSON.parse)
const stringifySearchDefault = stringifySearchWith(JSON.stringify)

/** Decode safe query-value characters after default stringify. */
const makeSearchPretty = (searchString: string) =>
  searchString
    .replaceAll('%22', '"')
    .replaceAll('%2C', ',')
    .replaceAll('%27', "'")
    .replaceAll('%28', '(')
    .replaceAll('%29', ')')
    .replaceAll('%3A', ':')
    .replaceAll('%3B', ';')
    .replaceAll('%5B', '[')
    .replaceAll('%5D', ']')
    .replaceAll('%7B', '{')
    .replaceAll('%7D', '}')

export const routerSearch = {
  parse: parseSearch,
  stringify: (search: Record<string, unknown>) => makeSearchPretty(stringifySearchDefault(search)),
}
```

**Intentionally keep encoded** (URL breakers): `#`, `&`, `=`, `<`, `>`, `` ` ``, `%`, `+`.

**What this fixes without per-param work:**

| TanStack Router JSON value   | Ugly default                  | After `makeSearchPretty` |
| ---------------------------- | ----------------------------- | ------------------------ |
| `["foo","bar"]`              | `%5B%22foo%22%2C%22bar%22%5D` | `["foo","bar"]`          |
| `{"a":1}`                    | `%7B%22a%22%3A1%7D`           | `{"a":1}`                |
| `DE:240;DE:241` (string)     | often fine                    | `DE:240;DE:241`          |
| `focus=area1,area2` (string) | `%2C` in value                | `focus=area1,area2`      |

`parseSearchWith(JSON.parse)` may yield **objects or arrays** for JSON-shaped values and **numbers** for bare digits (`q=241` → `241`). Coerce in Zod (`z.coerce.string()`, preprocess) — see `deSearch.ts` in osm-traffic-sign-tools.

---

## Layer 2 — per-param encoding (choose per key)

Router pretty-JSON is the baseline. Each search param picks the **smallest** encoding that round-trips and stays readable.

| Shape                   | Encoding                               | Example                                  | When                                                           |
| ----------------------- | -------------------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| Enum / flag             | plain string                           | `qa=actionable`                          | Single choice; omit at default                                 |
| List of tokens          | comma-separated string                 | `focus=area1,area2`                      | Short lists; parse with `.split(',')`                          |
| Structured but bounded  | domain compact string                  | `answers=240.sidepath.yes,237.color.red` | Avoid JSON `"` churn; custom parse/serialize in Zod preprocess |
| Small object / array    | TanStack JSON + pretty stringify       | `filter={"users":[1,2]}`                 | Few keys; router handles (de)serialization                     |
| Slash-containing scalar | custom string, no `encodeURIComponent` | `map=13.5/52.4918/13.4261`               | `/` is part of the value — see map-url-state.md                |
| **Large** nested state  | **jsurl2** (optional)                  | `notesMode=(folder~7~…)`                 | Only when JSON/compact strings get too long                    |

Implement per-param logic in:

- Route `validateSearch` Zod schema (`.preprocess`, `.transform`, dedicated `parseX` / `serializeX`)
- Shared `shared/<domain>/searchSchemas.ts` when reused across routes and server redirects

**Compact string example** (osm-traffic-sign-tools `answersParam.ts`):

```ts
// Serialize: object → "sign.question.answer,sign.question.answer"
// Parse: compact string OR legacy JSON string OR legacy object (from old URLs)
export const coerceAnswersSearchParam = (raw: unknown): string | undefined => { … }
```

**Do not** wrap custom serializers in `encodeURIComponent` on output. The router layer encodes URL breakers; your job is to avoid unnecessary encoding of safe punctuation.

---

## Layer 3 — jsurl2 (large objects only)

[jsurl2](https://github.com/wmertens/jsurl2) is **not** the default. Use it when a param holds a large nested object and both JSON and a hand-rolled compact format would be unwieldy (FMC region modes: `notesMode`, `draw`, legacy `config`).

When a route-owned param uses jsurl:

1. Add the key to a `jsurlSearchKeys` list used by extended router helpers (see `tilda-geo-modes` → `jsurlRouterSearch.ts`).
2. Register the same key in `searchParamsRegistry` (redirect allowlist).
3. Reuse shared `jsurlParse` / `jurlStringify` everywhere (router helpers, server redirects, tests).

```ts
// Only for keys in jsurlSearchKeys — wrap the Layer 1 helpers
export const parseSearchWithJsurl = (searchStr: string) => {
  const search = routerSearch.parse(searchStr)
  for (const key of jsurlSearchKeys) {
    if (typeof search[key] === 'string') search[key] = jsurlParse(search[key])
  }
  return search
}
```

---

## `map=zoom/lat/lng`

The `/` characters are **part of the value**, not path segments. Add `%2F` → `/` to `makeSearchPretty` if map is stored as a JSON string through the router, or serialize via a dedicated parser that never uses `encodeURIComponent`:

```ts
// ❌ Produces 13.5%2F52.4918%2F13.4261
encodeURIComponent(serializeMapParam({ zoom, lat, lng }))

// ✅ Readable share links
serializeMapParam({ zoom, lat, lng }) // → "13.5/52.4918/13.4261"
```

See `react-map-gl` → `map-url-state.md`.

---

## Writing search params — history, defaults, throttle (nuqs → router parity)

`navigate({ search })` does **not** include nuqs `useQueryState` defaults. Decide these per setter:

- **History mode:** TanStack defaults to **push** (`replace: false` — [NavigateOptions](https://tanstack.com/router/latest/docs/framework/react/api/router/NavigateOptionsType)). Pass **`replace: true`** for toggles, filters, and viewport updates. Use push only for real navigation.
- **Clear on default:** set the key to **`undefined`** or add **`stripSearchParams`** with defaults ([search middlewares](https://tanstack.com/router/latest/docs/framework/react/guide/search-params#transforming-search-with-search-middlewares)). Zod defaults only affect reading.
- **Throttle high-frequency writes:** map pans/drags need `@tanstack/react-pacer`; see `react-map-gl` → `map-url-state.md`.

Use one route-local `updateSearch` wrapper so setters compose from fresh `prev` state ([functional search updater](https://tanstack.com/router/latest/docs/framework/react/guide/search-params#usenavigate-navigate-search)) and `undefined` deletes keys:

```ts
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import type { RegionSearch } from '@/shared/regionen/regionSearchSchemas'

const regionRouteApi = getRouteApi('/regionen/$regionSlug')

type NavigateOptions = {
  replace?: boolean
}

export const useRegionSearchNavigation = () => {
  const search = regionRouteApi.useSearch()
  const navigate = useNavigate({ from: '/regionen/$regionSlug' })

  const updateSearch = (
    partial: Partial<RegionSearch> | ((prev: RegionSearch) => Partial<RegionSearch>),
    options?: NavigateOptions,
  ) => {
    void navigate({
      search: (prev) => {
        const updates = typeof partial === 'function' ? partial(prev) : partial
        const next: Record<string, unknown> = { ...prev }

        for (const [key, value] of Object.entries(updates)) {
          if (value === undefined) {
            delete next[key]
          } else {
            next[key] = value
          }
        }

        return next as RegionSearch
      },
      replace: options?.replace,
    })
  }

  return { search, updateSearch, navigate }
}
```

---

## Rules (non-negotiable)

1. **`router.tsx` always** exports `parseSearch` / `stringifySearch` — at minimum the Layer 1 pretty-JSON wrapper.
2. **Pick the smallest encoding** per param; reach for jsurl only when size/readability demands it.
3. **Do not** `encodeURIComponent` custom serialize output (`map`, compact strings, jsurl).
4. **Zod owns validation** — coerce router JSON quirks (`z.coerce.string()` for `q=241`, preprocess for legacy object shapes).
5. **Single source of truth** — same parse/serialize helpers in routes, redirect builders, and tests.
6. **Registry** — every preserved query key in `searchParamsRegistry` (or app equivalent) for redirect normalization.

---

## Tests

- Pretty stringify: `["foo","bar"]` and `{"a":1}` stay readable; round-trip through `parse` + `stringify`
- Per-param compact format round-trips and accepts legacy JSON / object shapes
- Map slashes readable; legacy `%2F` still parses
- If jsurl keys exist: jsurl uses `(` / `!` syntax; non-jsurl params unchanged
- Broken input: prefer Zod `.catch()` / tolerant parse over throwing in router helpers

---

## Checklist (new search param)

- [ ] Smallest encoding chosen (string / csv / compact / JSON / jsurl)
- [ ] Zod schema with parse + serialize helpers
- [ ] Key in redirect/search registry when redirects normalize URLs
- [ ] `router.tsx` uses shared `routerSearch` (± jsurl extension if needed)
- [ ] Server redirects and export links use the same serialize helpers
- [ ] Tests cover round-trip and legacy URL shapes
