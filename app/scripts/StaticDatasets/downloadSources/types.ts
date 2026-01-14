export type DownloadConfig = {
  format: 'WFS'
  endpoint: string
  layer: string
  opt?: {
    bbox?: number[]
    crs?: `urn:ogc:def:crs:EPSG::${number}`
    results?: number
    sortBy?: string
    props?: any[]
  }
}
