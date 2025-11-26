import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_tilda_parking_condition } from './mapboxStyles/groups/tilda_parking_condition'
import { mapboxStyleGroupLayers_tilda_parkings } from './mapboxStyles/groups/tilda_parkings'
import { mapboxStyleGroupLayers_tilda_parkings_areas_shadow } from './mapboxStyles/groups/tilda_parkings_areas_shadow'
import { mapboxStyleGroupLayers_tilda_parkings_labels } from './mapboxStyles/groups/tilda_parkings_labels'
import { mapboxStyleGroupLayers_tilda_parkings_pattern } from './mapboxStyles/groups/tilda_parkings_pattern'
import { mapboxStyleGroupLayers_tilda_parkings_surface } from './mapboxStyles/groups/tilda_parkings_surface'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTilda'
const source = 'tilda_parkings'
const sourceLayer = 'parkings'
const sourceLayerLabel = 'parkings_labels'
const sourceLayerArea = 'parkings_separate'
// const sourceLayerAreaLabel = 'parkings_separate_labels'
export type SubcatParkingTildaId = typeof subcatId
export type SubcatParkingTildaStyleIds = 'default' | 'conditional' | 'surface'

export const subcat_parkingTilda_line: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Öffentliches Straßenparken',
  // desc: 'Parken auf öffentlich gewidmeten Flächen im Straßenraum',
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
          layers: mapboxStyleGroupLayers_tilda_parkings,
          source,
          sourceLayer,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_pattern,
          additionalFilter: ['match', ['get', 'operator_type'], ['private'], false, true],
          source,
          sourceLayer,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_labels,
          additionalFilter: ['match', ['get', 'operator_type'], ['private'], false, true],
          source,
          sourceLayer: sourceLayerLabel,
          interactive: false,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_areas_shadow,
          additionalFilter: ['match', ['get', 'operator_type'], ['private'], false, true],
          source,
          sourceLayer: sourceLayerArea,
          interactive: false,
        }),
      ],
      legends: [
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
      ],
    },
    {
      id: 'conditional',
      name: 'Parkeinschränkungen',
      layers: [
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parking_condition,
          source,
          sourceLayer,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_pattern,
          additionalFilter: ['match', ['get', 'operator_type'], ['private'], false, true],
          source,
          sourceLayer,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_labels,
          additionalFilter: ['match', ['get', 'operator_type'], ['private'], false, true],
          source,
          sourceLayer: sourceLayerLabel,
          interactive: false,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_areas_shadow,
          additionalFilter: ['match', ['get', 'operator_type'], ['private'], false, true],
          source,
          sourceLayer: sourceLayerArea,
          interactive: false,
        }),
      ],
      legends: [
        {
          id: 'residents-paid',
          name: 'Bewohnerparken / mit Parkschein',
          style: {
            type: 'line',
            color: 'hsl(200, 94%, 50%)',
          },
        },
        {
          id: 'time-limited',
          name: 'Parken mit Parkscheibe',
          style: {
            type: 'line',
            color: 'hsl(60, 94%, 50%)',
          },
        },
        {
          id: 'loading',
          name: 'Ladezone',
          style: {
            type: 'line',
            color: 'hsl(30, 94%, 50%)',
          },
        },
        {
          id: 'charging',
          name: 'Laden von E-Fahrzeugen',
          style: {
            type: 'line',
            color: 'hsl(120, 94%, 50%)',
          },
        },
        {
          id: 'car-sharing',
          name: 'Carsharing',
          style: {
            type: 'line',
            color: 'hsl(280, 94%, 63%)',
          },
        },
        {
          id: 'disabled',
          name: 'Behindertenparkplatz',
          style: {
            type: 'line',
            color: 'hsl(0, 94%, 50%)',
          },
        },
        {
          id: 'taxi',
          name: 'Taxistand',
          style: {
            type: 'line',
            color: 'hsl(300, 94%, 50%)',
          },
        },
        {
          id: 'vehicle-restriction',
          name: 'Fahrzeugbeschränkung',
          style: {
            type: 'line',
            color: 'hsl(180, 94%, 50%)',
          },
        },
        {
          id: 'access-restriction',
          name: 'Zugangsbeschränkung',
          style: {
            type: 'line',
            color: 'hsl(240, 94%, 50%)',
          },
        },
        {
          id: 'no-parking',
          name: 'Temporäres Parkverbot',
          style: {
            type: 'line',
            color: 'hsl(15, 94%, 50%)',
          },
        },
        {
          id: 'no-stopping',
          name: 'Temporäres Halteverbot',
          style: {
            type: 'line',
            color: 'hsl(0, 94%, 35%)',
          },
        },
        {
          id: 'free',
          name: 'Kostenlos',
          style: {
            type: 'line',
            color: 'hsl(142, 94%, 40%)',
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
      ],
    },
    {
      id: 'surface',
      name: 'Oberfläche',
      layers: [
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_surface,
          source,
          sourceLayer,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_pattern,
          additionalFilter: ['match', ['get', 'operator_type'], ['private'], false, true],
          source,
          sourceLayer,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_labels,
          additionalFilter: ['match', ['get', 'operator_type'], ['private'], false, true],
          source,
          sourceLayer: sourceLayerLabel,
          interactive: false,
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_tilda_parkings_areas_shadow,
          additionalFilter: ['match', ['get', 'operator_type'], ['private'], false, true],
          source,
          sourceLayer: sourceLayerArea,
          interactive: false,
        }),
      ],
      legends: [
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
      ],
    },
  ],
}
