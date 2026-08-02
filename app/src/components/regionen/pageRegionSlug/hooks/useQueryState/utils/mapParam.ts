import { z } from 'zod'
import { roundPositionForURL } from './roundNumber'
import { range } from './zodHelper'

export type MapParam = {
  zoom: number
  lat: number
  lng: number
  bearing?: number
  pitch?: number
}

const MapParam2dSchema = z
  .tuple([range(0, 22), range(-90, 90), range(-180, 180)])
  .transform(([zoom, lat, lng]) => ({ zoom, lat, lng }) satisfies MapParam)

const MapParam3dSchema = z
  .tuple([range(0, 22), range(-90, 90), range(-180, 180), range(-360, 360), range(0, 85)])
  .transform(
    ([zoom, lat, lng, bearing, pitch]) => ({ zoom, lat, lng, bearing, pitch }) satisfies MapParam,
  )

export const parseMapParam = (query: string) => {
  const parts = query.split('/')

  if (parts.length === 3) {
    const parsed = MapParam2dSchema.safeParse(parts)
    return parsed.success ? parsed.data : null
  }

  if (parts.length === 5) {
    const parsed = MapParam3dSchema.safeParse(parts)
    return parsed.success ? parsed.data : null
  }

  return null
}

const roundCameraValue = (value: number) => Number.parseFloat(value.toFixed(1))

export const serializeMapParam = ({ zoom, lat, lng, bearing, pitch }: MapParam) => {
  const [roundedLat, roundedLng, roundedZoom] = roundPositionForURL(lat, lng, zoom)
  let serialized = `${roundedZoom}/${roundedLat}/${roundedLng}`

  // Present when 3D is active (RegionMap writes both); omit when absent (2D).
  if (bearing !== undefined && pitch !== undefined) {
    serialized += `/${roundCameraValue(bearing)}/${roundCameraValue(pitch)}`
  }

  return serialized
}
