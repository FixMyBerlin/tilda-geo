import { getOsmOrgUrl, getOsmUrl } from '@/src/app/_components/utils/getOsmUrl'
import { format, subYears } from 'date-fns'
import { Point } from 'geojson'
import { EditorUrlGeometry, editorUrl } from './editorUrl'
import { OsmTypeId } from './extractOsmTypeIdByConfig'
import { pointFromGeometry } from './pointFromGeometry'
import { longOsmType, shortOsmType } from './shortLongOsmType'

export const osmTypeIdString = (type: string, id: string | number) => {
  return `${longOsmType[type]}/${id}`
}

export const osmOrgUrl = ({ osmType, osmId }: OsmTypeId) => {
  if (!osmType || !osmId) return undefined

  return getOsmOrgUrl(`/${osmType}/${osmId}`)
}

export const osmEditIdUrl = ({
  osmType,
  osmId,
  comment,
  hashtags,
  source,
}: OsmTypeId & { comment?: string; hashtags?: string; source?: string }) => {
  if (!osmType || !osmId) return undefined
  const url = new URL('https://www.openstreetmap.org/edit')
  url.searchParams.append(osmType, String(osmId))

  const hashParams = new URLSearchParams()
  comment && hashParams.append('comment', comment)
  source && hashParams.append('source', source)
  hashParams.append('hashtags', hashtags || '#radverkehrsatlas')

  return `${url.toString()}#${hashParams.toString()}`
}

export const osmEditRapidUrl = ({ osmType, osmId }: OsmTypeId) => {
  if (!osmType || !osmId) return undefined

  return `https://rapideditor.org/edit#id=${shortOsmType[osmType]}${osmId}&disable_features=boundaries&locale=de&hashtags=radverkehrsatlas`
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
    yearsAgo: 3,
    zoom: 15,
    ...options,
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

export const tildaViewerUrl = (zoom?: number, lat?: number, lng?: number) => {
  if (!zoom || !lat || !lng) return

  const url = new URL('https://viewer.tilda-geo.de/')
  url.searchParams.set('map', `${zoom}/${lat}/${lng}`)
  url.searchParams.set(
    'source',
    process.env.NEXT_PUBLIC_APP_ENV?.charAt(0).toUpperCase() +
      process.env.NEXT_PUBLIC_APP_ENV?.slice(1).toLowerCase(),
  )

  return url.toString()
}
