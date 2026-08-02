import { useEffect, useState } from 'react'
import { Layer } from 'react-map-gl/maplibre'
import { useBg3dParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBg3dParam'

/**
 * Extruded buildings for `is3dActive`.
 *
 * Goals:
 * 1. Smooth fade (MapLibre `fill-extrusion-opacity-transition`).
 * 2. No permanent buildings layer sitting at opacity 0 when 3D is off.
 *
 * Mount only around the fade — opacity 0 → opaque on enable (after a short
 * delay so the layer exists before the paint transition runs); opaque → 0 on
 * disable, then unmount once the transition finishes.
 */
const MAP3D_BUILDINGS_LAYER_ID = 'tilda-3d-buildings'

export const SourcesLayersMap3dBuildings = () => {
  const { is3dActive } = useBg3dParam()
  const [renderLayer, setRenderLayer] = useState(is3dActive)
  const [buildingsOpaque, setBuildingsOpaque] = useState(false)

  useEffect(
    function fadeBuildingsWith3dToggle() {
      if (is3dActive) {
        const mountId = window.setTimeout(() => setRenderLayer(true), 0)
        const revealId = window.setTimeout(() => setBuildingsOpaque(true), 50)
        return function cancelBuildingsFadeIn() {
          window.clearTimeout(mountId)
          window.clearTimeout(revealId)
        }
      }

      const fadeId = window.setTimeout(() => setBuildingsOpaque(false), 0)
      const hideId = window.setTimeout(() => setRenderLayer(false), 450)
      return function cancelBuildingsFadeOut() {
        window.clearTimeout(fadeId)
        window.clearTimeout(hideId)
      }
    },
    [is3dActive],
  )

  if (!renderLayer) return null

  return (
    <Layer
      id={MAP3D_BUILDINGS_LAYER_ID}
      type="fill-extrusion"
      source="openmaptiles"
      source-layer="building"
      minzoom={15}
      beforeId="atlas-app-beforeid-below-roadname"
      paint={{
        'fill-extrusion-color': '#d4d4d8',
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 0],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': buildingsOpaque ? 0.75 : 0,
        'fill-extrusion-opacity-transition': {
          duration: 450,
          delay: 0,
        },
      }}
    />
  )
}
