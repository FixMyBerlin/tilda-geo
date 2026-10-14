import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { layers_parkingLars_stats } from './layers/parkingLars_stats'
import { layers_parkingLars_stats_length } from './layers/parkingLars_stats_length'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

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
      layers: wrapSourceLayers({
        layers: layers_parkingLars_stats,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['4'], true, false],
      }),
    },
    {
      id: 'default', // 'stats-admin-level-9',
      name: 'Bezirk: % Erfassung',
      layers: wrapSourceLayers({
        layers: layers_parkingLars_stats,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['9'], true, false],
      }),
    },
    {
      id: 'stats-admin-level-10',
      name: 'Stadtteil: % Erfassung',
      layers: wrapSourceLayers({
        layers: layers_parkingLars_stats,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['10'], true, false],
      }),
    },
    {
      id: 'length-admin-level-4',
      name: 'Stadt: Länge in km',
      layers: wrapSourceLayers({
        layers: layers_parkingLars_stats_length,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['4'], true, false],
      }),
    },
    {
      id: 'length-admin-level-9',
      name: 'Bezirk: Länge in km',
      layers: wrapSourceLayers({
        layers: layers_parkingLars_stats_length,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['9'], true, false],
      }),
    },
    {
      id: 'length-admin-level-10',
      name: 'Stadtteil: Länge in km',
      layers: wrapSourceLayers({
        layers: layers_parkingLars_stats_length,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['10'], true, false],
      }),
    },
  ],
}
