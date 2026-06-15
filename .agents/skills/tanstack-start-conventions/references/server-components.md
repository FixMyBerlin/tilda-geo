# TanStack Start — Server Components (RSC)

> **Experimental.** The RSC API may see refinements. Not enabled by default in FMC apps today.

Server Components render React on the server and stream to the client. Heavy deps stay out of the client bundle; data fetching and sensitive logic stay server-side.

**Official docs:** [Server Components](https://tanstack.com/start/latest/docs/framework/react/guide/server-components)

**Related FMC refs:** [client-server-boundaries.md](client-server-boundaries.md) (where RSC code lives) · [selective-ssr.md](selective-ssr.md) (pairing with `ssr`) · [router-and-query.md](router-and-query.md) (Query loaders)

---

## When to use RSC

Default FMC data/UI flow is isomorphic loaders + `createServerFn` + React Query — see [client-server-boundaries.md](client-server-boundaries.md) and [router-and-query.md](router-and-query.md). Reach for RSC when you need:

- Heavy server-only rendering (markdown, syntax highlighting) without bloating the client bundle
- Server-rendered UI composed with client interactivity via **slots**
- Progressive streaming of server-rendered widgets

RSC is **not** Next.js async server components in route files. Create UI in `*.functions.ts` (`createServerFn`), return through the route `loader`, render as `{Renderable}` or `<CompositeComponent src={...} />`.

Migrating from Next RSC? See `tanstack-start-migration` mental-model section — not a drop-in replacement.

---

## Setup

FMC TanStack Start apps use **Vite** (e.g. [tilda-geo `app/vite.config.ts`](https://github.com/FixMyBerlin/tilda-geo/blob/main/app/vite.config.ts)): `nitro`, `tailwindcss`, `tanstackStart`, `viteReact`, React Compiler via `@rolldown/plugin-babel`. **Not Rsbuild.**

RSC is additive on that baseline. Follow the official [**Setup → Vite**](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#setup) steps (`@vitejs/plugin-rsc`, enable `rsc` in `tanstackStart`, add `rsc()`). In FMC configs, keep plugin order: existing plugins → `tanstackStart({ rsc: { enabled: true } })` → `rsc()` → `viteReact()` → babel (React Compiler). Requirements: React 19+, Vite 7+.

---

## Official docs — read there, not here

| Topic                                                            | Official section                                                                                                                                                                                                                                |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Helpers (`renderServerComponent`, `createCompositeComponent`)    | [Quick Start](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#quick-start)                                                                                                                                       |
| Slot types (`children`, render props, component props)           | [Passing Props and Composition](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#passing-props-and-composition)                                                                                                   |
| Router / Query caching, `structuralSharing: false`, invalidation | [Caching](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#caching)                                                                                                                                               |
| `ssr: 'data-only'` / `ssr: false` with RSC                       | [Combining with Selective SSR](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#combining-with-selective-ssr)                                                                                                     |
| Parallel fetches, bundling, streaming, generators                | [Advanced Patterns](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#advanced-patterns)                                                                                                                           |
| Route vs widget errors                                           | [Error Handling](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#error-handling)                                                                                                                                 |
| `React.cache`, `Link`, CSS                                       | [Tips](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#tips)                                                                                                                                                     |
| Slot opacity, serialization rules, experimental status           | [Rules and Limitations](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#rules-and-limitations) · [Current Status](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#current-status) |
| `renderToReadableStream`, `createFromFetch`                      | [Low-Level Flight Stream APIs](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#low-level-flight-stream-apis)                                                                                                     |

---

## FMC pairing notes

### Caching with Query

Use the FMC loader + Query pattern from [router-and-query.md](router-and-query.md). RSC adds one constraint on top of official [Caching → TanStack Query](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#tanstack-query): **`structuralSharing: false`** on any `*QueryOptions` that cache RSC values.

### Selective SSR

Pair RSC loaders with route `ssr` — FMC defaults and map-heavy patterns in [selective-ssr.md](selective-ssr.md#server-components--selective-ssr). Official examples: [Combining with Selective SSR](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#combining-with-selective-ssr).

### Error handling

Route-level loader failures → route `errorComponent` ([client-server-boundaries.md](client-server-boundaries.md#error-handling)). Widget-level isolation (deferred promise + `ErrorBoundary` + `Suspense`) → official [Error Handling → Component Level Errors](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#component-level-errors).
