import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTildaQuantized'
const source = 'tilda_parkings_quantized'
const sourceLayer = 'parkings_quantized'
export type SubcatParkingTildaQuantizedId = typeof subcatId
export type SubcatParkingTildaQuantizedStyleIds = 'default'

export const subcat_parkingTildaQuantized: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Parkraum Quantisiert',
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
            id: 'parking-points',
            type: 'circle',
            paint: {
              'circle-color': 'rgb(22, 163, 74)',
              'circle-radius': 3,
              'circle-opacity': 0.8,
            },
            filter: ['==', '$type', 'Point'],
          },
        ],
        source,
        sourceLayer,
      }),
    },
  ],
}
