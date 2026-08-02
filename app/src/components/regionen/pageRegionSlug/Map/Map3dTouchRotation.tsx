import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { useMapLoaded } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useBg3dParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBg3dParam'

/**
 * Sync rotate/pitch interactions with shared 3D mode (`is3dActive`).
 *
 * Why imperative: react-map-gl Map props can toggle whole handlers
 * (`dragRotate`, `touchPitch`, `touchZoomRotate`, `keyboard`), but not
 * rotation-only on the combined ones. `touchZoomRotate={false}` also kills
 * pinch-zoom; `keyboard={false}` kills all keyboard pan/zoom. MapLibre
 * exposes `disableRotation()` / `enableRotation()` for those cases, but
 * react-map-gl has no matching props yet —
 * https://github.com/visgl/react-map-gl/issues/2284
 *
 * We keep every rotate/pitch toggle here (including ones that *are* Map
 * props) so 2D↔3D interaction stays in one place.
 */
export const Map3dTouchRotation = () => {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const { is3dActive } = useBg3dParam()

  useEffect(
    function syncCameraInteractionWith3dMode() {
      const map = mainMap?.getMap()
      if (!map || !mapLoaded) return

      if (is3dActive) {
        map.dragRotate.enable()
        map.touchPitch.enable()
        map.touchZoomRotate.enableRotation()
        map.keyboard.enableRotation()
      } else {
        map.dragRotate.disable()
        map.touchPitch.disable()
        map.touchZoomRotate.disableRotation()
        map.keyboard.disableRotation()
      }
    },
    [is3dActive, mainMap, mapLoaded],
  )

  return null
}
