import type { TerrainProfileLine, TerrainProfileOrientation } from '../types'

type AxisProjection = {
  start: number
  end: number
  mid: number
}

const metersPerDegree = (lat: number) => ({
  east: 111_320 * Math.cos((lat * Math.PI) / 180),
  north: 110_540,
})

const collectBounds = (lines: TerrainProfileLine[]) => {
  let minLng = Number.POSITIVE_INFINITY
  let maxLng = Number.NEGATIVE_INFINITY
  let minLat = Number.POSITIVE_INFINITY
  let maxLat = Number.NEGATIVE_INFINITY

  for (const line of lines) {
    for (const coordinate of line.coordinates) {
      const lng = coordinate[0]
      const lat = coordinate[1]
      if (lng === undefined || lat === undefined) continue
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    }
  }

  return { minLng, maxLng, minLat, maxLat, midLat: (minLat + maxLat) / 2 }
}

const lineTravelMeters = (line: TerrainProfileLine, referenceLat: number) => {
  const first = line.coordinates[0]
  const last = line.coordinates[line.coordinates.length - 1]
  if (!first || !last || first[0] === undefined || first[1] === undefined) {
    return { eastMeters: 0, northMeters: 0 }
  }
  if (last[0] === undefined || last[1] === undefined) {
    return { eastMeters: 0, northMeters: 0 }
  }

  const { east, north } = metersPerDegree(referenceLat)
  return {
    eastMeters: (last[0] - first[0]) * east,
    northMeters: (last[1] - first[1]) * north,
  }
}

/**
 * Chart axis follows how the ways run, not the bbox.
 * Parallel left/right cycleways stay on the along-street axis so they overlap on X.
 */
export const resolveTerrainProfileOrientation = (
  lines: TerrainProfileLine[],
): TerrainProfileOrientation => {
  const referenceLat = collectBounds(lines).midLat
  let eastTravel = 0
  let northTravel = 0

  for (const line of lines) {
    const travel = lineTravelMeters(line, referenceLat)
    eastTravel += Math.abs(travel.eastMeters)
    northTravel += Math.abs(travel.northMeters)
  }

  if (eastTravel === 0 && northTravel === 0) {
    const bounds = collectBounds(lines)
    const { east, north } = metersPerDegree(bounds.midLat)
    const widthMeters = (bounds.maxLng - bounds.minLng) * east
    const heightMeters = (bounds.maxLat - bounds.minLat) * north
    return Math.abs(widthMeters) >= Math.abs(heightMeters) ? 'west-east' : 'south-north'
  }

  return eastTravel >= northTravel ? 'west-east' : 'south-north'
}

/** Meters along the chart axis from an arbitrary origin (west or south = lower). */
export const pointAxisMeters = (
  lng: number,
  lat: number,
  orientation: TerrainProfileOrientation,
  referenceLat: number,
) => {
  const { east, north } = metersPerDegree(referenceLat)
  return orientation === 'west-east' ? lng * east : lat * north
}

export const lineAxisProjection = (
  line: TerrainProfileLine,
  orientation: TerrainProfileOrientation,
) => {
  const first = line.coordinates[0]
  const last = line.coordinates[line.coordinates.length - 1]
  if (!first || !last || first[0] === undefined || first[1] === undefined) {
    return { start: 0, end: 0, mid: 0 } satisfies AxisProjection
  }
  if (last[0] === undefined || last[1] === undefined) {
    return { start: 0, end: 0, mid: 0 } satisfies AxisProjection
  }

  const start = orientation === 'west-east' ? first[0] : first[1]
  const end = orientation === 'west-east' ? last[0] : last[1]
  return { start, end, mid: (start + end) / 2 } satisfies AxisProjection
}

/**
 * Chart left→right is always west→east or south→north.
 * Reverse OSM digitisation that runs against that graph direction.
 */
export const shouldReverseLineForChartAxis = (
  line: TerrainProfileLine,
  orientation: TerrainProfileOrientation,
) => {
  const projection = lineAxisProjection(line, orientation)
  return projection.start > projection.end
}

export const resolveAxisReferenceLat = (lines: TerrainProfileLine[]) => collectBounds(lines).midLat

export const chartAxisDirectionLabel = (orientation: TerrainProfileOrientation) =>
  orientation === 'west-east' ? 'West → Ost' : 'Süd → Nord'
