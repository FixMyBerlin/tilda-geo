---
name: rust-wasm-geo
description: >-
  Rust/WASM geo for FixMyBerlin FMC geo-heavy React apps: when to leave Turf for
  WASM, crate selection (geo, rstar, fast_paths, osm-reader, i_overlay, …),
  wasm-bindgen boundaries, and Vite integration for SPAs and TanStack Start.
  Use when adding WASM geo crates, profiling slow Turf, OSM/routing/isochrones,
  spatial indexes, or wiring wasm-pack into Vite.
disable-model-invocation: true
---

# Rust / WASM geo

Default stack context: [LLM Technology Stack gist](https://gist.github.com/tordans/97b2a927494fa0be14751d4cbdb561cf). This skill covers **Rust/WASM geo only**.

## When to apply

- Turf or JS geometry is too slow (profile first — main-thread blocking > ~100ms)
- OSM parsing, map model build, isochrones, spatial indexes, graph routing
- Thousands of features, repeated geometry ops, or polygon booleans at scale
- Adding or reviewing a `wasm-pack` crate, `wasm.ts` boundary, or Vite WASM plugins

**Stay on Turf (JS)** for single-feature ops on small GeoJSON and interactive editing feedback during prototyping.

## Turf vs Rust/WASM

| Stay on Turf (JS)                   | Add Rust/WASM                                             |
| ----------------------------------- | --------------------------------------------------------- |
| Single-feature ops on small GeoJSON | Thousands of features, repeated ops, or graph routing     |
| Interactive editing feedback        | OSM parsing, map model build, isochrones, spatial indexes |
| Prototyping                         | Main-thread blocking > ~100ms (profile first)             |

**Batch geometry on large arrays** (not routing/OSM): [geoarrow-wasm](https://github.com/geoarrow/geoarrow-js) instead of rolling your own.

## Crate selection (quick)

| Need                  | Crate                                                                     |
| --------------------- | ------------------------------------------------------------------------- |
| Geometry / GeoJSON    | `geo`, `geojson`                                                          |
| Spatial index         | `rstar`                                                                   |
| Road routing          | `fast_paths`                                                              |
| Graph algorithms      | `petgraph`                                                                |
| OSM → graph           | [osm-reader](https://github.com/a-b-street/osm-reader) (a-b-street fork)  |
| Snap traces to roads  | `route-snapper-graph`                                                     |
| Polygon booleans      | `i_overlay` (see [a-b-street/utils](https://github.com/a-b-street/utils)) |
| Contours / isolines   | `contour`                                                                 |
| Serialized map models | `bincode` + `serde`                                                       |
| Vector file I/O       | `flatgeobuf`, `geozero`                                                   |

Per-crate usage notes and WASM dependency versions: [crates-and-packages.md](references/crates-and-packages.md).

## Project structure

One crate per app, named for what it computes (`geo-isochrone`, `route-buffer`, …).

```
app/
├── wasm/
│   └── geo-isochrone/          # Rust crate (wasm-pack output → pkg/)
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs          # #[wasm_bindgen] surface only
│           └── isochrone.rs    # pure geo logic
└── src/
    └── features/isochrone/
        ├── wasm.ts             # sole JS import of pkg — React never imports pkg directly
        └── useIsochrone.ts     # React hook / Query wrapper
```

- `lib.rs` = `#[wasm_bindgen]` exports; inner modules = pure geo logic (testable without WASM).
- **JS boundary:** wrap exports in `wasm.ts`. Pass **GeoJSON strings** or **bincode `Uint8Array`** — not hand-built JS objects.
- **State split:** durable compute state in Rust; UI state in React (Zustand / URL / local `useState`).

## WASM stack (Cargo)

| Crate                                | Role                                  |
| ------------------------------------ | ------------------------------------- |
| `wasm-bindgen`                       | JS ↔ Rust boundary                    |
| `serde-wasm-bindgen`                 | Serialize/deserialize across boundary |
| `wasm-bindgen-futures`               | Async exports                         |
| `console_error_panic_hook`           | Readable panics in devtools           |
| `getrandom` with `features = ["js"]` | RNG in browser                        |
| `web-time`                           | Time in WASM                          |

**Build:** `wasm-pack` (`--target web`), `vite-plugin-wasm`, target `wasm32-unknown-unknown`.

Reference setups: [a-b-street/ltn](https://github.com/a-b-street/ltn), [a-b-street/15m](https://github.com/a-b-street/15m), [a-b-street/utils](https://github.com/a-b-street/utils).

**Docs when stuck:** [wasm-bindgen book](https://rustwasm.github.io/docs/wasm-bindgen/), [geo on docs.rs](https://docs.rs/geo).

## App integration

| App type            | Guide                                                                     |
| ------------------- | ------------------------------------------------------------------------- |
| Vite SPA (no Start) | [vite-spa-integration.md](references/vite-spa-integration.md)             |
| TanStack Start      | [tanstack-start-integration.md](references/tanstack-start-integration.md) |

Both: dynamic-import WASM from `wasm.ts` only; never top-level `import` of `.wasm` in shared modules that may load on the server.

## Non-negotiable rules

| Topic          | Rule                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------- |
| React imports  | Components/hooks import `wasm.ts` only — never `pkg/` or raw `.wasm`                      |
| Boundary types | GeoJSON as `string` or bincode `Uint8Array`; validate with Zod on the JS side after parse |
| Coordinates    | WGS84, `[lng, lat]` at all API boundaries                                                 |
| Server modules | No WASM init in `*.server.ts`, server loaders, or `createServerFn` handlers               |
| SSR            | WASM runs client-only; lazy-init after hydration (see Start guide for route `ssr`)        |
| Turf fallback  | Keep Turf for small/interactive paths until profiling proves WASM is needed               |

## Related skills

| Topic                            | Skill                                       |
| -------------------------------- | ------------------------------------------- |
| Map React API, layers, events    | React Map GL docs (load when touching maps) |
| Route SSR, loaders, boundaries   | `tanstack-start-conventions`                |
| Folder layout                    | `tanstack-start-app-structure`              |
| Client UI state around map tools | `zustand-state-management`                  |
| useEffect / map listeners        | `react-useeffect`                           |
