# Missing style images (`styleimagemissing`)

Symbol layers reference icons by id (`icon-image`). When an id is not in the style sprite, MapLibre emits **`styleimagemissing`**. Fix with **proactive** registration, a **reactive** resolver, or a **style/sprite** fix.

**MapLibre v6:** `styleimagemissing` is **notify-only** — calling `addImage` inside the event handler no longer resolves the missing request. Supply images with **`Map#setMissingStyleImageResolver`** (sync or async). Keep `styleimagemissing` for observe/warn only. See the [v5→v6 migration guide](https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/#styleimagemissing).

## Choose a strategy

| Strategy                                    | When                                      | FMC example                                                                                          |
| ------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Proactive `addImage`**                    | Fixed, known icon ids                     | vzk `useMapImages` → `NO_SIGN_ICON` placeholder — [map-images-proactive.md](map-images-proactive.md) |
| **Reactive `setMissingStyleImageResolver`** | Dynamic / unbounded ids from feature data | vzk sign supports: `icon-image` = aggregation JSON → generate canvas → `addImage`                    |
| **Style / sprite fix**                      | Id should be in the built sprite          | tilda atlas styles                                                                                   |
| **Dev warn only** (`styleimagemissing`)     | Find missing ids during development       | tilda `RegionMap`                                                                                    |

## Proactive — `useMapImages` (vzk-bw)

Register placeholders **before** the symbol layer renders:

```tsx
useMapImages({
  images: [{ name: 'NO_SIGN_ICON', url: signPlaceholderUrl, width: 20, height: 20 }],
})
```

See [map-images-proactive.md](map-images-proactive.md) for the full hook (SVG `pixelRatio`, `loadImage` for PNG, `useMap()` + `useEffect`).

## Reactive — dynamic icons (MapLibre v6)

Vector tiles expose an **`aggregation`** property; the symbol layer uses it as **`icon-image`**. Each distinct aggregation string is a **new image id** — too many to pre-register. Generate on demand via **`setMissingStyleImageResolver`**.

`setMissingStyleImageResolver` has **no** react-map-gl `<Map>` prop — call it on the MapLibre instance in a **`useEffect`**. Clear with `setMissingStyleImageResolver(null)` (or equivalent) on unmount if you need to remove the resolver. See [map-event-handlers.md](map-event-handlers.md).

```tsx
// MapLibre v6 — supply missing images via resolver (not styleimagemissing + addImage)
useEffect(
  function registerDynamicSignImages() {
    if (!mainMap || !mapLoaded) return
    const map = mainMap.getMap()

    map.setMissingStyleImageResolver(async (id) => {
      if (map.hasImage(id)) return

      const aggregation = JSON.parse(id)
      const image = await generateSignSupportImage(aggregation)
      if (image) map.addImage(id, image, {})
    })

    return () => map.setMissingStyleImageResolver(null)
  },
  [mainMap, mapLoaded],
)
```

```tsx
<Layer
  type="symbol"
  layout={{
    'icon-image': ['get', 'aggregation'],
    'icon-allow-overlap': true,
    'icon-anchor': 'bottom',
  }}
/>
```

**Async resolver:** Call `addImage` before the resolver’s promise settles. Guard with `hasImage(id)` when the same id can be requested concurrently.

**Do not** call `map.on('styleimagemissing', …)` to _resolve_ missing images in MapLibre v6 — that only notifies.

## Dev-only warning (tilda)

`styleimagemissing` remains valid for **observation** (tilda’s pattern):

```tsx
useEffect(
  function subscribeToMissingStyleImages() {
    if (!mainMap || !isDev) return

    const handleStyleImageMissing = (event: MapStyleImageMissingEvent) => {
      const imageId = event.id
      if (imageId === 'null') return // conditional "none" fallback can emit "null"
      console.warn('Missing image', imageId)
    }

    mainMap.on('styleimagemissing', handleStyleImageMissing)
    return () => mainMap.off('styleimagemissing', handleStyleImageMissing)
  },
  [mainMap],
)
```

Fix the style or data — **`console.warn` is enough**; the symbol simply does not draw until the sprite exists.

## Conditional / data-driven icons

When `icon-image` is an expression:

- Missing property → missing id → event fires.
- Use coalesce in the style: `['coalesce', ['get', 'icon'], 'default-marker']`.
- Register `default-marker` with **`useMapImages`** or the sprite sheet.

Skip sentinel ids (`'null'`, empty string) when your style uses conditional fallbacks.

## React lifecycle

```tsx
// ✅ useEffect — set resolver after mapLoaded; clear on unmount
useEffect(() => {
  if (!mainMap || !mapLoaded) return
  const map = mainMap.getMap()
  map.setMissingStyleImageResolver(resolver)
  return () => map.setMissingStyleImageResolver(null)
}, [mainMap, mapLoaded, resolver])

// ✅ styleimagemissing in useEffect for warn/observe only (off on unmount)
// ❌ addImage inside styleimagemissing to resolve the request (broken in MapLibre v6)
// ❌ map.on / setMissingStyleImageResolver in render body
```

Re-subscribe when `mapStyle` changes if the map instance is reused (`reuseMaps`).

## Checklist

- [ ] Fixed icons → **`useMapImages`** ([map-images-proactive.md](map-images-proactive.md))
- [ ] Dynamic icons → **`setMissingStyleImageResolver`** in `useEffect` + `addImage` inside resolver + `hasImage` guard
- [ ] Dev audit → `styleimagemissing` warn only (do not use it to supply images on MapLibre v6+)
- [ ] Guard `mainMap` + preferably `useMapLoaded()`
- [ ] SVG icons: explicit size + `pixelRatio` (not `loadImage`)
- [ ] Handle sentinel ids (`'null'`, empty string) in dev handlers
- [ ] Do not register listeners/resolvers in render — use `useMap()` (map-provider-wrapper.md)
