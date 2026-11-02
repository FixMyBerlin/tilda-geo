import type { FileMapDataSubcategory } from '../types'
import { layers_bikelanes_plus_bikesuitability } from './layers/bikelanes_plus_bikesuitability'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

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
      layers: wrapSourceLayers({
        layers: layers_bikelanes_plus_bikesuitability,
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
