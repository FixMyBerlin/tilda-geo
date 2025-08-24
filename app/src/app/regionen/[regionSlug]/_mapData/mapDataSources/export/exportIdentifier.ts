// Define the export tables

export const exportApiIdentifier = [
  'bicycleParking_points',
  'bicycleParking_areas', // private for now
  'bikelanes',
  'bikeroutes',
  // 'boundaries', // Does not work due to different table structure
  // 'boundaryLabels', // We don't need this
  'landuse',
  'places',
  'poiClassification',
  'publicTransport',
  'roads',
  'roadsPathClasses',
  'bikelanesPresence', // based on `roads`
  'bikeSuitability', // based on `roads`
  'trafficSigns',
  'barrierAreas',
  'barrierLines',
  // 'aggregated_lengths', // Does not work because the table does not conform to the required table structure with `tags` and `meta`
  'todos_lines',
  // Parking tables
  'parkings',
  'parkings_labels',
  'parkings_cutouts',
  'parkings_quantized',
  'parkings_separate',
  'parkings_separate_labels',
  'parkings_no',
  'off_street_parking_areas',
  'off_street_parking_points',
  'off_street_parking_area_labels',
] as const

export type SourceExportApiIdentifier = (typeof exportApiIdentifier)[number]

export const exportFunctionIdentifier = <TId extends SourceExportApiIdentifier>(tableName: TId) =>
  `atlas_export_flatgeobuf_${tableName.toLowerCase()}` as `atlas_export_flatgeobuf_${Lowercase<TId>}`
