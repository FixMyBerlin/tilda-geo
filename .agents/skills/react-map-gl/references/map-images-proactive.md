# useMapImages — register known sprites before symbol layers render

Proactively call `addImage` for **fixed** icon ids (placeholders, static SVGs) so symbol layers never hit `styleimagemissing`. Source: [vzk-bw-workspace/frontend/src/hooks/useMapImages.ts](https://github.com/FixMyBerlin/vzk-bw-workspace/blob/main/frontend/src/hooks/useMapImages.ts).

Use **`styleimagemissing`** instead when icon ids are **dynamic or unbounded** (see [map-images-missing.md](map-images-missing.md) — vzk sign supports).

**Why `useEffect` here:** `mainMap` from `useMap()` is often `undefined` on the first render, and `loadImage` / `Image.onload` are **async** — you cannot call `addImage` during render. The effect runs once `mainMap` exists (and again if `images` changes). Unlike `styleimagemissing`, there is usually **no cleanup** — registered images stay on the map until the style is replaced.

## Hook (adapted for react-map-gl)

```tsx
// vzk-bw-workspace: useMapImages.ts — adapted (mainMap from useMap)
import { useMap } from 'react-map-gl/maplibre'
import type { StyleImageMetadata } from 'maplibre-gl'
import { useEffect } from 'react'

type MapImage = {
  name: string
  url: string
  width?: number
  height?: number
  options?: Partial<StyleImageMetadata>
}

export function useMapImages({ images }: { images: MapImage[] }) {
  const { mainMap } = useMap()

  useEffect(
    function registerMapImages() {
      if (!mainMap) return

      for (const { name, url, width, height, options } of images) {
        if (mainMap.hasImage(name)) continue

        const isSvg = url.split('.').pop() === 'svg' || url.startsWith('data:image/svg+xml;')

        if (isSvg) {
          // MapLibre loadImage does not handle SVG — rasterize via Image + pixelRatio
          const pixelRatio = window.devicePixelRatio
          const img = new Image(pixelRatio * (width ?? 20), pixelRatio * (height ?? 20))
          img.onload = () => {
            if (!mainMap.hasImage(name)) {
              mainMap.addImage(name, img, { pixelRatio, ...options })
            }
          }
          img.src = url
        } else {
          void mainMap.loadImage(url).then((image) => {
            if (!mainMap.hasImage(name)) {
              mainMap.addImage(name, image.data, options)
            }
          })
        }
      }
    },
    [images, mainMap],
  )
}
```

## Usage (vzk-bw sign map)

Register a placeholder before the symbol layer references it:

```tsx
import signPlaceholderUrl from '@/assets/icons/sign-placeholder.svg?url'
import { useMapImages } from '@/hooks/useMapImages'

export function SignSupportsLayer() {
  useMapImages({
    images: [{ name: 'NO_SIGN_ICON', url: signPlaceholderUrl, width: 20, height: 20 }],
  })

  return (
    <Source …>
      <Layer
        type="symbol"
        layout={{ 'icon-image': ['get', 'aggregation'], … }}
      />
    </Source>
  )
}
```

## When to use which API

| Case                                                     | Approach                                            |
| -------------------------------------------------------- | --------------------------------------------------- |
| Small fixed set of icons (placeholder, legend markers)   | **`useMapImages`** — register on mount              |
| Icons built at runtime from feature data (unbounded ids) | **`styleimagemissing`** + `addImage` in `useEffect` |
| Icons in style sprite JSON                               | Fix the style build — no runtime handler            |
| Dev-only missing sprite audit                            | `console.warn` in `styleimagemissing` (tilda)       |

Guard with **`mainMap`**; prefer **`useMapLoaded()`** so the style exists before `addImage`.

## SVG note

Raster URLs use `mainMap.loadImage(url)`. SVG assets need an `HTMLImageElement` with explicit `width`/`height` and `pixelRatio` in `addImage` options — otherwise symbols look blurry or fail to register.
