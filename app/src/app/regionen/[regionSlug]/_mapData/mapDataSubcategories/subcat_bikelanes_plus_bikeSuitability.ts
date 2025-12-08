import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_atlas_bikelanes_plus_bikesuitability } from './mapboxStyles/groups/atlas_bikelanes_plus_bikesuitability'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'bikelanes_plus_bikesuitability'
const source = 'atlas_bikeSuitability'
const sourceLayer = 'bikeSuitability'
export type SubcatBikelanesPlusBikeSuitabilityId = typeof subcatId
export type SubcatBikelanesPlusBikeSuitabilityStyleIds = 'default'
export const subcat_bikelanes_plus_bikesuitability: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Radeignung (Beta)',
  ui: 'checkbox',
  sourceId: source,
  // beforeId: 'atlas-app-beforeid-group1',
  styles: [
    {
      id: 'default',
      name: 'Radeignung (Beta)',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_bikelanes_plus_bikesuitability,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'goodSurface',
          name: 'Oberfläche',
          style: {
            type: 'line',
            color: '#0fcc51',
          },
        },
        {
          id: 'noMotorizedVehicle',
          name: 'Kfz Verbot',
          style: {
            type: 'line',
            color: '#0b7f83',
          },
        },
        {
          id: 'noOvertaking',
          name: 'Überholverbot',
          style: {
            type: 'line',
            color: '#07dfd7',
          },
        },
        {
          id: 'livingStreet',
          name: 'Verkehrsberuhigter Bereich',
          style: {
            type: 'line',
            color: '#0bbce0',
          },
        },
      ],
    },
  ],
}
