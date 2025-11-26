import { FileMapDataSubcategory, FileMapDataSubcategoryStyleLegend } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_atlas_roads_smooth_all } from './mapboxStyles/groups/atlas_roads_smooth_all'
import { mapboxStyleGroupLayers_atlas_roads_smooth_bad } from './mapboxStyles/groups/atlas_roads_smooth_bad'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'surfaceRoads'
const source = 'atlas_roads'
const sourceLayer = 'roads'
export type SubcatSurfaceRoadsId = typeof subcatId
export type SubcatSurfaceRoadsStyleIds = 'default' | 'bad'

export const legendSurfaceDefault = [
  { id: 'very_bad', name: 'Sehr schlecht', style: { type: 'line', color: '#d8035c' } },
  { id: 'bad', name: 'Schlecht', style: { type: 'line', color: '#f90606' } },
  { id: 'intermediate', name: 'Mittel', style: { type: 'line', color: '#faa00f' } },
  { id: 'good', name: 'Gut', style: { type: 'line', color: '#b5ea2e' } },
  { id: 'excellent', name: 'Sehr gut', style: { type: 'line', color: '#37f644' } },
] satisfies FileMapDataSubcategoryStyleLegend[]

export const legendSurfaceBad = [
  {
    id: 'very_bad',
    name: 'Sehr schlecht',
    style: { type: 'line', color: '#d8035c', dasharray: [3, 2] },
  },
  { id: 'bad', name: 'Schlecht', style: { type: 'line', color: '#f90606', dasharray: [3, 2] } },
] satisfies FileMapDataSubcategoryStyleLegend[]

export const subcat_surface_roads: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Fahrbahn',
  ui: 'dropdown',
  sourceId: source,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Standard',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_roads_smooth_all,
        source,
        sourceLayer,
      }),
      legends: legendSurfaceDefault,
    },
    {
      id: 'bad',
      name: 'Schlechte Oberflächen auf Nebenstraßen',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_roads_smooth_bad,
        source,
        sourceLayer,
      }),
      legends: legendSurfaceBad,
    },
  ],
}
