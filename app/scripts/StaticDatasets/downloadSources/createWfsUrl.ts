import { DownloadConfigWfs } from './types'

export type WfsUrl = ReturnType<typeof createWfsUrl>

export const createWfsUrl = ({ endpoint, layer, opt }: DownloadConfigWfs) => {
  const url = new URL(endpoint)
  url.searchParams.append('service', 'WFS')
  url.searchParams.append('version', '2.0.0')
  url.searchParams.append('request', 'GetFeature')
  // url.searchParams.append('outputFormat', 'application/json') // https://docs.geoserver.org/main/en/user/services/wfs/outputformats.html
  url.searchParams.append('outputFormat', 'geopackage') // via https://gdi.berlin.de/services/wfs/radverkehrsanlagen?REQUEST=GetCapabilities&SERVICE=wfs
  url.searchParams.append('typeNames', layer)
  url.searchParams.append('srsName', opt?.crs || 'urn:ogc:def:crs:EPSG::4326')
  opt?.bbox && url.searchParams.append('bbox', opt.bbox.join(','))
  opt?.results && url.searchParams.append('results', String(opt.results))
  opt?.sortBy && url.searchParams.append('sortBy', opt.sortBy)
  opt?.props && url.searchParams.append('props', opt.props.join(','))

  return url
}
