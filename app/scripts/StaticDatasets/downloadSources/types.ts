export type DownloadConfig = DownloadConfigWfs | DownloadConfigUrl

export type DownloadConfigUrl = {
  format: 'URL'
  url: string
}

export type DownloadConfigWfs = {
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
