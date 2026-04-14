import booleanWithin from '@turf/boolean-within'
import { bboxPolygon } from '@turf/turf'
import type { LngLatBounds } from 'maplibre-gl'
import type { DrawArea } from '../drawing/drawAreaTypes'

export const isDrawAreaFullyInViewport = (drawArea: DrawArea, mapBounds: LngLatBounds | null) => {
  if (!mapBounds) return true

  const viewportPolygon = bboxPolygon([
    mapBounds.getWest(),
    mapBounds.getSouth(),
    mapBounds.getEast(),
    mapBounds.getNorth(),
  ])

  return booleanWithin(drawArea, viewportPolygon)
}
