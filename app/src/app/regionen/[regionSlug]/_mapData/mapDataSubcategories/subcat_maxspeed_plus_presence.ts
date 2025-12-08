import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_atlas_maxspeed_presence } from './mapboxStyles/groups/atlas_maxspeed_presence'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'maxspeed_plus_presence'
const source = 'atlas_roads'
const sourceLayer = 'roads'
export type SubcatMaxspeedPlusPresenceId = typeof subcatId
export type SubcatMaxspeedPlusPresenceStyleIds = 'default'

export const subcat_maxspeed_plus_presence: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Höchstgeschw. Vollständigkeit',
  ui: 'checkbox',
  sourceId: source,
  beforeId: 'boundary_country_outline',
  styles: [
    {
      id: 'default',
      name: 'Vollständigkeit',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_maxspeed_presence,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'missing',
          name: 'Daten fehlen',
          style: {
            type: 'line',
            color: '#fa80f4',
          },
        },
        {
          id: 'data-present',
          name: 'Maxspeed vorhanden',
          style: {
            type: 'line',
            color: '#8eb1f0',
          },
        },
      ],
    },
  ],
}
