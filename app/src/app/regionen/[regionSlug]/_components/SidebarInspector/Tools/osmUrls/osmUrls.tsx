import { getOsmOrgUrl, getOsmUrl } from '@/src/app/_components/utils/getOsmUrl'
import { format, subYears } from 'date-fns'
import { Point } from 'geojson'
import { EditorUrlGeometry, editorUrl } from './editorUrl'
import { pointFromGeometry } from './pointFromGeometry'
import { longOsmType, shortOsmType } from './shortLongOsmType'

type OsmTypeId = {
  osmType: 'way' | 'node' | 'relation' | null
  osmId: number | string | null
}

export const osmTypeIdString = (type: string, id: string | number) => {
  return `${longOsmType[type]}/${id}`
}

export const osmOrgUrl = ({ osmType, osmId }: OsmTypeId) => {
  if (!osmType || !osmId) return undefined

  return getOsmOrgUrl(`/${osmType}/${osmId}`)
}

type OsmEditIdUrlProps = OsmTypeId & {
  comment?: string
  hashtags?: string
  source?: string
}
export const osmEditIdUrl = ({ osmType, osmId, comment, hashtags, source }: OsmEditIdUrlProps) => {
  if (!osmType || !osmId) return undefined
  const url = new URL('https://www.openstreetmap.org/edit')
  url.searchParams.append(osmType, String(osmId))

  const hashParams = new URLSearchParams()
  comment && hashParams.append('comment', comment)
  source && hashParams.append('source', source)
  hashParams.append('hashtags', hashtags || '#TILDA')

  return `${url.toString()}#${hashParams.toString()}`
}

export const osmEditRapidUrl = ({ osmType, osmId }: OsmTypeId) => {
  if (!osmType || !osmId) return undefined

  return `https://rapideditor.org/edit#id=${shortOsmType[osmType]}${osmId}&disable_features=boundaries&locale=de&hashtags=TILDA`
}

export const osmEditJosmUrl = ({ osmType, osmId }: OsmTypeId) => {
  if (!osmType || !osmId) return undefined

  // Docs at https://josm.openstreetmap.de/wiki/Help/RemoteControlCommands
  return `http://127.0.0.1:8111/load_object?objects=${shortOsmType[osmType]}${osmId}&changeset_hashtags=TILDA`
}

export const osmEditKyleKiwiIdUrl = ({ osmType, osmId }: OsmTypeId) => {
  if (!osmType || !osmId) return undefined

  return `https://kyle.kiwi/iD/#id=${shortOsmType[osmType]}${osmId}&locale=en&disable_features=boundaries&hashtags=TILDA`
}

export const historyUrl = ({ osmType, osmId }: OsmTypeId) => {
  if (!osmType || !osmId) return undefined

  return `https://osmlab.github.io/osm-deep-history/#/${osmType}/${osmId}`
}

export const mapillaryUrl = (
  geometry: EditorUrlGeometry | Point,
  options?: {
    yearsAgo?: number
    zoom?: number
    trafficSign?: 'all' | undefined
    panos?: true | undefined
  },
) => {
  const opt = {
    ...options,
    yearsAgo: options?.yearsAgo ?? 3,
    zoom: options?.zoom ?? 15,
  }
  const url = new URL('https://www.mapillary.com/app/')

  const [lng, lat] = pointFromGeometry(geometry)
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lng', String(lng))
  url.searchParams.set('z', String(opt.zoom))

  opt.trafficSign && url.searchParams.set('trafficSign', String(opt.trafficSign))
  opt.panos && url.searchParams.set('panos', String(opt.panos))

  const dateYearsAgo = format(subYears(new Date(), opt.yearsAgo), 'yyyy-MM-dd')
  opt.yearsAgo && url.searchParams.set('dateFrom', dateYearsAgo)

  return url.toString()
}

export const mapillaryKeyUrl = (key: number | string | undefined) => {
  if (!key) return undefined

  return `https://www.mapillary.com/app/?pKey=${key}&focus=photo&z=15`
}

export const osmUrlViewport = (zoom?: number, lat?: number, lng?: number) => {
  if (!zoom || !lat || !lng) return

  const urlTemplate = getOsmUrl('/#map={zoom}/{latitude}/{longitude}&layers=N')
  const geometry = {
    type: 'Point',
    coordinates: [lng, lat],
  } satisfies EditorUrlGeometry

  return editorUrl({
    urlTemplate,
    geometry,
    zoom,
  })
}

export const mapillaryUrlViewport = (zoom?: number, lat?: number, lng?: number) => {
  if (!zoom || !lat || !lng) return

  const urlTemplate = 'https://www.mapillary.com/app?z={zoom}&lat={latitude}&lng={longitude}'
  const geometry = {
    type: 'Point',
    coordinates: [lng, lat],
  } satisfies EditorUrlGeometry

  return editorUrl({
    urlTemplate,
    geometry,
    zoom,
  })
}

export const googleMapsUrlViewport = (zoom?: number, lat?: number, lng?: number) => {
  if (!zoom || !lat || !lng) return

  const urlTemplate = 'https://www.google.de/maps/@{latitude},{longitude},{zoom}z/data=!5m1!1e4'
  const geometry = {
    type: 'Point',
    coordinates: [lng, lat],
  } satisfies EditorUrlGeometry

  return editorUrl({
    urlTemplate,
    geometry,
    zoom,
  })
}

const generateTildaViewerUrl = (
  zoom: number,
  lat: number,
  lng: number,
  layers?: string,
): string | undefined => {
  if (!zoom || !lat || !lng) return undefined

  const url = new URL('https://viewer.tilda-geo.de/')
  url.searchParams.set('map', `${zoom}/${lat}/${lng}`)
  url.searchParams.set(
    'source',
    process.env.NEXT_PUBLIC_APP_ENV?.charAt(0).toUpperCase() +
      process.env.NEXT_PUBLIC_APP_ENV?.slice(1).toLowerCase(),
  )
  if (layers) {
    url.searchParams.set('layers', layers)
  }

  return url.toString()
}

export const tildaInsectorUrl = (zoom?: number, lat?: number, lng?: number) => {
  if (!zoom || !lat || !lng) return
  return generateTildaViewerUrl(zoom, lat, lng)
}

type TilesInspectorWithGeomUrlProps = {
  geometry: GeoJSON.Feature['geometry']
  sourceLayer: string | undefined
  zoom?: number
}

export const tilesInspectorWithGeomUrl = ({
  geometry,
  sourceLayer,
  zoom = 20,
}: TilesInspectorWithGeomUrlProps) => {
  if (!sourceLayer || !geometry) return undefined

  const [lng, lat] = pointFromGeometry(geometry)
  if (!lat || !lng) return undefined

  return generateTildaViewerUrl(zoom, lat, lng, sourceLayer)
}
