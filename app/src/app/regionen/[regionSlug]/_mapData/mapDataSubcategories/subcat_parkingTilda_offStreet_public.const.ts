import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_tilda_parkings_area_labels } from './mapboxStyles/groups/tilda_parkings_area_labels'
import { mapboxStyleGroupLayers_tilda_parkings_off_street } from './mapboxStyles/groups/tilda_parkings_off_street'
import { mapboxStyleGroupLayers_tilda_parkings_off_street_point } from './mapboxStyles/groups/tilda_parkings_off_street_point'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTildaOffStreet'
const source = 'tilda_parkings_off_street'
const sourceLayer = 'off_street_parking_areas'
const sourceLayerLabel = 'off_street_parking_area_labels'
const sourceLayerPoint = 'off_street_parking_points'
export type SubcatParkingTildaOffStreetId = typeof subcatId
export type SubcatParkingTildaOffStreetStyleIds =
  | 'default'
  | 'surface'
  | 'kind'
  // Legacy values for old url configs:
  | 'conditional'

export const subcat_parkingTilda_offStreet_public: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Öffentliches Parken abseits des Straßenraums',
  // desc: 'Parken auf öffentlich gewidmeten Flächen abseits des Straßenraums',
  ui: 'dropdown',
  sourceId: source,
  beforeId: undefined,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Standard',
      layers: [
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_off_street,
          additionalFilter: ['match', ['get', 'operator_type'], ['private'], false, true],
          source,
          sourceLayer,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_off_street_point,
          additionalFilter: [
            'all',
            ['match', ['get', 'operator_type'], ['private'], true, false],
            ['==', '$type', 'Point'],
          ],
          source,
          sourceLayer: sourceLayerPoint,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_area_labels,
          additionalFilter: [
            'all',
            ['match', ['get', 'operator_type'], ['private'], true, false],
            ['==', '$type', 'Point'],
          ],
          source,
          sourceLayer: sourceLayerLabel,
          interactive: false,
        }),
      ],
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
    {
      id: 'surface',
      name: 'Oberfläche (TODO)',
      layers: [
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_off_street,
          // additionalFilter: ['==', '$type', 'Polygon'], // break patterns
          source,
          sourceLayer,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_off_street_point,
          additionalFilter: ['==', '$type', 'Point'],
          source,
          sourceLayer: sourceLayerPoint,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_area_labels,
          additionalFilter: ['==', '$type', 'Point'],
          source,
          sourceLayer: sourceLayerLabel,
          interactive: false,
        }),
      ],
      legends: [],
    },
    {
      id: 'kind',
      name: 'Type (TODO)',
      layers: [
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_off_street,
          // additionalFilter: ['==', '$type', 'Polygon'], // break patterns
          source,
          sourceLayer,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_off_street_point,
          additionalFilter: ['==', '$type', 'Point'],
          source,
          sourceLayer: sourceLayerPoint,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_area_labels,
          additionalFilter: ['==', '$type', 'Point'],
          source,
          sourceLayer: sourceLayerLabel,
          interactive: false,
        }),
      ],
      legends: [],
    },
  ],
}
