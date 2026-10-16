import type { ExpressionSpecification } from 'maplibre-gl'
import { interactivityConfiguration } from '../../../mapDataSources/generalization/interacitvityConfiguartion'
import type { StyleLayer } from './types'

/**
 * Visual sideways offset for bikelane lines.
 *
 * Background: bikelane geometries are derived from the road centerline. Historically the
 * processing shifted them sideways in the database (PostGIS `ST_OffsetCurve`, see the
 * removed `2_move_bikelanes.sql`) so the two sides of a street rendered as separate lines.
 * That made the stored geometry harder to analyse. We now keep the geometry on the
 * centerline and reproduce the sideways shift purely visually, here.
 *
 * Two zoom regimes, split at {@link interactivityConfiguration.bikelanes.minzoom} (the
 * interactivity cutoff). Below that zoom, tiles only carry `stylingKeys` — not `offset` —
 * plus the always-present `id` column (`way/…/left`, `way/…/right`, or `way/…` for
 * center-running `self`). Above it, full tags including `offset` are present.
 *
 * - **Below minzoom:** nudge each side by half the layer's stroke width so the two sides
 *   sit flush against the centerline (no overlap, no road-width gap). Side comes from `id`.
 *   A meter-based gap would be sub-pixel at these zooms anyway.
 * - **At/above minzoom:** convert the absolute `offset` attribute (meters; the sign is
 *   `+` left / `-` right of the OSM way, computed in processing as half the road width)
 *   to screen pixels so the two sides sit at the road edge.
 *
 * Meter → pixel conversion: MapLibre `line-offset` is in screen pixels, while `offset` is
 * in ground meters. Web Mercator ground resolution halves every zoom level, so
 * pixels-per-meter scales as `2^zoom`. MapLibre reproduces that exactly with an
 * `['exponential', 2]` interpolation between two zoom stops (base-2 interpolation IS the
 * `2^zoom` curve, so the value is exact between the stops and clamped outside them).
 *
 * Caveats:
 * - The meter→pixel factor depends on latitude (`cos φ`). We bake in a reference latitude
 *   (~52.5°, center of Germany). Away from it the on-screen offset is off by roughly ±9%
 *   across Germany — sub-pixel where the offset is small, acceptable when zoomed in.
 * - Symbol layers have no `line-offset`. Labels and icons placed along the line
 *   (`symbol-placement: 'line'` / `'line-center'`) get the same shift through `text-offset`,
 *   see {@link bikelaneVisualTextOffset}. Icons go into `text-field` as `['image', …]`
 *   sections for this: `icon-offset` would land on the wrong side whenever MapLibre turns
 *   the symbol upright, `text-offset` stays on the right side of the line.
 * - `['zoom']` may only be the input of a top-level `interpolate`/`step`, so the compact
 *   low-zoom nudge cannot nest the layer's own zoom-driven `line-width`. We take half of
 *   the clamped low-zoom width (first interpolate/step output) instead.
 */

const EARTH_CIRCUMFERENCE_M = 40075016.686
/** MapLibre renders with 512px tiles. */
const TILE_SIZE_PX = 512
/** Center of Germany. The meter→pixel factor is exact at this latitude. */
const REFERENCE_LATITUDE_DEG = 52.5

/** Web Mercator ground resolution (meters per screen pixel) at zoom 0 and the reference latitude. */
const metersPerPixelAtZoom0 =
  (EARTH_CIRCUMFERENCE_M / TILE_SIZE_PX) * Math.cos((REFERENCE_LATITUDE_DEG * Math.PI) / 180)

/**
 * Pixels-per-meter at a given zoom. Positive: MapLibre `line-offset` is positive to the
 * RIGHT of the feature direction. Left-side geometries are reversed in processing, so
 * both sides are drawn to the right of their own line (right-hand-traffic flow). The
 * `offset` attribute stays signed relative to the OSM way (`+` left / `-` right); only
 * its magnitude is used here.
 */
export const pixelsPerMeterAtZoom = (zoom: number) => 2 ** zoom / metersPerPixelAtZoom0

const MIN_ZOOM_STOP = 0
const MAX_ZOOM_STOP = 24
const INTERACTIVE_MINZOOM = interactivityConfiguration.bikelanes.minzoom

/** `|offset|` in meters; missing (e.g. center-running `cycleway=self`) → `0`. */
const offsetMetersAbs = [
  'abs',
  ['coalesce', ['get', 'offset'], 0],
] satisfies ExpressionSpecification

/** Always in the MVT (`SELECT id`); derived lanes contain `/left` or `/right`. */
const featureId = ['to-string', ['coalesce', ['get', 'id'], '']] satisfies ExpressionSpecification

const isDerivedSide = [
  'any',
  ['in', '/left', featureId],
  ['in', '/right', featureId],
] satisfies ExpressionSpecification

const compactLineOffset = (halfWidthPx: number) =>
  ['case', isDerivedSide, halfWidthPx, 0] satisfies ExpressionSpecification

const meterLineOffsetAtZoom = (zoom: number) =>
  ['*', offsetMetersAbs, pixelsPerMeterAtZoom(zoom)] satisfies ExpressionSpecification

/** Clamped stroke width at zooms below the layer's first interpolate/step stop. */
export const lowZoomLineWidthPx = (lineWidth: unknown) => {
  if (typeof lineWidth === 'number') return lineWidth
  if (Array.isArray(lineWidth)) {
    if (lineWidth[0] === 'interpolate' && typeof lineWidth[4] === 'number') return lineWidth[4]
    if (lineWidth[0] === 'step' && typeof lineWidth[2] === 'number') return lineWidth[2]
  }
  return 1.5
}

/**
 * `line-offset` expression: flush half-stroke nudge below the interactivity cutoff,
 * meter-based road-width offset at/above it.
 *
 * Shape matters: the style spec only allows `['zoom']` as the input of a *top-level*
 * `interpolate`/`step` ("zoom-and-property" expression), so feature-dependent values live
 * in the stop outputs. Equal compact stops at 0 and `minzoom-1` keep the nudge constant
 * through the non-interactive range; from `minzoom` to 24, base-2 interpolation of the
 * meter stops is identical to `|offset| × pixelsPerMeter(zoom)`.
 */
export const bikelaneVisualLineOffset = (lineWidth: unknown) => {
  const compact = compactLineOffset(lowZoomLineWidthPx(lineWidth) / 2)
  return [
    'interpolate',
    ['exponential', 2],
    ['zoom'],
    MIN_ZOOM_STOP,
    compact,
    INTERACTIVE_MINZOOM - 1,
    compact,
    INTERACTIVE_MINZOOM,
    meterLineOffsetAtZoom(INTERACTIVE_MINZOOM),
    MAX_ZOOM_STOP,
    meterLineOffsetAtZoom(MAX_ZOOM_STOP),
  ] satisfies ExpressionSpecification
}

/** Value of a number or a linear `['interpolate', ['linear'], ['zoom'], …]` at `zoom`. */
export const zoomValue = (value: unknown, zoom: number) => {
  if (typeof value === 'number') return value
  if (!Array.isArray(value) || value[0] !== 'interpolate') {
    throw new Error(
      `zoomValue: expected a number or a linear zoom interpolate, got ${JSON.stringify(value)}`,
    )
  }
  const stops = value.slice(3) as number[]
  if (zoom <= stops[0]!) return stops[1]!
  for (let i = 2; i < stops.length; i += 2) {
    const [z0, v0, z1, v1] = [stops[i - 2]!, stops[i - 1]!, stops[i]!, stops[i + 1]!]
    if (zoom <= z1) return v0 + ((v1 - v0) * (zoom - z0)) / (z1 - z0)
  }
  return stops.at(-1)!
}

/** Symbol expressions get one stop per zoom level up to here; above it they keep the last value. */
export const SYMBOL_MAX_STEP_ZOOM = 19

/** Largest `|offset|` in meters the linear feature interpolation below covers exactly. */
const MAX_OFFSET_M = 100

/**
 * `text-offset` that moves a label or icon placed along the line onto the shifted bikelane
 * line, on top of the layer's own `text-offset` (`baseOffsetEm`).
 *
 * `text-offset` is in ems, so the pixel shift is divided by the `text-size` at each zoom.
 * One stop per zoom level: in between, base-2 interpolation follows the meter→pixel curve
 * exactly while the text size changes only slightly. With `symbol-placement: 'line'` /
 * `'line-center'` a positive y moves the symbol to the right of the line direction, the
 * same side `line-offset` uses; it stays there when MapLibre turns the label upright.
 */
export const bikelaneVisualTextOffset = (
  textSize: unknown,
  minzoom: number,
  baseOffsetEm: [number, number] = [0, 0],
) => {
  const [x, y] = baseOffsetEm
  const stop = (zoom: number) => {
    const emPerMeter = pixelsPerMeterAtZoom(zoom) / zoomValue(textSize, zoom)
    return [
      'interpolate',
      ['linear'],
      offsetMetersAbs,
      0,
      ['literal', [x, y]],
      MAX_OFFSET_M,
      ['literal', [x, y + MAX_OFFSET_M * emPerMeter]],
    ] satisfies ExpressionSpecification
  }
  const zooms = [
    ...Array.from({ length: SYMBOL_MAX_STEP_ZOOM - minzoom + 1 }, (_, i) => minzoom + i),
    MAX_ZOOM_STOP,
  ]
  return [
    'interpolate',
    ['exponential', 2],
    ['zoom'],
    ...zooms.flatMap((zoom) => [zoom, stop(zoom)]),
  ] as ExpressionSpecification
}

const isTextAlongLine = (layer: StyleLayer) =>
  layer.type === 'symbol' &&
  layer.layout?.['text-field'] !== undefined &&
  ['line', 'line-center'].includes(String(layer.layout?.['symbol-placement']))

/**
 * Apply the bikelane sideways shift to every layer that can take it:
 * - `line` layers get {@link bikelaneVisualLineOffset}, replacing any `line-offset` the layer
 *   defines itself. The data-driven offset is the single source of truth for the shift
 *   (compact below minzoom, meters above).
 * - `symbol` layers with text placed along the line get {@link bikelaneVisualTextOffset} on top
 *   of their own `text-offset`. They need a `text-size` that is a number or a linear zoom interpolate.
 *
 * Call this on the `layers` of every bikelane subcategory, before handing them to
 * `wrapSourceLayers` — e.g. `subcat_bikelanes`, `subcat_bikelanes_plus_*`, `subcat_radinfra_*`,
 * `subcat_surface_bikelane`. Other layers are returned unchanged.
 */
export const withBikelaneVisualLineOffset = (layers: StyleLayer[]): StyleLayer[] =>
  layers.map((layer) => {
    if (layer.type === 'line') {
      const paint = layer.paint ?? {}
      return {
        ...layer,
        paint: { ...paint, 'line-offset': bikelaneVisualLineOffset(paint['line-width']) },
      } satisfies StyleLayer
    }
    if (layer.type === 'symbol' && isTextAlongLine(layer)) {
      const layout = layer.layout ?? {}
      const ownOffset = layout['text-offset'] as [number, number] | undefined
      return {
        ...layer,
        layout: {
          ...layout,
          'text-offset': bikelaneVisualTextOffset(
            layout['text-size'] ?? 16,
            Math.max(layer.minzoom ?? 0, INTERACTIVE_MINZOOM),
            ownOffset,
          ),
        },
      } satisfies StyleLayer
    }
    return layer
  })
