import type { FileMapDataSubcategory } from '../types'
import { customMapIcons } from './customMapIcons.const'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_atlas_bicycleparking_areas } from './mapboxStyles/groups/atlas_bicycleparking_areas'
import { mapboxStyleGroupLayers_atlas_bicycleparking_points } from './mapboxStyles/groups/atlas_bicycleparking_points'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'bicycleParking'
const source = 'atlas_bicycleParking'
export type SubcatBicycleParkingId = typeof subcatId
export type SubcatBicycleParkingStyleIds = 'default' | 'witharea'

export const subcat_bicycleParking: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Fahrradstellplätze',
  ui: 'dropdown',
  sourceId: source,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Standard',
      layers: [
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_atlas_bicycleparking_areas,
          source,
          sourceLayer: 'bicycleParking_areas',
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_atlas_bicycleparking_points,
          source,
          sourceLayer: 'bicycleParking_points',
        }),
        // Bike sharing and rental stations (`*=bicycle_rental`), own table so they are not
        // counted as parking. Custom pin, see `customMapIcons.const.ts`.
        {
          id: 'bicycle-rental',
          type: 'symbol',
          source,
          'source-layer': 'bicycleParking_rental',
          layout: {
            'icon-allow-overlap': true,
            'icon-anchor': 'bottom',
            'icon-image': customMapIcons.bikeSharePin.id,
            'icon-padding': 1,
            'icon-size': ['interpolate', ['linear'], ['zoom'], 14, 0.4, 18, 0.7],
          },
          paint: {
            'icon-opacity': 1,
          },
        },
      ],
      // legends: [
      //   {
      //     id: 'children',
      //     name: 'Kindergarten',
      //     style: {
      //       type: 'circle',
      //       color: 'rgb(119, 23, 171)',
      //     },
      //   },
      //   {
      //     id: 'older',
      //     name: 'Schule bis Uni',
      //     style: {
      //       type: 'circle',
      //       color: 'hsl(209, 76%, 38%)',
      //     },
      //   },
      // ],
    },
  ],
}
