import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_atlas_bikelanes_smooth_bad } from './mapboxStyles/groups/atlas_bikelanes_smooth_bad'
import { mapboxStyleGroupLayers_atlas_bikelanes_smooth_default } from './mapboxStyles/groups/atlas_bikelanes_smooth_default'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'
import { legendSurfaceBad, legendSurfaceDefault } from './subcat_surface_roads.const'

const subcatId = 'surfaceBikelanes'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatSurfaceBikelaneId = typeof subcatId
export type SubcatSurfaceBikelaneStyleIds = 'default' | 'bad'

export const subcat_surface_bikelane: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Radverkehrsanlagen',
  ui: 'dropdown',
  sourceId: 'atlas_bikelanes',
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Standard',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_bikelanes_smooth_default,
        source,
        sourceLayer,
      }),
      legends: legendSurfaceDefault,
    },
    {
      id: 'bad',
      name: 'Schlechte Oberflächenqualität',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_bikelanes_smooth_bad,
        source,
        sourceLayer,
      }),
      legends: legendSurfaceBad,
    },
  ],
}
