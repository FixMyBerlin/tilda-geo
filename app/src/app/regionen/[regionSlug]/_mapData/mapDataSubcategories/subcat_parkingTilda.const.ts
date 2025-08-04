import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTilda'
const source = 'tilda_parkings'
const sourceLayer = 'parkings'
export type SubcatParkingTildaId = typeof subcatId
export type SubcatParkingTildaStyleIds = 'default'

export const subcat_parkingTilda: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Parkraum',
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
            id: 'parking-lines',
            type: 'line',
            paint: {
              'line-color': [
                'case',
                ['==', ['get', 'capacity_status'], 'present'],
                'rgb(22, 163, 74)',
                ['==', ['get', 'capacity_status'], 'data_missing'],
                'rgb(187, 17, 133)',
                ['==', ['get', 'capacity_status'], 'notexpected'],
                'rgba(187, 17, 133, 0.25)',
                ['==', ['get', 'capacity_status'], 'no_parking'],
                'rgb(102, 21, 168)',
                'rgb(99, 53, 50)',
              ],
              'line-width': 2,
              'line-opacity': 0.8,
            },
            filter: ['==', '$type', 'LineString'],
          },
        ],
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'capacity_status--present',
          name: 'Parkstände',
          style: {
            type: 'line',
            color: 'rgb(22, 163, 74)',
          },
        },
        {
          id: 'capacity_status--data_missing',
          name: 'Daten fehlen noch',
          style: {
            type: 'line',
            color: 'rgb(187, 17, 133)',
          },
        },
        {
          id: 'capacity_status--notexpected',
          name: 'Daten nicht erwartet',
          desc: ['Gilt für Zufahrten und Fußgängerzonen'],
          style: {
            type: 'line',
            color: 'rgba(187, 17, 133, 0.25)',
          },
        },
        {
          id: 'capacity_status--no_parking',
          name: 'Parkverbot erfasst',
          style: {
            type: 'line',
            color: 'rgb(102, 21, 168)',
          },
        },
      ],
    },
  ],
}
