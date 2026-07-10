export type Rgba = [number, number, number, number]

export type MasterportalConditions = {
  properties?: Record<string, string | MasterportalAttributeCondition>
}

export type MasterportalAttributeCondition = {
  name: string
  condition: 'contains' | 'startsWith' | 'endsWith'
}

export type MasterportalRule = {
  conditions?: MasterportalConditions
  style: MasterportalDisplayStyle
}

export type MasterportalDisplayStyle = {
  type?: 'circle'
  lineStrokeColor?: Rgba
  lineStrokeWidth?: number
  lineStrokeDash?: number[]
  lineStrokeDashOffset?: number
  polygonFillColor?: Rgba
  polygonStrokeColor?: Rgba
  polygonStrokeWidth?: number
  polygonStrokeDash?: number[]
  circleFillColor?: Rgba
  circleStrokeColor?: Rgba
  circleStrokeWidth?: number
  circleRadius?: number
  labelField?: string
  textFillColor?: Rgba
  textStrokeColor?: Rgba
  textStrokeWidth?: number
  textScale?: number
  legendValue?: string
}

export const LEGEND_STYLE_IDS = [
  'tilda_parkings_parkbeschraenkungen_line',
  'tilda_off_street_parkbeschraenkungen_area',
] as const

export const GPKG_LEGEND_STYLE_IDS = [
  'parking_public_on_street',
  'parking_public_off_street',
] as const

export type GpkgManifestEntry = {
  gpkgLayer: string
  styleId: string
  geometryType: 'LineString' | 'MultiLineString' | 'Polygon'
  gpkgFile: string
  mapboxSourceFiles: string[]
  notes?: string[]
}

export type MasterportalStyleDefinition = {
  styleId: string
  rules: MasterportalRule[]
}

export type ManifestEntry = {
  styleId: string
  tileUrl: string
  sourceLayer: string
  geometryType: 'LineString' | 'Polygon' | 'Point'
  mapboxSourceFile: string
  limitations?: string[]
}

export type ConditionCategoryRule = {
  token: string
  color: string
}
