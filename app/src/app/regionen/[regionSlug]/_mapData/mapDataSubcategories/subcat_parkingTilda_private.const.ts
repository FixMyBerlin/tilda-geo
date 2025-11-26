import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_tilda_parkings_areas_shadow } from './mapboxStyles/groups/tilda_parkings_areas_shadow'
import { mapboxStyleGroupLayers_tilda_parkings_labels } from './mapboxStyles/groups/tilda_parkings_labels'
import { mapboxStyleGroupLayers_tilda_parkings_pattern } from './mapboxStyles/groups/tilda_parkings_pattern'
import { mapboxStyleGroupLayers_tilda_parkings_private } from './mapboxStyles/groups/tilda_parkings_private'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTildaPrivate'
const source = 'tilda_parkings'
const sourceLayer = 'parkings'
const sourceLayerLabel = 'parkings_labels'
const sourceLayerArea = 'parkings_separate'
export type SubcatParkingTildaPrivateId = typeof subcatId
export type SubcatParkingTildaPrivateStyleIds = 'default'

export const subcat_parkingTilda_private: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Privates Straßenparken',
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
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_areas_shadow,
          additionalFilter: ['match', ['get', 'operator_type'], ['private'], true, false],
          source,
          sourceLayer: sourceLayerArea,
          interactive: false,
        }),
      ],
      legends: [
        {
          id: 'private',
          name: 'Parken im privatem Straßenland',
          style: { type: 'fill', color: 'rgb(91, 230, 144)' },
        },
      ],
    },
  ],
}
