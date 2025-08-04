// TODO type MapDataCategoryIds = typeof sources[number]['id']

export type MapDataCategoryId =
  // TILDA Radverkehr
  | 'bikelanes'
  | 'bikelanes-minimal'
  | 'boundaries' // Only used ONCE for now for the 'bb-kampagne'-region
  | 'lit'
  | 'poi'
  | 'roads'
  | 'statistics'
  | 'surface'
  // TILDA Parkraum
  | 'parking' // LEGACY for app/src/app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/v2/configs/_*.ts
  | 'parkingLars'
  // bicycleParking Atlas
  | 'bicycleParking'
  // Special only:
  | 'mapillary'
  | 'accidents'
  | 'trafficSigns'
  // Special radinfra.de categories
  | 'radinfra_currentness'
  | 'radinfra_bikelanes'
  | 'radinfra_trafficSigns'
  | 'radinfra_surface'
  | 'radinfra_width'
  | 'radinfra_oneway'
  | 'radinfra_campagins'
  | 'radinfra_statistics'
  | 'radinfra_mapillary'
