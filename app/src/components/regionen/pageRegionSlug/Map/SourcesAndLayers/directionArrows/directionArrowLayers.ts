import type { ExpressionSpecification, FilterSpecification } from 'maplibre-gl'
import type { LayerProps } from 'react-map-gl/maplibre'

// MapLibre scales a `line-pattern` to the line width: the pattern height keeps the drawn size,
// the pattern width is the distance between two arrows.
const SELECTED = { pattern: 'pattern-direction-arrow-selected', heightPx: 12 }
const FAINT = { pattern: 'pattern-direction-arrow-faint', heightPx: 10 }

export const DIRECTION_ARROWS_SELECTED_MINZOOM = 14
const DIRECTION_ARROWS_FAINT_MINZOOM = 19

type LineLayerProps = Extract<LayerProps, { type: 'line' }>

export type DirectionArrowLineEntry = {
  /** Map source of the line layer; the selection feature-state lives there. */
  sourceKey: string
  /** The data behind the map source; map sources of the same data show the faint arrows once. */
  sourceId: string
  sourceLayer: string | undefined
  layerProps: LayerProps
  /** Arrows against the geometry, with the `-reverse` patterns. */
  reverseDirectionArrows?: boolean
}

// Hit areas (`line-opacity: 0`) only catch clicks, they draw no line.
const isVisibleLine = (layerProps: LayerProps): layerProps is LineLayerProps =>
  layerProps.type === 'line' &&
  (layerProps.layout as { visibility?: string } | undefined)?.visibility !== 'none' &&
  layerProps.paint?.['line-opacity'] !== 0

const isLineGeometry = [
  'match',
  ['geometry-type'],
  ['LineString', 'MultiLineString'],
  true,
  false,
] satisfies ExpressionSpecification

const isEmptyFilter = (filter: FilterSpecification | undefined) =>
  filter === undefined || (Array.isArray(filter) && filter.length === 1 && filter[0] === 'all')

const selected = ['boolean', ['feature-state', 'selected'], false] satisfies ExpressionSpecification

/**
 * Arrows in the direction of the geometry: white on the selected line from zoom 14, small and
 * dark on every other line from zoom 19. `line-pattern` cannot follow the feature-state, so each
 * group of lines gets two layers.
 *
 * A `line-pattern`, because it takes the `line-offset` of the line. Symbols get their offset
 * per whole zoom level only, and MapLibre drops symbols at the same spot, like the two sides of
 * a street on one centerline. Lines with another `line-offset` get their own layers.
 */
export function buildDirectionArrowLayers(entries: DirectionArrowLineEntry[]) {
  const groups = new Map<
    string,
    DirectionArrowLineEntry & { suffix: string; lines: LineLayerProps[] }
  >()
  for (const entry of entries) {
    const line = entry.layerProps
    if (!isVisibleLine(line)) continue
    if (line.maxzoom !== undefined && line.maxzoom <= DIRECTION_ARROWS_SELECTED_MINZOOM) continue
    const offset = JSON.stringify(line.paint?.['line-offset'] ?? 0)
    const suffix = entry.reverseDirectionArrows ? '-reverse' : ''
    const key = `${entry.sourceKey}--${entry.sourceLayer ?? ''}--${offset}${suffix}`
    const group = groups.get(key) ?? { ...entry, suffix, lines: [] }
    group.lines.push(line)
    groups.set(key, group)
  }

  const shownData = new Set<string>()
  return Array.from(groups.values()).flatMap(
    ({ sourceKey, sourceId, sourceLayer, suffix, lines }, index) => {
      const filters = lines.map((line) => line.filter)
      const maxzooms = lines.map((line) => line.maxzoom)
      const maxzoom = maxzooms.every((zoom) => zoom !== undefined)
        ? Math.max(...(maxzooms as number[]))
        : undefined
      const topLine = lines.at(-1)!
      const lineOffset = topLine.paint?.['line-offset']

      const layer = (
        kind: string,
        { pattern, heightPx }: typeof SELECTED,
        minzoom: number,
        opacity: ExpressionSpecification,
      ): LineLayerProps => ({
        id: `${sourceKey}--${sourceLayer ?? ''}--direction-arrows-${index}-${kind}`,
        type: 'line',
        source: sourceKey,
        ...(sourceLayer !== undefined && { 'source-layer': sourceLayer }),
        ...(topLine.beforeId !== undefined && { beforeId: topLine.beforeId }),
        filter: filters.some(isEmptyFilter)
          ? isLineGeometry
          : ['all', isLineGeometry, ['any', ...(filters as ExpressionSpecification[])]],
        minzoom: Math.max(minzoom, Math.min(...lines.map((line) => line.minzoom ?? 0))),
        ...(maxzoom !== undefined && { maxzoom }),
        layout: { 'line-join': 'round' },
        paint: {
          'line-pattern': `${pattern}${suffix}`,
          'line-width': heightPx,
          'line-opacity': opacity,
          ...(lineOffset !== undefined && { 'line-offset': lineOffset }),
        },
      })

      const selectedLayer = layer('selected', SELECTED, DIRECTION_ARROWS_SELECTED_MINZOOM, [
        'case',
        selected,
        1,
        0,
      ])
      // Map sources of the same data draw the faint arrows once.
      const dataKey = `${sourceId}--${sourceLayer ?? ''}--${JSON.stringify(lineOffset ?? 0)}${suffix}`
      if (shownData.has(dataKey)) return [selectedLayer]
      shownData.add(dataKey)
      return [
        layer('faint', FAINT, DIRECTION_ARROWS_FAINT_MINZOOM, ['case', selected, 0, 0.8]),
        selectedLayer,
      ]
    },
  )
}
