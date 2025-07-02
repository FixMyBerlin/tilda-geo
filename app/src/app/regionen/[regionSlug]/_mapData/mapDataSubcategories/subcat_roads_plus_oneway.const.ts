import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_atlas_roads_plus_oneway } from './mapboxStyles/groups/atlas_roads_plus_oneway'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'roads_plus_oneway'
const source = 'atlas_roads'
const sourceLayer = 'roads'
export type SubcatRoadsPlusOnewayId = typeof subcatId
export type SubcatRoadsPlusOnewayStyleIds = 'default'
export const subcat_roads_plus_oneway: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Einbahnstraßen',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Einbahnstraßen',
      desc: '',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_roads_plus_oneway,
        source,
        sourceLayer,
        additionalFilter: [
          'match',
          ['get', 'road'],
          ['primary', 'primary_link', 'secondary_link', 'secondary'],
          false,
          true,
        ],
      }),
      legends: [
        {
          id: 'oneway',
          name: 'Einbahnstraße',
          style: { type: 'line', color: '#fad329', width: 2 },
        },
        {
          id: 'oneway-bike',
          name: 'Mit Radfreigabe',
          style: { type: 'line', color: '#54f8b6', width: 2 },
        },
      ],
    },
  ],
}
