import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_atlas_bikelanes_plus_routes } from './mapboxStyles/groups/atlas_bikelanes_plus_routes'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'bikelanes_plus_routes'
const source = 'atlas_bikeroutes'
const sourceLayer = 'bikeroutes'
export type SubcatBikelanesPlusRoutesId = typeof subcatId
export type SubcatBikelanesPlusRoutesStyleIds = 'default'

export const subcat_bikelanes_plus_routes: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Radrouten',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Radrouten',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_bikelanes_plus_routes,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'ncn-icn',
          name: 'Nationale / Internationale Routen',
          style: {
            type: 'line',
            color: 'rgba(51, 240, 92, 0.85)',
          },
        },
        {
          id: 'rcn',
          name: 'Regionale Routen',
          style: {
            type: 'line',
            color: 'rgba(51, 117, 240, 0.54)',
          },
        },
        {
          id: 'lcn',
          name: 'Lokale Routen',
          style: {
            type: 'line',
            color: 'rgba(51, 186, 240, 0.54)',
          },
        },
        {
          id: 'rsv',
          name: 'Radschnellverbindung',
          style: {
            type: 'line',
            color: '#fabd05',
          },
        },
      ],
    },
  ],
}
