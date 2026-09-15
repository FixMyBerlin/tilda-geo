import type { ExpressionSpecification } from 'maplibre-gl'
import { interactivityConfiguration } from '../../mapDataSources/generalization/interacitvityConfiguartion'
import type { MapboxStyleLayer } from './types'

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
 * - **Below minzoom:** nudge left/right by half the layer's stroke width so the two sides
 *   sit flush against the centerline (no overlap, no road-width gap). Side comes from `id`.
 *   A meter-based gap would be sub-pixel at these zooms anyway.
 * - **At/above minzoom:** convert the `offset` attribute (meters, signed by side: `+` left /
 *   `-` right of the centerline; computed in processing as half the road width) to screen
 *   pixels so the two sides sit at the road edge.
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
 * - Only `line` layers can be offset this way. Symbol/text layers placed along the line
 *   (`symbol-placement: 'line-center'`, e.g. width/surface/traffic-sign labels) cannot be
 *   perpendicular-offset via the style and stay on the centerline.
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
 * Signed pixels-per-meter at a given zoom. Negated because MapLibre `line-offset` is
 * positive to the RIGHT of the line direction, whereas our `offset` attribute is positive
 * to the LEFT of it (PostGIS `ST_OffsetCurve` convention).
 */
const signedPixelsPerMeterAtZoom = (zoom: number) => -(2 ** zoom) / metersPerPixelAtZoom0

const MIN_ZOOM_STOP = 0
const MAX_ZOOM_STOP = 24
const INTERACTIVE_MINZOOM = interactivityConfiguration.bikelanes.minzoom

/** Signed `offset` attribute in meters; missing (e.g. center-running `cycleway=self`) → `0`. */
const offsetMeters = ['coalesce', ['get', 'offset'], 0] satisfies ExpressionSpecification

/** Always in the MVT (`SELECT id`); derived lanes contain `/left` or `/right`. */
const featureId = ['to-string', ['coalesce', ['get', 'id'], '']] satisfies ExpressionSpecification

const compactLineOffset = (halfWidthPx: number) =>
  [
    'case',
    ['in', '/left', featureId],
    -halfWidthPx,
    ['in', '/right', featureId],
    halfWidthPx,
    0,
  ] satisfies ExpressionSpecification

const meterLineOffsetAtZoom = (zoom: number) =>
  ['*', offsetMeters, signedPixelsPerMeterAtZoom(zoom)] satisfies ExpressionSpecification

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
 * meter stops is identical to `offset × pixelsPerMeter(zoom)`.
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

/**
 * Apply {@link bikelaneVisualLineOffset} to every `line` layer, replacing any `line-offset`
 * that Mapbox Studio baked into the layer (a small per-layer nudge that used to sit on top of
 * the former database shift and is now redundant). The data-driven offset is the single source
 * of truth for the sideways shift. Non-line layers are returned unchanged.
 *
 * Call this on the `layers` of every bikelane subcategory that renders lines, before handing
 * them to `mapboxStyleLayers` — e.g. `subcat_bikelanes`, `subcat_radinfra_*`,
 * `subcat_surface_bikelane`. It is a no-op on symbol/text-only subcategories, so it is safe
 * (but pointless) to wrap those too.
 */
export const withBikelaneVisualLineOffset = (layers: MapboxStyleLayer[]): MapboxStyleLayer[] =>
  layers.map((layer) => {
    if (layer.type !== 'line') return layer
    const paint = (layer.paint ?? {}) as Record<string, unknown>
    // Override (not add to) any `line-offset` Mapbox Studio baked in — the data-driven offset
    // is the single source of truth for the sideways shift (compact below minzoom, meters above).
    return {
      ...layer,
      paint: { ...paint, 'line-offset': bikelaneVisualLineOffset(paint['line-width']) },
    } as MapboxStyleLayer
  })
