import type { ExpressionSpecification } from 'maplibre-gl'
import type { SourcesId } from '../../mapDataSources/sources.const'
import type { FileMapDataSubcategoryStyleLayer } from '../../types'
import { pixelsPerMeterAtZoom, SYMBOL_MAX_STEP_ZOOM, zoomValue } from './utils/bikelaneLineOffset'
import type { StyleLayer } from './utils/types'
import { wrapSourceLayers } from './utils/wrapSourceLayers'

type WayIconLayersProps = {
  source: SourcesId
  sourceLayer: string
  /** Wraps the layers before they get the source, e.g. `withBikelaneVisualLineOffset`. */
  transformLayers?: (layers: StyleLayer[]) => StyleLayer[]
}

const isTunnel: ExpressionSpecification = ['match', ['get', 'tunnel'], ['yes'], true, false]
const hasStructure: ExpressionSpecification = [
  'any',
  ['match', ['get', 'bridge'], ['yes'], true, false],
  isTunnel,
]
// Same values and icons as the lifecycle row in the Inspector (`TagsTableRowLifecycle`).
const hasLifecycle: ExpressionSpecification = [
  'match',
  ['get', 'lifecycle'],
  ['construction', 'construction_no_access', 'temporary', 'blocked'],
  true,
  false,
]
const hasBoth: ExpressionSpecification = ['all', hasStructure, hasLifecycle]

const structureImage: ExpressionSpecification = [
  'case',
  isTunnel,
  ['image', 'tunnel'],
  ['image', 'bridge'],
]
const lifecycleImage: ExpressionSpecification = [
  'match',
  ['get', 'lifecycle'],
  'blocked',
  ['image', 'lifecycle-blocked'],
  ['image', 'lifecycle-construction'],
]
const iconsAlongLine: ExpressionSpecification = [
  'case',
  hasBoth,
  ['format', structureImage, {}, lifecycleImage, {}],
  hasStructure,
  ['format', structureImage, {}],
  ['format', lifecycleImage, {}],
]

const MINZOOM = 14
const ICON_WIDTH_PX = 20
/** Images in text render at their sprite size times `text-size / 24`. */
const TEXT_SIZE: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 14, 16.8, 18, 24]
/** Room around the icons, so MapLibre does not drop them at the end of a zoom step. */
const FIT_MARGIN = 2

/**
 * Whether the icons fit onto the way at `zoom`. MapLibre drops text along a line that is
 * shorter than the text, so the layer filters those ways out until they are long enough on
 * screen. `length` is the way length in meters from processing. MapLibre lays out a tile with
 * the text size of the next zoom level, hence `zoom + 1`.
 */
const fitsAtZoom = (zoom: number): ExpressionSpecification => {
  const iconPx = (ICON_WIDTH_PX * zoomValue(TEXT_SIZE, zoom + 1)) / 24
  const minMeters = (count: number) => (count * iconPx * FIT_MARGIN) / pixelsPerMeterAtZoom(zoom)
  return [
    '>=',
    ['to-number', ['coalesce', ['get', 'length'], 0]],
    ['case', hasBoth, minMeters(2), minMeters(1)],
  ]
}

/** `['step', ['zoom'], …]` with one stop per zoom level from {@link MINZOOM}. */
const perZoom = (output: (zoom: number) => ExpressionSpecification): ExpressionSpecification => {
  const zooms = Array.from({ length: SYMBOL_MAX_STEP_ZOOM - MINZOOM + 1 }, (_, i) => MINZOOM + i)
  const [first, ...rest] = zooms
  return [
    'step',
    ['zoom'],
    output(first!),
    ...rest.flatMap((zoom) => [zoom, output(zoom)]),
  ] as ExpressionSpecification
}

/**
 * Always-on icons in the middle of ways: bridge/tunnel (sprite ids `bridge` / `tunnel`)
 * and lifecycle like construction (`lifecycle-construction` / `lifecycle-blocked`).
 *
 * The icons are `['image', …]` sections of the `text-field`, so a way with both shows them
 * side by side along the line, and `text-offset` can move them onto a shifted line
 * (see `withBikelaneVisualLineOffset`). Ways too short for the icons at the current zoom show
 * none, they appear when zooming in (see {@link fitsAtZoom}).
 * Overlap is allowed so parallel ways each keep their icons. Non-interactive so clicks hit
 * the underlying line layer.
 */
export const wayIconLayers = ({
  source,
  sourceLayer,
  transformLayers = (layers) => layers,
}: WayIconLayersProps) =>
  wrapSourceLayers({
    source,
    sourceLayer,
    interactive: false,
    layers: transformLayers([
      {
        id: 'way-icons',
        type: 'symbol',
        filter: ['all', ['any', hasStructure, hasLifecycle], perZoom(fitsAtZoom)],
        minzoom: MINZOOM,
        layout: {
          'symbol-placement': 'line-center',
          'text-field': iconsAlongLine,
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': TEXT_SIZE,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {},
      },
    ]),
  }) as FileMapDataSubcategoryStyleLayer[]
