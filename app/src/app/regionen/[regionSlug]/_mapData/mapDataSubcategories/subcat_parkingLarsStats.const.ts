import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_parking_stats } from './mapboxStyles/groups/parking_stats'
import { mapboxStyleGroupLayers_parking_stats_length } from './mapboxStyles/groups/parking_stats_length'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingStats'
const source = 'lars_parking_stats'
const sourceLayer = 'processing.boundaries_stats'
export type SubcatParkingLarsStatsId = typeof subcatId
export type SubcatParkingLarsStatsStyleIds =
  | 'stats-admin-level-4'
  | 'default'
  | 'stats-admin-level-10'
  | 'length-admin-level-4'
  | 'length-admin-level-9'
  | 'length-admin-level-10'

export const subcat_parkingLarsStats: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Statistik',
  ui: 'dropdown',
  sourceId: source,
  beforeId: undefined,
  styles: [
    defaultStyleHidden,
    {
      id: 'stats-admin-level-4',
      name: 'Stadt: % Erfassung',
      desc: null,
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_parking_stats,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['4'], true, false],
      }),
    },
    {
      id: 'default', // 'stats-admin-level-9',
      name: 'Bezirk: % Erfassung',
      desc: null,
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_parking_stats,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['9'], true, false],
      }),
    },
    {
      id: 'stats-admin-level-10',
      name: 'Stadtteil: % Erfassung',
      desc: null,
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_parking_stats,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['10'], true, false],
      }),
    },
    {
      id: 'length-admin-level-4',
      name: 'Stadt: Länge in km',
      desc: null,
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_parking_stats_length,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['4'], true, false],
      }),
    },
    {
      id: 'length-admin-level-9',
      name: 'Bezirk: Länge in km',
      desc: null,
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_parking_stats_length,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['9'], true, false],
      }),
    },
    {
      id: 'length-admin-level-10',
      name: 'Stadtteil: Länge in km',
      desc: null,
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_parking_stats_length,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['10'], true, false],
      }),
    },
  ],
}
