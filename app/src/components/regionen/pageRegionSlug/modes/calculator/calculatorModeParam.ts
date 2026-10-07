import { z } from 'zod'
import type { DrawArea } from './drawing/drawAreaTypes'

/**
 * Single JSON param for the Summieren mode (`sum`), in the shape of the other modes
 * (`notes`, `qa`, `review`): `key` picks the collection, `filter` narrows it, and the mode's
 * own geometry lives here too, so one param is the whole state of the mode.
 *
 * - `key` is the dataset (`calculatorDatasets.const.ts`), named like the sidebar layer that
 *   shows the same parking. Omitted for the region's first dataset.
 * - `filter` narrows the sum to points with these tag values, e.g. `{ operator_type: 'public' }`.
 *   The keys are the group-by keys of the dataset; `''` stands for a missing value.
 * - `style` colors the points by the values of one tag (a group-by key of the dataset).
 *   Without it all points have the color of the dataset.
 * - `areas` are the drawn areas as one GeoJSON geometry: a `Polygon`, or a `MultiPolygon` for
 *   several areas. That is how Prüfeinträge store their geometry. Unlike `notes.new` /
 *   `review.new` the areas stay in the URL in other modes, so a look at the map does not
 *   lose them.
 */
/**
 * Decimals of the area coordinates: about 1.1 m north-south and 0.7 m east-west in Germany.
 * One less would be 11 m, too coarse for a side of a street. The drawing surface already puts
 * every point on this grid while drawing, so an area never moves when it is read back.
 */
export const CALCULATOR_AREA_PRECISION = 5

const zodPolygonCoordinates = z.array(z.array(z.tuple([z.number(), z.number()])).min(4)).min(1)

// Per-field `.catch` keeps stale bookmarks usable: `optionalSearchJson` drops the whole object
// as soon as one field fails.
export const zodCalculatorModeParam = z.object({
  key: z.string().optional().catch(undefined),
  filter: z.record(z.string(), z.string()).optional().catch(undefined),
  style: z.string().optional().catch(undefined),
  areas: z
    .union([
      z.object({ type: z.literal('Polygon'), coordinates: zodPolygonCoordinates }),
      z.object({
        type: z.literal('MultiPolygon'),
        coordinates: z.array(zodPolygonCoordinates).min(1),
      }),
    ])
    .optional()
    .catch(undefined),
})

export type CalculatorModeParam = z.infer<typeof zodCalculatorModeParam>

export type CalculatorFilter = NonNullable<CalculatorModeParam['filter']>

export const compactCalculatorModeParam = (param: CalculatorModeParam) => {
  const next: CalculatorModeParam = {}
  if (param.key) next.key = param.key
  if (param.filter && Object.keys(param.filter).length > 0) next.filter = param.filter
  if (param.style) next.style = param.style
  if (param.areas) next.areas = param.areas
  return Object.keys(next).length > 0 ? next : undefined
}

/** The drawn areas as one geometry; `undefined` without areas. */
export const calculatorAreasToParam = (areas: DrawArea[]) => {
  const polygons = areas.map(
    (area) => area.geometry.coordinates as z.infer<typeof zodPolygonCoordinates>,
  )
  const [first] = polygons
  if (!first) return undefined
  return (
    polygons.length === 1
      ? { type: 'Polygon', coordinates: first }
      : { type: 'MultiPolygon', coordinates: polygons }
  ) satisfies CalculatorModeParam['areas']
}

/**
 * One area per polygon. The ids follow the position, like `featuresFromGeometry` of the drawing
 * package names the parts of a Prüfeintrag (`useCalculatorDraw` creates matching ids).
 */
export const calculatorAreasFromParam = (areas: CalculatorModeParam['areas']) => {
  if (!areas) return []
  const polygons = areas.type === 'Polygon' ? [areas.coordinates] : areas.coordinates
  return polygons.map(
    (coordinates, index) =>
      ({
        type: 'Feature',
        id: calculatorAreaId(index),
        properties: {},
        geometry: { type: 'Polygon', coordinates },
      }) satisfies DrawArea,
  )
}

export const calculatorAreaId = (index: number) => `part-${index}`

/** The param from its raw URL value (JSON); `{}` when missing or unreadable. For URL migrations. */
export const parseCalculatorModeParam = (raw: string | null) => {
  if (!raw) return {}
  try {
    return zodCalculatorModeParam.safeParse(JSON.parse(raw)).data ?? {}
  } catch {
    return {}
  }
}
