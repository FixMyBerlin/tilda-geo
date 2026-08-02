import { useEffect, useRef } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { useBg3dParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBg3dParam'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { hasNonNeutralCamera } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParam'

export const ResetCameraWhen3dDisabled = () => {
  const { mainMap } = useMap()
  const { is3dActive } = useBg3dParam()
  const { mapParam, setMapParam } = useMapParam()
  const was3dActiveRef = useRef(is3dActive)
  const didNormalizeInactiveCameraRef = useRef(false)

  useEffect(
    function normalizeMapParamCameraWhen3dInactiveOnLoad() {
      if (didNormalizeInactiveCameraRef.current || is3dActive) return
      if (!hasNonNeutralCamera(mapParam)) return

      didNormalizeInactiveCameraRef.current = true

      const map = mainMap?.getMap()
      if (map) {
        map.jumpTo({ bearing: 0, pitch: 0 })
      }

      void setMapParam(
        { zoom: mapParam.zoom, lat: mapParam.lat, lng: mapParam.lng },
        { history: 'replace' },
      )
    },
    [is3dActive, mainMap, mapParam, setMapParam],
  )

  useEffect(
    function resetCameraAndMapParamWhen3dDisabled() {
      const was3dActive = was3dActiveRef.current
      was3dActiveRef.current = is3dActive

      if (!was3dActive || is3dActive) return

      const map = mainMap?.getMap()
      if (map) {
        map.easeTo({ bearing: 0, pitch: 0, duration: 300 })
      }

      if (hasNonNeutralCamera(mapParam)) {
        void setMapParam(
          { zoom: mapParam.zoom, lat: mapParam.lat, lng: mapParam.lng },
          { history: 'replace' },
        )
      }
    },
    [is3dActive, mainMap, mapParam, setMapParam],
  )

  return null
}
