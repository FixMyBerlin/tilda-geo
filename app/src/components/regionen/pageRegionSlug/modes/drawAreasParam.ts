import { lineString, multiLineString, multiPolygon, polygon } from '@turf/helpers'
import { z } from 'zod'

// `number[]` like GeoJSON's `Position`, so values of Turf and of the drawing package fit as they are.
const zodPosition = z.array(z.number()).length(2)

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

export const areasParamOfPolygons = (polygons: GeoJSON.Position[][][]) => {
  const [first] = polygons
  if (!first) return undefined
  return polygons.length === 1 ? polygon(first).geometry : multiPolygon(polygons).geometry
}

/** The areas on a coarser grid, e.g. the one of the mode that takes them over. */
export const roundAreasParam = (areas: AreasParam, precision: number) => {
  const factor = 10 ** precision
  const round = (value: number) => Math.round(value * factor) / factor
  return areasParamOfPolygons(
    polygonsOfAreasParam(areas).map((rings) =>
      rings.map((ring) => ring.map((position) => position.map(round))),
    ),
  )
}

export const linesOfLinesParam = (lines: LinesParam | undefined) => {
  if (!lines) return []
  return lines.type === 'LineString' ? [lines.coordinates] : lines.coordinates
}

export const linesParamOfLines = (lines: GeoJSON.Position[][]) => {
  const [first] = lines
  if (!first) return undefined
  return lines.length === 1 ? lineString(first).geometry : multiLineString(lines).geometry
}
