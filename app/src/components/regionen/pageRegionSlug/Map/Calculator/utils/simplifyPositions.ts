import type { DrawArea } from '../drawing/drawAreaTypes'

// https://github.com/placemark/polyline/blob/main/lib/index.ts#L10-L14
function py2_round(value: number) {
  return Math.floor(Math.abs(value) + 0.5) * (value >= 0 ? 1 : -1)
}

const roundPosition = (position: GeoJSON.Position) => {
  // 5 decimals keeps approx <= 2m precision in Berlin.
  const precision = 5
  const factor = 10 ** precision
  const a = position[0]
  const b = position[1]
  if (typeof a !== 'number' || typeof b !== 'number') return position
  return [py2_round(a * factor) / factor, py2_round(b * factor) / factor] as GeoJSON.Position
}

export const simplifyPositions = (drawAreas: DrawArea[]) => {
  return drawAreas.map((feature) => {
    const ring = feature.geometry.coordinates[0]
    const newCoordinates: GeoJSON.Position[] = ring ? ring.map((c) => roundPosition(c)) : []
    return {
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: [newCoordinates, ...feature.geometry.coordinates.slice(1)],
      },
    } satisfies DrawArea
  })
}
