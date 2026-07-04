# Map debug exposure (`window.__mainMap`)

Expose the underlying MapLibre instance on `window.__mainMap` in **dev** (and Playwright E2E when configured) so agents can inspect runtime map state — layer order, zoom, rendered features — without React DevTools or brittle DOM scraping.

Production builds must **not** expose the map.

Pair with skill **`playwright-skill`** for Playwright flags (`VITE_PLAYWRIGHT_ENABLED`), the shared `exposeMainMapForDebugging` helper, `firePlaywrightMapLoadedEvent`, and test utils (`waitForMapLoad`, `getMapLayerIds`).

## Wire in `onLoad`

Call your debug helper from **`onLoad`** when the map is ready (see [map-loaded-hook.md](map-loaded-hook.md)). In Map handlers, **`event.target` is the MapLibre map** — use it directly, not `useMap()` from the component that renders `<Map>`.

```tsx
import type { MapLibreEvent } from 'maplibre-gl'
import { Map } from 'react-map-gl/maplibre'
import { exposeMainMapForDebugging } from '~/lib/playwright'

const handleLoad = (event: MapLibreEvent) => {
  exposeMainMapForDebugging(event.target)
}

<Map id="mainMap" onLoad={handleLoad} … />
```

The helper and Playwright gating live in skill **`playwright-skill`** ([App hooks](../../playwright-skill/SKILL.md)). For E2E, also call `firePlaywrightMapLoadedEvent()` from the same handler — documented there, not here.

Minimal `Window` typing for agents and tests:

```typescript
declare global {
  interface Window {
    __mainMap?: MaplibreMap // maplibre-gl Map
  }
}
```

Pick any stable global name; `__mainMap` is the FMC convention.

## When `__mainMap` is available

| Mode                  | `window.__mainMap`           |
| --------------------- | ---------------------------- |
| `import.meta.env.DEV` | yes                          |
| Playwright E2E        | yes (see `playwright-skill`) |
| Production            | no                           |

## Inspecting map state

Agents (agent-browser MCP) via `agent_browser_eval`, or Playwright `page.evaluate`:

```js
window.__mainMap?.getZoom()
window.__mainMap?.getStyle().layers.map((layer) => layer.id)
window.__mainMap?.queryRenderedFeatures({ layers: ['my-layer-id'] })
```

In app code after load: `useMap().mainMap.getMap()` for MapLibre APIs (see [map-provider-wrapper.md](map-provider-wrapper.md)).

## Fallbacks when `__mainMap` is unavailable

- Annotated screenshots for visual checks
- `agent_browser_react_tree` around the map component subtree
- Playwright fallbacks: skill **`playwright-skill`**

## Do not

- Expose the map in production builds.
- Pass a react-map-gl `MapRef` to the helper — pass the MapLibre map (`event.target` in `onLoad`).
- Call before `onLoad` — the instance is not fully usable until then (see [map-loaded-hook.md](map-loaded-hook.md)).
- Duplicate Playwright hook setup here — use **`playwright-skill`**.
