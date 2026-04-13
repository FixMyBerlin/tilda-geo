import type { FileMapDataSubcategory, FileMapDataSubcategoryStyleLegend } from '../types'
import { mapboxStyleGroupLayers_radinfra_smoothness } from './mapboxStyles/groups/radinfra_smoothness'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'
import { legendSurfaceDefault } from './subcat_surface_roads.const'

const subcatId = 'bikelanes'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatRadinfraSmoothnesshId = typeof subcatId
export type SubcatRadinfraSmoothnesshStyleIds = 'default'

export const bikelanesSmoothnessLegend: FileMapDataSubcategoryStyleLegend[] = [
  ...legendSurfaceDefault,
  {
    id: 'missing',
    name: 'Angaben fehlen',
    style: { type: 'line', color: '#fda5e4', dasharray: [3, 2], width: 2 },
  },
]

export const subcat_radinfra_smoothness: FileMapDataSubcategory = {
  id: subcatId,
  name: 'RVA Oberflächenqualität',
  ui: 'checkbox',
  beforeId: 'atlas-app-beforeid-top',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'RVA Oberflächenqualität', // field hidden
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_radinfra_smoothness,
        source,
        sourceLayer,
      }),
      legends: bikelanesSmoothnessLegend,
    },
  ],
}
