import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_tilda_parkinglines } from './mapboxStyles/groups/tilda_parkinglines'
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
        layers: mapboxStyleGroupLayers_tilda_parkinglines,
        source,
        sourceLayer,
      }),
      // legends: [
      //   {
      //     id: 'capacity_status--present',
      //     name: 'Parkstände',
      //     style: {
      //       type: 'line',
      //       color: 'rgb(22, 163, 74)',
      //     },
      //   },
      //   {
      //     id: 'capacity_status--data_missing',
      //     name: 'Daten fehlen noch',
      //     style: {
      //       type: 'line',
      //       color: 'rgb(187, 17, 133)',
      //     },
      //   },
      //   {
      //     id: 'capacity_status--notexpected',
      //     name: 'Daten nicht erwartet',
      //     desc: ['Gilt für Zufahrten und Fußgängerzonen'],
      //     style: {
      //       type: 'line',
      //       color: 'rgba(187, 17, 133, 0.25)',
      //     },
      //   },
      //   {
      //     id: 'capacity_status--no_parking',
      //     name: 'Parkverbot erfasst',
      //     style: {
      //       type: 'line',
      //       color: 'rgb(102, 21, 168)',
      //     },
      //   },
      // ],
    },
  ],
}
