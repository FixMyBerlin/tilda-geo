import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_tilda_areas } from './mapboxStyles/groups/tilda_areas'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTildaSeparate'
const source = 'tilda_parkings_separate'
const sourceLayer = 'parkings_separate'
export type SubcatParkingTildaSeparateId = typeof subcatId
export type SubcatParkingTildaSeparateStyleIds = 'default'

export const subcat_parkingTildaSeparate: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Separate Parkplätze',
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
        layers: mapboxStyleGroupLayers_tilda_areas,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'multi-storey',
          name: 'Parkhaus',
          style: { type: 'fill', color: 'rgb(233, 91, 84)' },
        },
        {
          id: 'underground',
          name: 'Tiefgaragen',
          style: { type: 'fill', color: 'rgb(142, 192, 169)' },
        },
        {
          id: 'carport_s',
          name: 'Garage, Carport (einzeln, mehrfach)',
          style: { type: 'fill', color: 'rgb(251, 206, 74)' },
        },
        {
          id: 'surface',
          name: 'Flächenparkplätze',
          style: { type: 'fill', color: 'rgb(48, 159, 219)' },
        },
      ],
    },
  ],
}
