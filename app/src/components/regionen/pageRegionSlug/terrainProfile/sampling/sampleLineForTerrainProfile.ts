import { along, length, lineString } from '@turf/turf'
import type { TerrainProfileLine } from '../types'

const DEFAULT_SAMPLE_SPACING_METERS = 10
const MIN_SAMPLE_COUNT = 10
const MAX_SAMPLE_COUNT = 320
const DENSE_SAMPLING_THRESHOLD_METERS = 2000
const LONG_DISTANCE_SAMPLE_TARGET = 200

type TerrainProfilePathSample = {
  lng: number
  lat: number
  distanceMeters: number
}

const resolveSpacingMeters = (distanceMeters: number, spacingMeters: number) => {
  if (distanceMeters <= DENSE_SAMPLING_THRESHOLD_METERS) return spacingMeters
  return Math.max(spacingMeters, distanceMeters / LONG_DISTANCE_SAMPLE_TARGET)
}

const calculateSampleCount = (
  distanceMeters: number,
  spacingMeters = DEFAULT_SAMPLE_SPACING_METERS,
  maxSamples = MAX_SAMPLE_COUNT,
) => {
  const effectiveSpacingMeters = resolveSpacingMeters(distanceMeters, spacingMeters)
  const targetSampleCount = Math.ceil(distanceMeters / effectiveSpacingMeters) + 1
  return Math.max(2, Math.min(maxSamples, Math.max(MIN_SAMPLE_COUNT, targetSampleCount)))
}

export const sampleLineForTerrainProfile = (
  geometry: TerrainProfileLine,
  options?: { spacingMeters?: number; maxSamples?: number },
) => {
  const line = lineString(geometry.coordinates)
  const distanceMeters = length(line, { units: 'meters' })
  const sampleCount = calculateSampleCount(
    distanceMeters,
    options?.spacingMeters,
    options?.maxSamples,
  )

  const samples: TerrainProfilePathSample[] = []
  for (let index = 0; index < sampleCount; index += 1) {
    const ratio = sampleCount === 1 ? 0 : index / (sampleCount - 1)
    const point = along(line, distanceMeters * ratio, { units: 'meters' })
    const [lng, lat] = point.geometry.coordinates
    if (lng === undefined || lat === undefined) continue
    samples.push({
      lng,
      lat,
      distanceMeters: distanceMeters * ratio,
    })
  }

  return samples
}
