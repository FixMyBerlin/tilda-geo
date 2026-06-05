# Rust / WASM geo — crates and packages

When to pick each crate and how it fits the JS boundary.

---

## Decision flow

1. **Small GeoJSON, one-off ops** → `@turf/*` per-function imports (not `import * as turf`).
2. **Large feature arrays, batch geometry** → [geoarrow-wasm](https://github.com/geoarrow/geoarrow-js) before a custom crate.
3. **Routing / OSM / spatial index / heavy booleans** → dedicated Rust crate (table below).
4. **Profile first** — add WASM when main-thread work exceeds ~100ms on target hardware.

---

## Recommended crates

### Geometry / GeoJSON — `geo`, `geojson`

- **Use for:** primitives, buffers, haversine, polygon ops, GeoJSON (de)serialization inside Rust.
- **JS boundary:** export results as GeoJSON **strings** (`serde_json` + `geojson` crate) or bincode bytes for large payloads.
- **Avoid:** building `JsValue` object graphs by hand in Rust — stringify once, `JSON.parse` once in `wasm.ts`.

```rust
// lib.rs — thin surface
#[wasm_bindgen]
pub fn buffer_polygon(geojson: &str, distance_m: f64) -> Result<String, JsValue> {
    let geom: geojson::GeoJson = geojson.parse().map_err(|e| JsValue::from_str(&e.to_string()))?;
    // ... geo crate logic ...
    Ok(result_geojson_string)
}
```

### Spatial index — `rstar`

- **Use for:** nearest-neighbor, bbox queries, snapping candidates on thousands of points/lines.
- **Pattern:** build index once in Rust (from GeoJSON string or bincode model), query from WASM exports; keep index in a Rust `struct` behind `#[wasm_bindgen]` if queries repeat.

### Road routing — `fast_paths`

- **Use for:** shortest path on pre-built road graphs (not live OSM fetch).
- **Pair with:** `petgraph` for graph structure, `osm-reader` or `route-snapper-graph` to build the graph offline or at init.

### Graph algorithms — `petgraph`

- **Use for:** generic graph traversals, components, custom weight logic when `fast_paths` assumptions do not fit.

### OSM → graph — `osm-reader`

- **Use for:** parsing OSM PBF/extracts into routable graph data in Rust.
- **Reference:** [a-b-street/osm-reader](https://github.com/a-b-street/osm-reader) fork used in FMC-style apps.
- **JS boundary:** ship preprocessed graph as bincode `Uint8Array` from build step or first load — not raw OSM XML to the browser.

### Snap traces to roads — `route-snapper-graph`

- **Use for:** GPS/traces → road network alignment.
- **Load graph** from serialized Rust model (bincode), not rebuilt from JS objects.

### Polygon booleans — `i_overlay`

- **Use for:** union/intersection/difference at scale where Turf slows down.
- **Reference impl:** [a-b-street/utils](https://github.com/a-b-street/utils).

### Contours / isolines — `contour`

- **Use for:** elevation or cost surfaces → isolines/isochrone polygons.

### Serialized map models — `bincode` + `serde`

- **Use for:** durable map/routing models passed JS ↔ Rust without JSON parse cost.
- **JS:** `new Uint8Array(buffer)` into WASM; Rust returns `Vec<u8>` as `Uint8Array`.

### Vector file I/O — `flatgeobuf`, `geozero`

- **Use for:** reading/writing FlatGeobuf or other vector formats during **build** or **init** in WASM — rarely in hot interaction loops.

---

## Batch geometry (no custom crate) — geoarrow-wasm

- **Use when:** large arrays of coordinates need batch transforms, not routing/OSM.
- **Prefer over:** hand-rolled WASM for columnar geometry.

---

## WASM dependency template (`Cargo.toml`)

```toml
[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
serde = { version = "1", features = ["derive"] }
serde-wasm-bindgen = "0.6"
geo = "0.29"
geojson = "0.24"
# domain crates: rstar, fast_paths, petgraph, …

[dependencies.getrandom]
version = "0.2"
features = ["js"]
```

Dev/build: `wasm-pack`, `console_error_panic_hook`, `web-time` as needed.

---

## `wasm.ts` boundary pattern

```typescript
import init, { buffer_polygon } from '../../../wasm/geo-isochrone/pkg/geo_isochrone'
import { z } from 'zod'

let ready: Promise<void> | null = null

export function ensureWasm() {
  if (!ready) ready = init()
  return ready
}

const geoJsonSchema = z.object({ type: z.literal('FeatureCollection'), features: z.array(z.unknown()) })

export async function bufferPolygon(geojson: GeoJSON.FeatureCollection, distanceM: number) {
  await ensureWasm()
  const out = buffer_polygon(JSON.stringify(geojson), distanceM)
  return geoJsonSchema.parse(JSON.parse(out)) as GeoJSON.FeatureCollection
}
```

- Single init promise — concurrent callers share one `init()`.
- Zod-validate every string coming back from Rust before it hits React state or the map.
