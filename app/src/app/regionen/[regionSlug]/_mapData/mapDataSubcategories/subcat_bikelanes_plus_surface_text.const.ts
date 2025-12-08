import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_atlas_bikelanes_plus_surfaces } from './mapboxStyles/groups/atlas_bikelanes_plus_surfaces'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'bikelanes_plus_surface_smoothness'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatBikelanesPlusSurfaceId = typeof subcatId
export type SubcatBikelanesPlusSurfaceStyleIds = 'default'

export const subcat_bikelanes_plus_surface_text: FileMapDataSubcategory = {
  id: subcatId,
  name: 'RVA Oberfläche (Text)',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Oberfläche (Text)',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_bikelanes_plus_surfaces,
        source,
        sourceLayer,
      }),
      // legends: [...defaultLegend],
    },
  ],
}
