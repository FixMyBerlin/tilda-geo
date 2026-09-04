type TerrainProfileSampleSource = 'dem' | 'interpolated'

export type TerrainProfileSample = {
  lng: number
  lat: number
  distanceMeters: number
  elevationMeters: number
  /** `interpolated` = bridge/tunnel chord; otherwise DEM ground sample. */
  source?: TerrainProfileSampleSource
}

export type TerrainProfileChartSample = TerrainProfileSample & {
  chartDistanceMeters: number
}

export type TerrainProfileStats = {
  minElevationMeters: number
  maxElevationMeters: number
  ascentMeters: number
  descentMeters: number
  distanceMeters: number
}

export type TerrainProfileData = {
  samples: TerrainProfileSample[]
  stats: TerrainProfileStats
}

export type TerrainProfileOrientation = 'west-east' | 'south-north'

type TerrainProfileSeries = {
  featureKey: string
  label: string
  color: string
  samples: TerrainProfileChartSample[]
  stats: TerrainProfileStats
}

export type CombinedTerrainProfileData = {
  series: TerrainProfileSeries[]
  stats: TerrainProfileStats
  orientation: TerrainProfileOrientation
  totalChartDistanceMeters: number
}

export type TerrainProfileLine = GeoJSON.LineString
