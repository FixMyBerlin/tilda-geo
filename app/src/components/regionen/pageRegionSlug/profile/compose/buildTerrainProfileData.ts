import { length, lineString } from '@turf/turf'
import { sampleLineForTerrainProfile } from '../sampling/sampleLineForTerrainProfile'
import { sampleTerrainElevations } from '../sampling/terrainSampler'
import type { TerrainProfileData, TerrainProfileLine, TerrainProfileStats } from '../types'

const buildStats = (samples: TerrainProfileData['samples'], distanceMeters: number) => {
  let minElevationMeters = Number.POSITIVE_INFINITY
  let maxElevationMeters = Number.NEGATIVE_INFINITY
  let ascentMeters = 0
  let descentMeters = 0

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index]
    if (!sample) continue
    const elevation = sample.elevationMeters
    minElevationMeters = Math.min(minElevationMeters, elevation)
    maxElevationMeters = Math.max(maxElevationMeters, elevation)

    if (index === 0) continue
    const previous = samples[index - 1]
    if (!previous) continue
    const delta = elevation - previous.elevationMeters
    if (delta > 0) ascentMeters += delta
    if (delta < 0) descentMeters += Math.abs(delta)
  }

  return {
    minElevationMeters,
    maxElevationMeters,
    ascentMeters,
    descentMeters,
    distanceMeters,
  } satisfies TerrainProfileStats
}

export const buildTerrainProfileData = async (geometry: TerrainProfileLine) => {
  const pathSamples = sampleLineForTerrainProfile(geometry)
  const elevations = await sampleTerrainElevations(pathSamples)
  const samples = pathSamples.map((sample, index) => ({
    ...sample,
    elevationMeters: elevations[index] ?? 0,
  }))

  const distanceMeters = length(lineString(geometry.coordinates), { units: 'meters' })

  return {
    samples,
    stats: buildStats(samples, distanceMeters),
  } satisfies TerrainProfileData
}
