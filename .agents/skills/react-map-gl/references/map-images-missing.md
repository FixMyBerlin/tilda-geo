# Missing style images (`styleimagemissing`)

Symbol layers reference icons by id (`icon-image`). When an id is not in the style sprite, MapLibre emits **`styleimagemissing`**. Fix with **proactive** registration, a **reactive** handler, or a **style/sprite** fix.

## Choose a strategy

| Strategy                         | When                                      | FMC example                                                                                          |
| -------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Proactive `addImage`**         | Fixed, known icon ids                     | vzk `useMapImages` → `NO_SIGN_ICON` placeholder — [map-images-proactive.md](map-images-proactive.md) |
| **Reactive `styleimagemissing`** | Dynamic / unbounded ids from feature data | vzk sign supports: `icon-image` = aggregation JSON → generate canvas → `addImage`                    |
| **Style / sprite fix**           | Id should be in the built sprite          | tilda atlas styles                                                                                   |
| **Dev warn only**                | Find missing ids during development       | tilda `RegionMap`                                                                                    |

## Proactive — `useMapImages` (vzk-bw)

Register placeholders **before** the symbol layer renders:

```tsx
useMapImages({
  images: [{ name: 'NO_SIGN_ICON', url: signPlaceholderUrl, width: 20, height: 20 }],
})
```

See [map-images-proactive.md](map-images-proactive.md) for the full hook (SVG `pixelRatio`, `loadImage` for PNG, `useMap()` + `useEffect`).

## Reactive — dynamic icons (vzk-bw sign supports)

Vector tiles expose an **`aggregation`** property; the symbol layer uses it as **`icon-image`**. Each distinct aggregation string is a **new image id** — too many to pre-register. Generate on demand.

`styleimagemissing` has **no** react-map-gl `<Map>` prop — use MapLibre `map.on` in a **`useEffect`** so you can **`off()` on unmount**. See [map-event-handlers.md](map-event-handlers.md).

```tsx
// vzk-bw: SignSupportsLayer.tsx — useEffect for subscribe + unmount cleanup
useEffect(
  function registerDynamicSignImages() {
    if (!mainMap || !mapLoaded) return

    const handleStyleImageMissing = async ({ id }: MapStyleImageMissingEvent) => {
      if (mainMap.hasImage(id)) return

      const aggregation = JSON.parse(id)
      const image = await generateSignSupportImage(aggregation)
      if (image) mainMap.addImage(id, image, {})
    }

    mainMap.on('styleimagemissing', handleStyleImageMissing)
    return () => mainMap.off('styleimagemissing', handleStyleImageMissing)
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

**Async handler:** MapLibre may fire the event again until `addImage` completes — always guard with `hasImage(id)` before adding.

**Do not** call `map.on('styleimagemissing', …)` in the component **render body** (vzk currently does this — duplicates listeners every render).

## Dev-only warning (tilda)

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
// ✅ useEffect — subscribe after mapLoaded, off() on unmount
useEffect(() => {
  if (!mainMap || !mapLoaded) return
  mainMap.on('styleimagemissing', handler)
  return () => mainMap.off('styleimagemissing', handler)
}, [mainMap, mapLoaded, handler])

// ❌ map.on('styleimagemissing') in render body (re-subscribes every render)
// ❌ onLoad without off() on unmount
```

Re-subscribe when `mapStyle` changes if the map instance is reused (`reuseMaps`).

## Checklist

- [ ] Fixed icons → **`useMapImages`** ([map-images-proactive.md](map-images-proactive.md))
- [ ] Dynamic icons → `styleimagemissing` in `useEffect` (subscribe + unmount cleanup) + `hasImage` guard
- [ ] Guard `mainMap` + preferably `useMapLoaded()`
- [ ] SVG icons: explicit size + `pixelRatio` (not `loadImage`)
- [ ] Handle sentinel ids (`'null'`, empty string) in dev handlers
- [ ] Do not register listeners in render — use `useMap()` (map-provider-wrapper.md)
