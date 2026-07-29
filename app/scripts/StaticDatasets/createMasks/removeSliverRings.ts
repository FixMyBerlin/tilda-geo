import { styleText } from 'node:util'
import { area, polygon } from '@turf/turf'

/**
 * Unioning many adjacent boundary relations leaves tiny artifact rings along the shared borders
 * (mostly triangles of a few square meters). Turfs `simplify` — used by the mask transform —
 * throws on them ("invalid polygon, fewer than 4 points"), so we drop them right after download.
 * Real enclaves are magnitudes larger and survive the threshold.
 */
const MIN_RING_AREA_SQM = 10_000

const ringAreaSqm = (ring: GeoJSON.Position[]) => {
  const distinctPoints = new Set(ring.map((position) => position.join(','))).size
  // A ring needs 3 distinct points to have any area; those are artifacts by definition
  if (distinctPoints < 4) return 0
  return area(polygon([ring]))
}

const cleanPolygon = (rings: GeoJSON.Position[][]) => {
  const [outerRing, ...innerRings] = rings
  if (!outerRing || ringAreaSqm(outerRing) < MIN_RING_AREA_SQM) return undefined
  return [outerRing, ...innerRings.filter((ring) => ringAreaSqm(ring) >= MIN_RING_AREA_SQM)]
}

export function removeSliverRings<T extends GeoJSON.Polygon | GeoJSON.MultiPolygon>(geometry: T) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  const cleanedPolygons = polygons.map(cleanPolygon).filter((rings) => rings !== undefined)

  if (!cleanedPolygons.length) {
    throw new Error('All parts of the boundary geometry were smaller than the sliver threshold')
  }

  const ringsBefore = polygons.flat().length
  const ringsAfter = cleanedPolygons.flat().length
  if (ringsBefore !== ringsAfter) {
    console.info(
      styleText('blue', `✓ Removed ${ringsBefore - ringsAfter} sliver rings from the boundary`),
    )
  }

  return (
    geometry.type === 'Polygon'
      ? { type: 'Polygon', coordinates: cleanedPolygons[0] }
      : { type: 'MultiPolygon', coordinates: cleanedPolygons }
  ) as T
}
