import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_atlas_roads_plus_fusswege } from './mapboxStyles/groups/atlas_roads_plus_fusswege'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'roads_plus_footways'
const source = 'atlas_roadsPathClasses'
const sourceLayer = 'roadsPathClasses'
export type SubcatRoadsPlusFootwaysId = typeof subcatId
export type SubcatRoadsPlusFootwaysStyleIds = 'default'
export const subcat_roads_plus_footways: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Fußweg, Pfad, Sonderweg, u.a.',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Fußweg, Pfad, Sonderweg, u.a.',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_roads_plus_fusswege,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'foot-bike',
          name: 'Fuß- oder Radweg',
          style: { type: 'line', color: '#c6aed0', width: 2 },
        },
        {
          id: 'track',
          name: 'Feld- oder Waldweg',
          style: { type: 'line', color: '#b4aac0', width: 2 },
        },
      ],
    },
  ],
}
