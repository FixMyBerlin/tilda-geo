import { adapterById, sequenceTilesSourceId } from '@osm-editor-kit/street-imagery'
import {
  useAllProviderPhotos,
  useMapViewportBbox,
  useProviderSequences,
} from '@osm-editor-kit/street-imagery-react'
import { useEffect, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import type { StreetImageryProviderId } from './streetImageryParam'

/** Capture times of the track lines MapLibre has loaded from a provider's own line tiles. */
const useLineTileCapturedAt = (providers: StreetImageryProviderId[], enabled: boolean) => {
  const { mainMap } = useMap()
  const [capturedAt, setCapturedAt] = useState<number[]>([])
  const providersKey = providers.join(',')

  useEffect(
    function readLineTilesWhenMapIsIdle() {
      if (!mainMap || !enabled) return
      const read = () => {
        // A line is cut at tile borders: count each sequence once.
        const bySequence = new Map<unknown, number>()
        for (const providerId of providersKey.split(',')) {
          const tiles = adapterById[providerId as StreetImageryProviderId]?.sequenceTiles?.()
          const sourceId = sequenceTilesSourceId(providerId as StreetImageryProviderId)
          if (!tiles || !mainMap.getSource(sourceId)) continue
          for (const feature of mainMap.querySourceFeatures(sourceId, {
            sourceLayer: tiles.sourceLayer,
          })) {
            const time = feature.properties[tiles.properties.capturedAt]
            if (typeof time === 'number') {
              bySequence.set(feature.properties[tiles.properties.sequenceId], time)
            }
          }
        }
        setCapturedAt([...bySequence.values()])
      }
      mainMap.on('idle', read)
      // The map may be idle already: a repaint makes it report idle once more.
      mainMap.triggerRepaint()
      return function stopReadingLineTiles() {
        mainMap.off('idle', read)
      }
    },
    [mainMap, enabled, providersKey],
  )

  return enabled ? capturedAt : []
}

/**
 * Capture times for the marks of the date slider: of the photos in view, or, zoomed out where no
 * photos are loaded, of the track lines. Only data the map has loaded anyway; no extra requests.
 */
export const useStreetImageryCapturedAt = (providers: StreetImageryProviderId[]) => {
  const { mapParam } = useMapParam()
  const bbox = useMapViewportBbox('mainMap')
  // All photos in view, before the date filter: the slider marks where photos exist.
  const { photos } = useAllProviderPhotos(providers, bbox, mapParam.zoom)
  const noPhotos = photos.length === 0
  const lineTileTimes = useLineTileCapturedAt(providers, noPhotos)
  // Panoramax has no line tiles; its lines are loaded as data from zoom 10 (same query as the map).
  const { data: panoramaxLines = [] } = useProviderSequences(
    'panoramax',
    noPhotos && providers.includes('panoramax') ? bbox : null,
    mapParam.zoom,
  )

  if (!noPhotos) {
    return { capturedAt: photos.map((photo) => photo.capturedAt), counts: 'photos' as const }
  }
  return {
    capturedAt: [...lineTileTimes, ...panoramaxLines.map((line) => line.capturedAt)],
    counts: 'lines' as const,
  }
}
