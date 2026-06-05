# Rust / WASM geo — TanStack Start integration

TanStack Start apps use the same Vite WASM plugins as SPAs. Extra rules: **client/server boundaries** and **selective SSR** — WASM must never initialize during server render or in server-only modules.

Pair with `tanstack-start-conventions` and `tanstack-start-app-structure`.

---

## Vite config

Same as SPA — add to `vite.config.ts`:

```typescript
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  plugins: [, /* start plugin */ wasm(), topLevelAwait()],
  optimizeDeps: { exclude: ['geo-isochrone'] },
})
```

---

## Where WASM may live

| Location                                         | WASM OK?                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| `*.tsx` route/page components (client render)    | Yes — lazy init                                                           |
| `wasm.ts`, feature hooks                         | Yes                                                                       |
| `*.server.ts`                                    | **No**                                                                    |
| `*.functions.ts` / `createServerFn`              | **No** — use native Rust on server or precompute assets, not browser WASM |
| Route `loader` / `beforeLoad` (server execution) | **No** WASM import in the loader module graph                             |
| Shared `utils/` imported by loaders              | **No** if it transitively imports `wasm.ts`                               |

Keep the WASM dependency graph **leaf-only**: map feature folder → `wasm.ts` → `pkg/`.

---

## SSR and route `ssr`

WASM requires `WebAssembly` in the browser — it does not run in Node SSR.

| Route pattern                               | `ssr`         | WASM init                                              |
| ------------------------------------------- | ------------- | ------------------------------------------------------ |
| Map-heavy page, server auth + Query preload | `'data-only'` | After hydration in component or `useEffect` / mutation |
| Fully client-first tool                     | `false`       | Same — still lazy-init to avoid blocking               |
| Static marketing page                       | `true`        | N/A — no WASM on route                                 |

See [selective-ssr.md](../../tanstack-start-conventions/references/selective-ssr.md): map/canvas routes commonly use `ssr: 'data-only'` so `beforeLoad` / loader run on the server while the map shell is client-rendered.

**Do not** import `wasm.ts` in the route file's top-level if that route's module is evaluated on the server — import from a child component loaded only on the client, or dynamic-import inside an event handler / mutation.

```typescript
// IsochroneTool.tsx — client component under a data-only map route
import { useBufferPolygon } from './useIsochrone'

export function IsochroneTool() {
  const buffer = useBufferPolygon()
  // WASM loads on first mutation via wasm.ts ensureWasm()
  return <button onClick={() => buffer.mutate({ ... })}>Buffer</button>
}
```

---

## Data loading with TanStack Query

Heavy geo compute is **client-side mutation**, not a server loader:

```typescript
// useIsochrone.ts
import { useMutation } from '@tanstack/react-query'
import { bufferPolygon } from './wasm'

export function useBufferPolygon() {
  return useMutation({
    mutationFn: bufferPolygon,
  })
}
```

- **Loader / Query:** fetch GeoJSON or bincode **assets** from API or static files.
- **Mutation / lazy WASM:** run Rust compute on the client after data is present.
- Do not block `loader` on WASM — server has no WASM runtime in the browser sense.

---

## Folder layout (Start)

Align with `tanstack-start-app-structure`:

```
app/src/
├── routes/
│   └── regions/$regionSlug/map.tsx    # thin route; ssr: 'data-only'
├── features/isochrone/
│   ├── wasm.ts
│   ├── useIsochrone.ts
│   └── IsochronePanel.tsx
└── wasm/geo-isochrone/                # Rust source (sibling or monorepo root)
```

Route file: wire layout, `ssr`, loader for auth/data. Feature folder: WASM + map UI.

---

## Server-side Rust (out of scope for WASM)

If compute must run on the server (batch jobs, API responses):

- Use a **native Rust binary or service**, not `wasm-pack` browser target.
- Expose results as GeoJSON/bincode via `createServerFn` or API routes.
- Client WASM is for interactive, main-thread-heavy work after data arrives.

---

## Checklist (Start + WASM)

- [ ] `vite-plugin-wasm` + top-level await configured
- [ ] `wasm-pack build` in dev/build scripts
- [ ] Only `wasm.ts` imports `pkg/`
- [ ] No WASM in server module graph (`*.server.ts`, loaders, `createServerFn`)
- [ ] Map routes use explicit `ssr: 'data-only'` or `false`
- [ ] Geo compute via Query `useMutation` or explicit lazy init — not loader
- [ ] GeoJSON validated with Zod after Rust returns strings
