import { lineString, polygon } from '@turf/helpers'
import { z } from 'zod'
import { validBackgroundParams } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/backgroundParam.const'
import {
  isPrivateBackgroundParam,
  type PrivateBackgroundParam,
} from '@/server/private-backgrounds/privateBackgroundParam'
import {
  areasParamOfPolygons,
  linesOfLinesParam,
  linesParamOfLines,
  polygonsOfAreasParam,
  zodAreasParam,
  zodLinesParam,
} from '../drawAreasParam'

/**
 * Single JSON param for the Messen mode (`measure`), in the shape of the other modes: one
 * param is the whole state of the mode. Nothing is stored; a measurement is shared by its link.
 *
 * - `lines` are the measured lines as one GeoJSON geometry (`LineString` / `MultiLineString`).
 * - `areas` are the measured areas (`Polygon` / `MultiPolygon`), in the same shape as
 *   `sum.areas`, so areas can be taken over between Summieren and Messen.
 * - `bg` is a background picked by hand while measuring. Without it the mode shows the best
 *   aerial image for the place (`useBackgroundParam`); the global `bg` is left alone.
 *
 * Like `sum.areas` the shapes stay in the URL in other modes.
 */

/**
 * Decimals of the coordinates: about 11 cm north-south and 7 cm east-west in Germany. That
 * is finer than one pixel of the best aerial images (20 cm), so a corner is stored where it
 * was placed. Summieren uses 5 (about 1 m), which is too coarse for the width of a lane.
 */
export const MEASURE_PRECISION = 6

export const zodMeasureModeParam = z.object({
  lines: zodLinesParam.optional().catch(undefined),
  areas: zodAreasParam.optional().catch(undefined),
  bg: z
    .union([
      z.enum(validBackgroundParams),
      z.custom<PrivateBackgroundParam>(isPrivateBackgroundParam),
    ])
    .optional()
    .catch(undefined),
})

export type MeasureModeParam = z.infer<typeof zodMeasureModeParam>

export const compactMeasureModeParam = (param: MeasureModeParam) => {
  const next: MeasureModeParam = {}
  if (param.lines) next.lines = param.lines
  if (param.areas) next.areas = param.areas
  if (param.bg) next.bg = param.bg
  return Object.keys(next).length > 0 ? next : undefined
}

export type MeasureLine = Omit<GeoJSON.Feature<GeoJSON.LineString>, 'id'> & { id: string }
export type MeasureArea = Omit<GeoJSON.Feature<GeoJSON.Polygon>, 'id'> & { id: string }
export type MeasureShape = MeasureLine | MeasureArea

export const isMeasureArea = (shape: { geometry: GeoJSON.Geometry }): shape is MeasureArea =>
  shape.geometry.type === 'Polygon'
export const isMeasureLine = (shape: { geometry: GeoJSON.Geometry }): shape is MeasureLine =>
  shape.geometry.type === 'LineString'

// The ids follow the position per kind, so a shape read back from the URL keeps its id.
export const measureLineId = (index: number) => `line-${index}`
export const measureAreaId = (index: number) => `area-${index}`

/** Lines first, then areas; each in the order they were drawn. */
export const measureShapesFromParam = (param: Pick<MeasureModeParam, 'lines' | 'areas'>) => [
  ...linesOfLinesParam(param.lines).map(
    (coordinates, index) =>
      ({ ...lineString(coordinates), id: measureLineId(index) }) satisfies MeasureLine,
  ),
  ...polygonsOfAreasParam(param.areas).map(
    (coordinates, index) =>
      ({ ...polygon(coordinates), id: measureAreaId(index) }) satisfies MeasureArea,
  ),
]

export const measureShapesToParam = (shapes: MeasureShape[]) => ({
  lines: linesParamOfLines(shapes.filter(isMeasureLine).map((line) => line.geometry.coordinates)),
  areas: areasParamOfPolygons(
    shapes.filter(isMeasureArea).map((area) => area.geometry.coordinates),
  ),
})
