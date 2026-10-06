import { nearestPointOnLine } from '@turf/turf'
import { pointFromGeometry } from './pointFromGeometry'

type Position = [number, number]

/**
 * The place on the feature the user looked at: the clicked point, moved onto the line for lines.
 * Without a click (feature from the URL), and for points, the position `pointFromGeometry` gives.
 */
export const pointNearClick = (geometry: GeoJSON.Geometry, click: Position | null): Position => {
  if (!click || geometry.type === 'Point' || geometry.type === 'MultiPoint') {
    return pointFromGeometry(geometry)
  }

  if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
    // turf types a position as `number[]`; a point on a line always has lng and lat.
    return nearestPointOnLine(geometry, click).geometry.coordinates as Position
  }

  return click
}
