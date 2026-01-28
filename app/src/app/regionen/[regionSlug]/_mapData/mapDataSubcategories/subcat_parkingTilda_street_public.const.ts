import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_park_street_areas_shadow } from './mapboxStyles/groups/park_street_areas_shadow'
import { mapboxStyleGroupLayers_park_street_default } from './mapboxStyles/groups/park_street_default'
import { mapboxStyleGroupLayers_park_street_kind } from './mapboxStyles/groups/park_street_kind'
import { mapboxStyleGroupLayers_park_street_label } from './mapboxStyles/groups/park_street_label'
import { mapboxStyleGroupLayers_park_street_pattern } from './mapboxStyles/groups/park_street_pattern'
import { mapboxStyleGroupLayers_park_street_surface } from './mapboxStyles/groups/park_street_surface'
import { mapboxStyleLayers, MapboxStyleLayersProps } from './mapboxStyles/mapboxStyleLayers'

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
  ['public', 'assumed_public'],
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

export const sharedStreetStyleDefaultLegends: FileMapDataSubcategory['styles'][number]['legends'] =
  [
    {
      id: 'capacity_status--present',
      name: 'Stellplätze',
      style: {
        type: 'line',
        color: 'rgb(22, 163, 74)',
      },
    },
    {
      id: 'shadow',
      name: 'Separat erfasste Parkflächen',
      style: {
        type: 'fill',
        color: 'rgba(97, 143, 168, 0.15)',
      },
    },
  ]

export const sharedStreetStyleSurfaceLegends: FileMapDataSubcategory['styles'][number]['legends'] =
  [
    {
      id: 'surface-soft',
      name: 'Durchlässig',
      style: {
        type: 'line',
        color: 'hsl(142, 94%, 40%)',
      },
    },
    {
      id: 'surface-semi',
      name: 'Etwas durchlässig',
      style: {
        type: 'line',
        color: 'hsl(164, 92%, 42%)',
      },
    },
    {
      id: 'surface-hard',
      name: 'Undurchlässig',
      style: {
        type: 'line',
        color: 'hsl(344, 93%, 35%)',
      },
    },
    {
      id: 'surface-unknown',
      name: 'Unkategorisiert',
      style: {
        type: 'line',
        color: 'hsl(280, 94%, 63%)',
      },
    },
    {
      id: 'surface-missing',
      name: 'Keine Angabe',
      style: {
        type: 'line',
        color: 'rgb(81, 22, 111)',
      },
    },
    {
      id: 'shadow',
      name: 'Separat erfasste Parkflächen',
      style: {
        type: 'fill',
        color: 'rgba(97, 143, 168, 0.15)',
      },
    },
  ]

export const sharedStreetStyleKindLegends: FileMapDataSubcategory['styles'][number]['legends'] = [
  {
    id: 'surface-soft',
    name: 'Durchlässig',
    style: {
      type: 'line',
      color: 'hsl(142, 94%, 40%)',
    },
  },
]

export const createSharedStreetStyles = (filter: MapboxStyleLayersProps['additionalFilter']) =>
  [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Parkbeschränkungen',
      layers: createStreetStyleLayers(filter),
      legends: sharedStreetStyleDefaultLegends,
    },
    {
      id: 'surface',
      name: 'Oberfläche',
      layers: createStreetSurfaceStyleLayers(filter),
      legends: sharedStreetStyleSurfaceLegends,
    },
    {
      id: 'kind',
      name: 'Typ (TODO)',
      layers: createStreetKindStyleLayers(filter),
      legends: sharedStreetStyleKindLegends,
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
