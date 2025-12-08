import { FileMapDataSubcategory, FileMapDataSubcategoryStyleLegend } from '../types'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'stats'
const source = 'atlas_aggregated_lengths'
const sourceLayer = 'aggregated_lengths'
export type SubcatRadinfraStatsId = typeof subcatId
export type SubcatRadinfraStatsStyleIds = 'default' | 'level6'

export const statsLegend: FileMapDataSubcategoryStyleLegend[] = [
  // {
  //   id: 'todo',
  //   name: '≤ 1,0 m',
  //   style: {
  //     type: 'line',
  //     color: '#ef9043',
  //   },
  // },
]

export const subcat_radinfra_stats: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Statistik (WIP)',
  ui: 'dropdown',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Bundesländer',
      layers: mapboxStyleLayers({
        layers: layers(),
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'level'], ['4'], true, false],
      }),
      legends: statsLegend,
    },
    {
      id: 'level6',
      name: 'Landkreise',
      layers: mapboxStyleLayers({
        layers: layers(),
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'level'], ['6'], true, false],
      }),
      legends: statsLegend,
    },
  ],
}

function layers() {
  return [
    {
      type: 'fill',
      id: 'area',
      paint: {
        'fill-color': 'rgb(195, 179, 255)',
        'fill-outline-color': 'hsl(0, 100%, 100%)',
        'fill-opacity': 0.35,
      },
    },
    {
      type: 'line',
      id: 'line',
      paint: {
        'line-color': 'hsl(0, 0%, 100%)',
        'line-opacity': 0.63,
      },
    },
    {
      layout: {
        'text-field': ['to-string', ['get', 'name']],
      },
      type: 'symbol',
      id: 'label',
      paint: {
        'text-color': 'rgba(69, 0, 112, 0.95)',
        'text-halo-width': 1,
        'text-halo-color': 'hsl(291, 0%, 100%)',
        'text-halo-blur': 1,
      },
    },
  ]
}
