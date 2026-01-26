import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_tilda_parkings_labels } from './mapboxStyles/groups/tilda_parkings_labels'
import { mapboxStyleGroupLayers_tilda_parkings_pattern } from './mapboxStyles/groups/tilda_parkings_pattern'
import { mapboxStyleGroupLayers_tilda_parkings_private } from './mapboxStyles/groups/tilda_parkings_private'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTildaOffStreet'
const source = 'tilda_parkings_off_street'
const sourceLayer = 'off_street_parking_areas'
const sourceLayerLabel = 'off_street_parking_area_labels'
const sourceLayerPoint = 'off_street_parking_points'
export type SubcatParkingTildaPrivateId = typeof subcatId
export type SubcatParkingTildaPrivateStyleIds = 'default'

export const subcat_parkingTilda_offStreet_private: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Privates Parken abseits des Straßenraum',
  ui: 'checkbox',
  sourceId: source,
  beforeId: undefined,
  styles: [
    {
      id: 'default',
      name: 'Standard',
      layers: [
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_private,
          additionalFilter: ['match', ['get', 'operator_type'], ['private'], true, false],
          source,
          sourceLayer,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_pattern,
          additionalFilter: ['match', ['get', 'operator_type'], ['private'], true, false],
          source,
          sourceLayer,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_labels,
          additionalFilter: ['match', ['get', 'operator_type'], ['private'], true, false],
          source,
          sourceLayer: sourceLayerLabel,
          interactive: false,
        }),
      ],
      legends: [
        {
          id: 'private',
          name: 'Privates Parken abseits des Straßenraums',
          style: { type: 'fill', color: 'rgb(91, 230, 144)' },
        },
      ],
    },
  ],
}
