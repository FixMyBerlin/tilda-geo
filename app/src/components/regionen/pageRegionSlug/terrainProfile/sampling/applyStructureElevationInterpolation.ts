import type { TerrainProfileSample } from '../types'

type StructureProperties = {
  bridge?: unknown
  tunnel?: unknown
  [key: string]: unknown
}

export const isStructureFeature = (properties: StructureProperties | null | undefined) =>
  properties?.bridge === 'yes' || properties?.tunnel === 'yes'

/**
 * For OSM bridge/tunnel ways, DEM samples follow the ground (valley under a bridge,
 * mountain above a tunnel). Replace interior elevations with linear interpolation
 * between the first and last sample (entry/exit abutments), matching GraphHopper’s
 * 2-endpoint case. Endpoints keep their DEM values.
 */
export const applyStructureElevationInterpolation = (
  samples: TerrainProfileSample[],
  properties: StructureProperties | null | undefined,
) => {
  if (!isStructureFeature(properties) || samples.length < 2) {
    return samples.map((sample) => ({
      ...sample,
      source: 'dem' as const,
    }))
  }

  const first = samples[0]!
  const last = samples[samples.length - 1]!
  const spanMeters = last.distanceMeters - first.distanceMeters
  const elevationSpan = last.elevationMeters - first.elevationMeters

  return samples.map((sample, index) => {
    if (index === 0 || index === samples.length - 1) {
      return { ...sample, source: 'dem' as const }
    }

    const t = spanMeters <= 0 ? 0 : (sample.distanceMeters - first.distanceMeters) / spanMeters
    return {
      ...sample,
      elevationMeters: first.elevationMeters + elevationSpan * t,
      source: 'interpolated' as const,
    }
  })
}
