import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { useBg3dParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBg3dParam'

export const Map3dTouchRotation = () => {
  const { mainMap } = useMap()
  const { is3dActive } = useBg3dParam()

  useEffect(
    function syncTouchRotationWith3dMode() {
      const map = mainMap?.getMap()
      if (!map) return

      if (is3dActive) {
        map.touchZoomRotate.enableRotation()
      } else {
        map.touchZoomRotate.disableRotation()
      }
    },
    [is3dActive, mainMap],
  )

  return null
}
