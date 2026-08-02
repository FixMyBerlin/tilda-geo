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

const NEUTRAL_CAMERA_EPSILON = 0.05

const CoreMapParamSchema = z.tuple([range(0, 22), range(-90, 90), range(-180, 180)])
const BearingSchema = range(-360, 360)
const PitchSchema = range(0, 85)

const isPlaceholderCameraValue = (value: string) => {
  const normalized = value.trim().toLowerCase()
  return normalized === '' || normalized === '0' || normalized === 'none'
}

const isNeutralBearing = (bearing: number) =>
  Math.abs(bearing) < NEUTRAL_CAMERA_EPSILON ||
  Math.abs(bearing - 360) < NEUTRAL_CAMERA_EPSILON ||
  Math.abs(bearing + 360) < NEUTRAL_CAMERA_EPSILON

const isNeutralPitch = (pitch: number) => Math.abs(pitch) < NEUTRAL_CAMERA_EPSILON

const isNeutralCamera = ({ bearing, pitch }: MapParam) => {
  const resolvedBearing = bearing ?? 0
  const resolvedPitch = pitch ?? 0
  return isNeutralBearing(resolvedBearing) && isNeutralPitch(resolvedPitch)
}

export const hasNonNeutralCamera = (mapParam: MapParam) => !isNeutralCamera(mapParam)

export const parseMapParam = (query: string) => {
  const parts = query.split('/')
  const coreParsed = CoreMapParamSchema.safeParse(parts.slice(0, 3))
  if (!coreParsed.success) return null

  const [zoom, lat, lng] = coreParsed.data
  const result: MapParam = { zoom, lat, lng }

  if (parts.length === 3) return result

  if (parts.length >= 4 && !isPlaceholderCameraValue(parts[3] ?? '')) {
    const bearingParsed = BearingSchema.safeParse(parts[3])
    if (!bearingParsed.success) return result
    result.bearing = bearingParsed.data
  }

  if (parts.length >= 5 && !isPlaceholderCameraValue(parts[4] ?? '')) {
    const pitchParsed = PitchSchema.safeParse(parts[4])
    if (!pitchParsed.success) return result
    result.pitch = pitchParsed.data
  }

  return result
}

const roundCameraValue = (value: number) => Number.parseFloat(value.toFixed(1))

export const serializeMapParam = ({ zoom, lat, lng, bearing, pitch }: MapParam) => {
  const [roundedLat, roundedLng, roundedZoom] = roundPositionForURL(lat, lng, zoom)
  let serialized = `${roundedZoom}/${roundedLat}/${roundedLng}`

  if (!isNeutralCamera({ zoom, lat, lng, bearing, pitch })) {
    serialized += `/${roundCameraValue(bearing ?? 0)}/${roundCameraValue(pitch ?? 0)}`
  }

  return serialized
}
