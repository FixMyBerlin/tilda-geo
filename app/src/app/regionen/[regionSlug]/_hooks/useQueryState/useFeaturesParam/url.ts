import { SourcesId } from '../../../_mapData/mapDataSources/sources.const'

// ABOUT:
// IDs are used by useFeatureParams as short reference of sources.
// List ist separate from sources.const (for now) to make it easier to add notes.
// The `url.test.ts` makes sure we always have a full and updated list by checking against sources.const
//
// Initially generated with:
// `const numericSourceIds= {...{1: 'osm-notes'}, ...Object.fromEntries(sources.map((s, i) => [i+2, s.id]))}`
//
// useFeatureParams supports sources that are not specified in sources.const which we have to list here
export const additionalSourceKeys = ['osm-notes'] as const
type SourceNames = SourcesId | (typeof additionalSourceKeys)[number]
export const numericSourceIds: Record<number, SourceNames> = {
  1: 'osm-notes',
  2: 'lars_parking',
  3: 'lars_parking_debug',
  4: 'lars_parking_points',
  5: 'lars_parking_areas',
  6: 'lars_parking_stats',
  7: 'atlas_boundaries',
  8: 'atlas_presenceStats',
  9: 'accidents_unfallatlas',
  10: 'atlas_bikelanes',
  11: 'atlas_bikeroutes',
  12: 'atlas_roads',
  13: 'atlas_roadsPathClasses',
  14: 'atlas_publicTransport',
  15: 'atlas_poiClassification',
  16: 'atlas_places',
  17: 'atlas_barriers',
  18: 'atlas_landuse',
  19: 'atlas_bicycleParking',
  20: 'atlas_trafficSigns',
  21: 'mapillary_coverage',
  22: 'atlas_bikelanesPresence',
  23: 'atlas_bikeSuitability',
  24: 'atlas_todos_lines',
  25: 'atlas_aggregated_lengths',
}
