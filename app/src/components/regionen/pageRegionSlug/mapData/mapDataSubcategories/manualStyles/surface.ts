import type { FileMapDataSubcategoryStyleLegend } from '../../types'
import { legendSurfaceBad, legendSurfaceDefault } from '../subcat_surface_roads.const'

const smoothnessColor = [
  'match',
  ['get', 'smoothness'],
  ['very_bad'],
  '#d8035c',
  ['bad'],
  '#f90606',
  ['intermediate'],
  '#faa00f',
  ['good'],
  '#b5ea2e',
  ['excellent'],
  '#37f644',
  '#000000',
] as const

const filterAll = ['has', 'smoothness'] as const
const filterBad = ['match', ['get', 'smoothness'], ['bad', 'very_bad'], true, false] as const

// Same fade-in as the generated `atlas_roads_smooth_*` line layers
const lineOpacity = ['interpolate', ['linear'], ['zoom'], 9.9, 0, 10, 0.1, 10.3, 0.9] as const
const badLineWidth = ['interpolate', ['linear'], ['zoom'], 10, 1, 14, 2, 16, 3] as const
const areaFillOpacity = ['interpolate', ['linear'], ['zoom'], 9.9, 0, 10.3, 0.35, 16, 0.5] as const
const areaOutlineWidth = ['interpolate', ['linear'], ['zoom'], 12, 1, 16, 2.5] as const

const asAreaLegends = (legends: FileMapDataSubcategoryStyleLegend[]) =>
  legends.map(({ id, name, style }) => ({
    id,
    name,
    style: { type: 'fill', color: style.color },
  })) satisfies FileMapDataSubcategoryStyleLegend[]

export const surfaceAreaLegendsDefault = asAreaLegends(legendSurfaceDefault)
export const surfaceAreaLegendsBad = asAreaLegends(legendSurfaceBad)

// The generated `atlas_roads_smooth_bad` group also filters by `road` class, which drops all path classes.
export function surfaceLineBadLayers() {
  return [
    {
      id: 'smoothness-bad-line',
      type: 'line',
      filter: filterBad,
      paint: {
        'line-color': smoothnessColor,
        'line-dasharray': [1, 1],
        'line-opacity': lineOpacity,
        'line-width': badLineWidth,
      },
    },
  ]
}

export function surfaceAreaLayers({ badOnly }: { badOnly: boolean }) {
  const filter = badOnly ? filterBad : filterAll
  return [
    {
      id: 'smoothness-fill',
      type: 'fill',
      filter,
      paint: {
        'fill-color': smoothnessColor,
        'fill-opacity': areaFillOpacity,
      },
    },
    {
      id: 'smoothness-outline',
      type: 'line',
      filter,
      paint: {
        'line-color': smoothnessColor,
        'line-opacity': lineOpacity,
        'line-width': areaOutlineWidth,
        ...(badOnly ? { 'line-dasharray': [1, 1] } : {}),
      },
    },
  ]
}
