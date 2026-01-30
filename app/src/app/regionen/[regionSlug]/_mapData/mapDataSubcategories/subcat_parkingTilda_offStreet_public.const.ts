import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_park_off_default_area } from './mapboxStyles/groups/park_off_default_area'
import { mapboxStyleGroupLayers_park_off_default_points } from './mapboxStyles/groups/park_off_default_points'
import { mapboxStyleGroupLayers_park_off_kind_area } from './mapboxStyles/groups/park_off_kind_area'
import { mapboxStyleGroupLayers_park_off_labels } from './mapboxStyles/groups/park_off_labels'
import { mapboxStyleGroupLayers_park_off_surface_area } from './mapboxStyles/groups/park_off_surface_area'
import { mapboxStyleLayers, MapboxStyleLayersProps } from './mapboxStyles/mapboxStyleLayers'

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

const publicFilter: MapboxStyleLayersProps['additionalFilter'] = [
  'match',
  ['get', 'operator_type'],
  ['public', 'assumed_public'],
  true,
  false,
]

export const createOffStreetStyleLayers = (filter: MapboxStyleLayersProps['additionalFilter']) =>
  [
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_off_default_area,
      additionalFilter: filter,
      source,
      sourceLayer,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_off_default_points,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerPoint,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_off_labels,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerLabel,
      interactive: false,
    }),
  ] satisfies FileMapDataSubcategory['styles'][number]['layers']

export const createOffStreetSurfaceStyleLayers = (
  filter: MapboxStyleLayersProps['additionalFilter'],
) =>
  [
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_off_surface_area,
      additionalFilter: filter,
      source,
      sourceLayer,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_off_default_points,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerPoint,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_off_labels,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerLabel,
      interactive: false,
    }),
  ] satisfies FileMapDataSubcategory['styles'][number]['layers']

export const createOffStreetKindStyleLayers = (
  filter: MapboxStyleLayersProps['additionalFilter'],
) =>
  [
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_off_kind_area,
      additionalFilter: filter,
      source,
      sourceLayer,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_off_default_points,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerPoint,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_off_labels,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerLabel,
      interactive: false,
    }),
  ] satisfies FileMapDataSubcategory['styles'][number]['layers']

export const sharedOffStreetStyleDefaultLegends: FileMapDataSubcategory['styles'][number]['legends'] =
  [
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
  ]

export const sharedOffStreetStyleSurfaceLegends: FileMapDataSubcategory['styles'][number]['legends'] =
  []

export const sharedOffStreetStyleKindLegends: FileMapDataSubcategory['styles'][number]['legends'] =
  []

export const createSharedOffStreetStyles = (filter: MapboxStyleLayersProps['additionalFilter']) =>
  [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Parkbeschränkungen',
      layers: createOffStreetStyleLayers(filter),
      legends: sharedOffStreetStyleDefaultLegends,
    },
    {
      id: 'surface',
      name: 'Oberfläche (TODO)',
      layers: createOffStreetSurfaceStyleLayers(filter),
      legends: sharedOffStreetStyleSurfaceLegends,
    },
    {
      id: 'kind',
      name: 'Type (TODO)',
      layers: createOffStreetKindStyleLayers(filter),
      legends: sharedOffStreetStyleKindLegends,
    },
  ] satisfies FileMapDataSubcategory['styles']

export const subcat_parkingTilda_offStreet_public: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Öffentliches Parken abseits des Straßenraums',
  // desc: 'Parken auf öffentlich gewidmeten Flächen abseits des Straßenraums',
  ui: 'dropdown',
  sourceId: source,
  beforeId: undefined,
  styles: createSharedOffStreetStyles(publicFilter),
}
