import { queryOptions } from '@tanstack/react-query'
import { length, lineString } from '@turf/turf'
import type { Feature } from 'geojson'
import { terrainProfileGeometryFromFeature } from '../geometry/terrainProfileGeometryFromFeature'
import { applyStructureElevationInterpolation } from '../sampling/applyStructureElevationInterpolation'
import { sampleLineForTerrainProfile } from '../sampling/sampleLineForTerrainProfile'
import { sampleTerrainElevations } from '../sampling/terrainSampler'
import type {
  CombinedTerrainProfileData,
  TerrainProfileChartSample,
  TerrainProfileData,
  TerrainProfileLine,
  TerrainProfileStats,
} from '../types'
import {
  lineAxisProjection,
  pointAxisMeters,
  resolveAxisReferenceLat,
  resolveTerrainProfileOrientation,
  shouldReverseLineForChartAxis,
} from './orderTerrainProfileLines'
import { terrainProfileSeriesColor } from './terrainProfileSeriesColors'

export type EligibleTerrainProfileLine = {
  feature: Feature
  geometry: TerrainProfileLine
  featureKey: string
}

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

/** Async atom: sample one line, fetch DEM elevations, interpolate bridges/tunnels. */
const buildTerrainProfileData = async (entry: EligibleTerrainProfileLine) => {
  const pathSamples = sampleLineForTerrainProfile(entry.geometry)
  const elevations = await sampleTerrainElevations(pathSamples)
  const demSamples = pathSamples.map((sample, index) => ({
    ...sample,
    elevationMeters: elevations[index] ?? 0,
  }))
  const samples = applyStructureElevationInterpolation(demSamples, entry.feature.properties)

  const distanceMeters = length(lineString(entry.geometry.coordinates), { units: 'meters' })

  return {
    samples,
    stats: buildStats(samples, distanceMeters),
  } satisfies TerrainProfileData
}

export const terrainProfileQueryOptions = (entry: EligibleTerrainProfileLine, enabled: boolean) =>
  queryOptions({
    queryKey: ['terrain-profile', entry.featureKey] as const,
    queryFn: () => buildTerrainProfileData(entry),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  })

const reverseProfileSamples = (samples: TerrainProfileData['samples']) => {
  const lastDistance = samples[samples.length - 1]?.distanceMeters ?? 0
  return samples
    .slice()
    .reverse()
    .map((sample) => ({
      ...sample,
      distanceMeters: lastDistance - sample.distanceMeters,
    }))
}

export const collectEligibleTerrainProfileLines = (features: Feature[]) => {
  const lines: EligibleTerrainProfileLine[] = []
  for (const feature of features) {
    const geometry = terrainProfileGeometryFromFeature(feature)
    if (!geometry) continue
    // TILDA sources always carry properties.id (also promoteId → feature.id).
    const id = feature.properties?.id
    if (id == null) continue
    lines.push({
      feature,
      geometry,
      featureKey: String(id),
    })
  }
  return lines
}

/** Sync compose: align cached per-line profiles onto one chart axis for the current selection. */
export const combineTerrainProfileData = (
  entries: Array<EligibleTerrainProfileLine & { profile: TerrainProfileData }>,
) => {
  if (entries.length === 0) return null

  const geometries = entries.map((entry) => entry.geometry)
  const orientation = resolveTerrainProfileOrientation(geometries)
  const referenceLat = resolveAxisReferenceLat(geometries)

  // Map order: west→east or south→north along the chart axis.
  const ordered = entries
    .slice()
    .sort(
      (left, right) =>
        lineAxisProjection(left.geometry, orientation).mid -
        lineAxisProjection(right.geometry, orientation).mid,
    )

  const series: CombinedTerrainProfileData['series'] = []
  let minAxisMeters = Number.POSITIVE_INFINITY
  let maxAxisMeters = Number.NEGATIVE_INFINITY

  for (const [index, entry] of ordered.entries()) {
    // Digitized opposite to chart axis → reverse so left→right matches map W→E / S→N.
    const samplesAlongChartAxis = shouldReverseLineForChartAxis(entry.geometry, orientation)
      ? reverseProfileSamples(entry.profile.samples)
      : entry.profile.samples

    const chartSamples = samplesAlongChartAxis.map((sample) => {
      const axisMeters = pointAxisMeters(sample.lng, sample.lat, orientation, referenceLat)
      minAxisMeters = Math.min(minAxisMeters, axisMeters)
      maxAxisMeters = Math.max(maxAxisMeters, axisMeters)
      return {
        ...sample,
        chartDistanceMeters: axisMeters,
      } satisfies TerrainProfileChartSample
    })

    const lineDistance = entry.profile.stats.distanceMeters
    const orientedStats = buildStats(samplesAlongChartAxis, lineDistance)

    series.push({
      featureKey: entry.featureKey,
      label: entry.featureKey,
      color: terrainProfileSeriesColor(index),
      samples: chartSamples,
      stats: {
        ...entry.profile.stats,
        ascentMeters: orientedStats.ascentMeters,
        descentMeters: orientedStats.descentMeters,
      },
    })
  }

  // Normalize so chart X starts at 0 while preserving map spacing along the axis.
  const axisOriginMeters = minAxisMeters
  for (const entry of series) {
    for (const sample of entry.samples) {
      sample.chartDistanceMeters -= axisOriginMeters
    }
  }

  const totalChartDistanceMeters = Math.max(1, maxAxisMeters - axisOriginMeters)
  const allElevations = series.flatMap((entry) =>
    entry.samples.map((sample) => sample.elevationMeters),
  )

  return {
    series,
    orientation,
    totalChartDistanceMeters,
    stats: {
      minElevationMeters: Math.min(...allElevations),
      maxElevationMeters: Math.max(...allElevations),
      ascentMeters: series.reduce((sum, entry) => sum + entry.stats.ascentMeters, 0),
      descentMeters: series.reduce((sum, entry) => sum + entry.stats.descentMeters, 0),
      distanceMeters: totalChartDistanceMeters,
    },
  } satisfies CombinedTerrainProfileData
}
