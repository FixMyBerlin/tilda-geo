import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_park_street_areas_shadow } from './mapboxStyles/groups/park_street_areas_shadow'
import { mapboxStyleGroupLayers_park_street_default } from './mapboxStyles/groups/park_street_default'
import { mapboxStyleGroupLayers_park_street_kind } from './mapboxStyles/groups/park_street_kind'
import { mapboxStyleGroupLayers_park_street_label } from './mapboxStyles/groups/park_street_label'
import { mapboxStyleGroupLayers_park_street_pattern } from './mapboxStyles/groups/park_street_pattern'
import { mapboxStyleGroupLayers_park_street_surface } from './mapboxStyles/groups/park_street_surface'
import type { MapboxStyleLayersProps } from './mapboxStyles/mapboxStyleLayers'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'
import {
  parkingTildaStreetDefaultLegends,
  parkingTildaStreetKindLegends,
  parkingTildaStreetSurfaceLegends,
} from './parkingTildaSharedLegends.const'

const subcatId = 'parkingTilda'
const source = 'tilda_parkings'
const sourceLayer = 'parkings'
const sourceLayerLabel = 'parkings_labels'
const sourceLayerArea = 'parkings_separate'
// const sourceLayerAreaLabel = 'parkings_separate_labels'
export type SubcatParkingTildaId = typeof subcatId
export type SubcatParkingTildaStyleIds =
  | 'default'
  | 'surface'
  | 'kind'
  // Legacy values for old url configs
  | 'public_access'
  | 'operator_type'

const publicFilter: MapboxStyleLayersProps['additionalFilter'] = [
  'match',
  ['get', 'operator_type'],
  ['public'],
  true,
  false,
]

export const createStreetStyleLayers = (filter: MapboxStyleLayersProps['additionalFilter']) =>
  [
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_street_default,
      additionalFilter: filter,
      source,
      sourceLayer,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_street_pattern,
      additionalFilter: filter,
      source,
      sourceLayer,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_street_label,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerLabel,
      interactive: false,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_street_areas_shadow,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerArea,
      interactive: false,
    }),
  ] satisfies FileMapDataSubcategory['styles'][number]['layers']

export const createStreetSurfaceStyleLayers = (
  filter: MapboxStyleLayersProps['additionalFilter'],
) =>
  [
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_street_surface,
      additionalFilter: filter,
      source,
      sourceLayer,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_street_pattern,
      additionalFilter: filter,
      source,
      sourceLayer,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_street_label,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerLabel,
      interactive: false,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_street_areas_shadow,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerArea,
      interactive: false,
    }),
  ] satisfies FileMapDataSubcategory['styles'][number]['layers']

export const createStreetKindStyleLayers = (filter: MapboxStyleLayersProps['additionalFilter']) =>
  [
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_street_kind,
      additionalFilter: filter,
      source,
      sourceLayer,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_street_pattern,
      additionalFilter: filter,
      source,
      sourceLayer,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_street_label,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerLabel,
      interactive: false,
    }),
    ...mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_park_street_areas_shadow,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerArea,
      interactive: false,
    }),
  ] satisfies FileMapDataSubcategory['styles'][number]['layers']

export const createSharedStreetStyles = (filter: MapboxStyleLayersProps['additionalFilter']) =>
  [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Parkbeschränkungen',
      layers: createStreetStyleLayers(filter),
      legends: parkingTildaStreetDefaultLegends,
    },
    {
      id: 'surface',
      name: 'Oberfläche',
      layers: createStreetSurfaceStyleLayers(filter),
      legends: parkingTildaStreetSurfaceLegends,
    },
    {
      id: 'kind',
      name: 'Lage',
      layers: createStreetKindStyleLayers(filter),
      legends: parkingTildaStreetKindLegends,
    },
  ] satisfies FileMapDataSubcategory['styles']

export const subcat_parkingTilda_street_public: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Öffentliches Straßenparken',
  // desc: 'Parken auf öffentlich gewidmeten Flächen im Straßenraum',
  ui: 'dropdown',
  sourceId: source,
  beforeId: undefined,
  styles: createSharedStreetStyles(publicFilter),
}
