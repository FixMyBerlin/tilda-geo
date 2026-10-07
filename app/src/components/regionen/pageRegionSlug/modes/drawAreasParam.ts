import { z } from 'zod'

const zodPosition = z.tuple([z.number(), z.number()])

const zodPolygonCoordinates = z.array(z.array(zodPosition).min(4)).min(1)

const zodLineCoordinates = z.array(zodPosition).min(2)

/**
 * Drawn areas as one GeoJSON geometry: a `Polygon`, or a `MultiPolygon` for several areas.
 * Summieren (`sum.areas`) and Messen (`measure.areas`) share the shape, so areas can be taken
 * over from one mode to the other (`modeSwitcherSearch`).
 */
export const zodAreasParam = z.union([
  z.object({ type: z.literal('Polygon'), coordinates: zodPolygonCoordinates }),
  z.object({ type: z.literal('MultiPolygon'), coordinates: z.array(zodPolygonCoordinates).min(1) }),
])

export type AreasParam = z.infer<typeof zodAreasParam>

/** Drawn lines as one GeoJSON geometry: a `LineString`, or a `MultiLineString` for several. */
export const zodLinesParam = z.union([
  z.object({ type: z.literal('LineString'), coordinates: zodLineCoordinates }),
  z.object({ type: z.literal('MultiLineString'), coordinates: z.array(zodLineCoordinates).min(1) }),
])

export type LinesParam = z.infer<typeof zodLinesParam>

export const polygonsOfAreasParam = (areas: AreasParam | undefined) => {
  if (!areas) return []
  return areas.type === 'Polygon' ? [areas.coordinates] : areas.coordinates
}

export const areasParamOfPolygons = (polygons: number[][][][]) => {
  // GeoJSON types positions as `number[]`; drawn positions always are `[lng, lat]`.
  const typed = polygons as z.infer<typeof zodPolygonCoordinates>[]
  const [first] = typed
  if (!first) return undefined
  return (
    typed.length === 1
      ? { type: 'Polygon', coordinates: first }
      : { type: 'MultiPolygon', coordinates: typed }
  ) satisfies AreasParam
}

/** The areas on a coarser grid, e.g. the one of the mode that takes them over. */
export const roundAreasParam = (areas: AreasParam, precision: number) => {
  const factor = 10 ** precision
  const round = (value: number) => Math.round(value * factor) / factor
  return areasParamOfPolygons(
    polygonsOfAreasParam(areas).map((polygon) =>
      polygon.map((ring) => ring.map(([lng, lat]) => [round(lng), round(lat)])),
    ),
  )
}

export const linesOfLinesParam = (lines: LinesParam | undefined) => {
  if (!lines) return []
  return lines.type === 'LineString' ? [lines.coordinates] : lines.coordinates
}

export const linesParamOfLines = (lines: number[][][]) => {
  const typed = lines as z.infer<typeof zodLineCoordinates>[]
  const [first] = typed
  if (!first) return undefined
  return (
    typed.length === 1
      ? { type: 'LineString', coordinates: first }
      : { type: 'MultiLineString', coordinates: typed }
  ) satisfies LinesParam
}
