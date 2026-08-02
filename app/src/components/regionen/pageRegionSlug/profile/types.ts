type TerrainProfileSample = {
  lng: number
  lat: number
  distanceMeters: number
  elevationMeters: number
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

export type TerrainProfileLine = GeoJSON.LineString
