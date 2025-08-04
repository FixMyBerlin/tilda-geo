import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTildaCutouts'
const source = 'tilda_parkings_cutouts'
const sourceLayer = 'parkings_cutouts'
export type SubcatParkingTildaCutoutsId = typeof subcatId
export type SubcatParkingTildaCutoutsStyleIds = 'default'

export const subcat_parkingTildaCutouts: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Parkraum Aussparungen',
  ui: 'dropdown',
  sourceId: source,
  beforeId: undefined,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Standard',
      desc: null,
      layers: mapboxStyleLayers({
        layers: [
          {
            id: 'parking-cutouts',
            type: 'fill',
            paint: {
              'fill-color': 'rgb(255, 0, 0)',
              'fill-opacity': 0.5,
            },
            filter: ['==', '$type', 'Polygon'],
          },
        ],
        source,
        sourceLayer,
      }),
    },
  ],
}
