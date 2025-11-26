import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_parking_parkinglines } from './mapboxStyles/groups/parking_parkinglines'
import { mapboxStyleGroupLayers_parking_parkinglines_completeness } from './mapboxStyles/groups/parking_parkinglines_completeness'
import { mapboxStyleGroupLayers_parking_parkinglines_labels } from './mapboxStyles/groups/parking_parkinglines_labels'
import { mapboxStyleGroupLayers_parking_parkinglines_missing } from './mapboxStyles/groups/parking_parkinglines_missing'
import { mapboxStyleGroupLayers_parking_parkinglines_surface } from './mapboxStyles/groups/parking_parkinglines_surface'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingLars'
const source = 'lars_parking'
const sourceLayer = 'processing.parking_segments'
export type SubcatParkingLarsId = typeof subcatId
export type SubcatParkingLarsStyleIds = 'default' | 'presence' | 'missing' | 'surface' | 'raw'

export const subcat_parkingLars: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Parkraum',
  ui: 'dropdown',
  sourceId: 'lars_parking',
  beforeId: undefined,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Standard',
      layers: [
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_parkinglines,
          source,
          sourceLayer,
        }),
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_parkinglines_labels,
          source: 'lars_parking',
          sourceLayer: 'processing.parking_segments_label',
        }),
      ].flat(),
    },
    {
      id: 'presence',
      name: 'Vollständigkeit',
      layers: [
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_parkinglines_labels,
          source: 'lars_parking',
          sourceLayer: 'processing.parking_segments_label',
        }),
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_parkinglines_completeness,
          source,
          sourceLayer,
        }),
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_parkinglines,
          source,
          sourceLayer,
        }),
      ].flat(),
      legends: [
        {
          id: 'capacity_status--present',
          name: 'Parkstände',
          style: {
            type: 'line',
            color: 'rgb(22, 163, 74)',
          },
        },
        {
          id: 'capacity_status--presetn--operator_type-private',
          name: 'Parkstände an Privatwegen',
          style: {
            type: 'line',
            color: 'rgba(22, 163, 74, 0.33)',
          },
        },
        {
          id: 'capacity_status--data_missing',
          name: 'Daten fehlen noch',
          style: {
            type: 'line',
            color: 'rgb(187, 17, 133)',
          },
        },
        {
          id: 'capacity_status--notexpected',
          name: 'Daten nicht erwartet',
          desc: ['Gilt für Zufahrten und Fußgängerzonen'],
          style: {
            type: 'line',
            color: 'rgba(187, 17, 133, 0.25)',
          },
        },
        {
          id: 'capacity_status--no_parking',
          name: 'Parkverbot erfasst',
          style: {
            type: 'line',
            color: 'rgb(102, 21, 168)',
          },
        },
        {
          id: 'capacity_status--segment_too_small',
          name: 'Segment zu klein',
          style: {
            type: 'line',
            color: 'rgb(99, 53, 50)',
          },
        },
      ],
    },
    {
      id: 'missing',
      name: 'Fehlende Daten',
      layers: [
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_parkinglines_missing,
          source,
          sourceLayer,
        }),
      ].flat(),
      legends: [
        {
          id: 'capacity_status--data_missing',
          name: 'Daten fehlen noch',
          style: {
            type: 'line',
            color: 'rgb(187, 17, 133)',
          },
        },
        {
          id: 'capacity_status--notexpected',
          name: 'Daten nicht erwartet',
          desc: ['Gilt für Zufahrten und Fußgängerzonen'],
          style: {
            type: 'line',
            color: 'rgba(187, 17, 133, 0.25)',
          },
        },
      ],
    },
    {
      id: 'surface',
      name: 'Oberflächen',
      layers: [
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_parkinglines_labels,
          source: 'lars_parking',
          sourceLayer: 'processing.parking_segments_label',
        }),
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_parkinglines_surface,
          source,
          sourceLayer,
        }),
      ].flat(),
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
          id: 'surface-gaps',
          name: 'Etwas durchlässig',
          style: {
            type: 'line',
            color: 'hsl(164, 92%, 42%)',
          },
        },
        {
          id: 'surface-closed',
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
      ],
    },
  ],
}
