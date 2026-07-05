// Map-facing processing table IDs (tiles, cache warming, generalization).
// Processing also creates auxiliary tables (e.g. *_errors) that are not listed here.
// Export/tileset scripts use `exportIdentifier.ts` (`SourceExportApiIdentifier`).
export type TableId =
  | 'barrierLines'
  | 'barrierAreas'
  | 'bicycleParking_points'
  | 'bicycleParking_areas'
  | 'bikeroutes'
  | 'boundaries'
  | 'boundaryLabels'
  | 'landuse'
  | 'places'
  | 'poiClassification'
  | 'publicTransport'
  | 'roads'
  | 'roadsPathClasses'
  | 'bikelanesPresence' // based on `roads`
  | 'bikeSuitability' // based on `roads`
  | 'bikelanes'
  | 'trafficSigns'
  // | 'aggregated_lengths' // Statistik; Does not work, see https://github.com/FixMyBerlin/private-issues/issues/2240
  | 'todos_lines'
  | 'parkings'
  | 'parkings_labels'
  | 'parkings_cutouts'
  | 'parkings_quantized'
  | 'parkings_separate'
  | 'parkings_separate_labels'
  | 'parkings_no'
  | 'off_street_parking_areas'
  | 'off_street_parking_area_labels'
  | 'off_street_parking_points'
  | 'off_street_parking_quantized'

export type UnionTiles<T extends string> = T | `${T},${T}`
