import type { FileMapDataSubcategory, FileMapDataSubcategoryStyleLegend } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { layers_parkingTilda_street_areas_shadow } from './layers/parkingTilda_street_areas_shadow'
import { layers_parkingTilda_street_default } from './layers/parkingTilda_street_default'
import { layers_parkingTilda_street_kind } from './layers/parkingTilda_street_kind'
import { layers_parkingTilda_street_label } from './layers/parkingTilda_street_label'
import { layers_parkingTilda_street_pattern } from './layers/parkingTilda_street_pattern'
import { layers_parkingTilda_street_surface } from './layers/parkingTilda_street_surface'
import { parkingTildaEdgesLayersByStyle } from './layers/parkingTildaEdgesLayers.const'
import type { WrapSourceLayersProps } from './layers/utils/wrapSourceLayers'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'
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

const publicFilter: WrapSourceLayersProps['additionalFilter'] = [
  'match',
  ['get', 'operator_type'],
  ['public'],
  true,
  false,
]

const createStreetStyleLayers = (filter: WrapSourceLayersProps['additionalFilter']) =>
  [
    ...wrapSourceLayers({
      layers: layers_parkingTilda_street_default,
      additionalFilter: filter,
      source,
      sourceLayer,
      minzoom: 14,
    }),
    ...wrapSourceLayers({
      layers: layers_parkingTilda_street_pattern,
      additionalFilter: filter,
      source,
      sourceLayer,
      minzoom: 14,
    }),
    ...wrapSourceLayers({
      layers: layers_parkingTilda_street_label,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerLabel,
      interactive: false,
    }),
    ...wrapSourceLayers({
      layers: layers_parkingTilda_street_areas_shadow,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerArea,
      interactive: false,
    }),
  ] satisfies FileMapDataSubcategory['styles'][number]['layers']

const createStreetSurfaceStyleLayers = (filter: WrapSourceLayersProps['additionalFilter']) =>
  [
    ...wrapSourceLayers({
      layers: layers_parkingTilda_street_surface,
      additionalFilter: filter,
      source,
      sourceLayer,
      minzoom: 14,
    }),
    ...wrapSourceLayers({
      layers: layers_parkingTilda_street_pattern,
      additionalFilter: filter,
      source,
      sourceLayer,
      minzoom: 14,
    }),
    ...wrapSourceLayers({
      layers: layers_parkingTilda_street_label,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerLabel,
      interactive: false,
    }),
    ...wrapSourceLayers({
      layers: layers_parkingTilda_street_areas_shadow,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerArea,
      interactive: false,
    }),
  ] satisfies FileMapDataSubcategory['styles'][number]['layers']

const createStreetKindStyleLayers = (filter: WrapSourceLayersProps['additionalFilter']) =>
  [
    ...wrapSourceLayers({
      layers: layers_parkingTilda_street_kind,
      additionalFilter: filter,
      source,
      sourceLayer,
      minzoom: 14,
    }),
    ...wrapSourceLayers({
      layers: layers_parkingTilda_street_pattern,
      additionalFilter: filter,
      source,
      sourceLayer,
      minzoom: 14,
    }),
    ...wrapSourceLayers({
      layers: layers_parkingTilda_street_label,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerLabel,
      interactive: false,
    }),
    ...wrapSourceLayers({
      layers: layers_parkingTilda_street_areas_shadow,
      additionalFilter: filter,
      source,
      sourceLayer: sourceLayerArea,
      interactive: false,
    }),
  ] satisfies FileMapDataSubcategory['styles'][number]['layers']

export const createSharedStreetStyles = (filter: WrapSourceLayersProps['additionalFilter']) =>
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

const parkingTildaPublicDefaultLegend = {
  id: 'edges-sum',
  name: 'Summe je Straßenseite (öffentlich, grau gepunktet bis Zoom 16)',
  style: { type: 'line', color: '#6B7280' },
} satisfies FileMapDataSubcategoryStyleLegend

export const parkingTildaPrivateDefaultLegend = {
  id: 'edges-sum-private',
  name: 'Summe je Straßenseite (privat, orange gepunktet bis Zoom 16)',
  style: { type: 'line', color: '#FF7162' },
} satisfies FileMapDataSubcategoryStyleLegend

export const attachParkingTildaEdges = (
  styles: ReturnType<typeof createSharedStreetStyles>,
  operatorType: 'public' | 'private',
  edgesLegend: typeof parkingTildaPublicDefaultLegend | typeof parkingTildaPrivateDefaultLegend,
) => {
  const layersByStyle = parkingTildaEdgesLayersByStyle(operatorType)
  return styles.map((style) => {
    if (style.id === 'default' || style.id === 'surface' || style.id === 'kind') {
      const edgeLayers = wrapSourceLayers({
        layers: layersByStyle[style.id],
        source,
        sourceLayer: 'parkings_edges',
        interactive: false,
      })
      return {
        ...style,
        layers: [...edgeLayers, ...style.layers],
        legends: [edgesLegend, ...(style.legends ?? [])],
      }
    }
    return style
  })
}

export const subcat_parkingTilda_street_public: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Öffentliches Straßenparken',
  // desc: 'Parken auf öffentlich gewidmeten Flächen im Straßenraum',
  ui: 'dropdown',
  sourceId: source,
  beforeId: undefined,
  styles: attachParkingTildaEdges(
    createSharedStreetStyles(publicFilter),
    'public',
    parkingTildaPublicDefaultLegend,
  ),
}
