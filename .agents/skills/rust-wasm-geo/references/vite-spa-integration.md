# Rust / WASM geo — Vite SPA integration

Plain Vite + React SPA (no TanStack Start). Same Bun/Vite 8+ stack as the [tech-stack](https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/tech-stack) skill.

---

## Vite config

```typescript
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  optimizeDeps: {
    exclude: ['geo-isochrone'], // wasm-pack pkg name — adjust per crate
  },
})
```

Install: `vite-plugin-wasm`, `vite-plugin-top-level-await` (WASM modules often need top-level await).

---

## Build the Rust crate

From repo root (adjust paths):

```bash
cd wasm/geo-isochrone
wasm-pack build --target web --out-dir ../../src/features/isochrone/pkg
```

Add to app scripts:

```json
{
  "scripts": {
    "wasm:build": "wasm-pack build --target web --out-dir src/features/isochrone/pkg",
    "dev": "bun run wasm:build && vite",
    "build": "bun run wasm:build && vite build"
  }
}
```

Commit `pkg/` or regenerate in CI before `vite build` — pick one policy per repo and document it.

---

## Folder layout (SPA)

```
src/
├── features/isochrone/
│   ├── wasm.ts              # only file that imports pkg/
│   ├── useIsochrone.ts      # hook: ensureWasm + compute
│   └── IsochronePanel.tsx   # imports wasm.ts / hook only
└── components/map/
    └── MapView.tsx          # React Map GL — no WASM imports
```

---

## Loading strategy

**Do:** lazy-init WASM when the feature mounts or when user triggers a heavy action.

```typescript
// useIsochrone.ts
import { useMutation } from '@tanstack/react-query'
import { bufferPolygon } from './wasm'

export function useBufferPolygon() {
  return useMutation({
    mutationFn: ({ fc, meters }: { fc: GeoJSON.FeatureCollection; meters: number }) => bufferPolygon(fc, meters),
  })
}
```

**Do not:** top-level `await init()` in modules imported by the app entry — blocks first paint.

**Do not:** import `pkg/` from map components, utils barrels, or shared `lib/` — only from `wasm.ts`.

---

## Worker alternative (optional)

If WASM still blocks the main thread after optimization:

- Run the same `wasm.ts` API from a dedicated Worker (`new Worker(new URL('./geo.worker.ts', import.meta.url))`).
- Keep GeoJSON/bincode as the Worker message payload — same types as direct WASM calls.

Default: main-thread WASM is fine until profiling says otherwise.

---

## Dev troubleshooting

| Symptom                                       | Fix                                                    |
| --------------------------------------------- | ------------------------------------------------------ |
| `Failed to fetch dynamically imported module` | Re-run `wasm-pack build`; check `optimizeDeps.exclude` |
| `WebAssembly.instantiate` error               | Match `--target web`; ensure plugins run before build  |
| Stale pkg after Rust change                   | Rebuild wasm before Vite HMR picks up JS-only changes  |

Docs: [wasm-bindgen book](https://rustwasm.github.io/docs/wasm-bindgen/), [Vite llms.txt](https://vite.dev/llms.txt).
