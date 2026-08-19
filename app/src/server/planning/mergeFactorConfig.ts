import type { Prisma } from '@/prisma/generated/client'

/** Variant assumptions without geometry (stored on PlanningVariant.factorConfig). */
export type VariantFactorConfig = {
  name?: string
  h3_resolution?: number
  dem_source?: 'srtm' | 'dgm1' | 'mapterhorn'
  weights?: Record<string, number>
  vegetation_direction?: 'positive' | 'negative'
  cir_source?: 'auto' | 'bayern' | 'bb' | 'hessen'
  max_cyclepath_dist_m?: number
  min_surface_score?: number
  exclude_carriageways?: boolean
  intersection_radius_m?: number
  parken_radius_m?: number
  fussgaengerzone_radius_m?: number
  bestand_default_diameter_m?: number
  min_score_threshold?: number
  targets?: object[]
}

/** Area geometry, use-case, size, and optional user obstacles (stored on PlanningArea). */
export type PlanningAreaInput = {
  studyArea: unknown
  userGeojson?: unknown
  userGeojsonMode?: string | null
  useCase: string
  areaSizeM2: number | null
}

/** Flat dict consumed by the Python worker and planning UI (area + variant merged). */
export type MergedFactorConfig = VariantFactorConfig & {
  study_area?: object
  user_geojson?: object
  user_geojson_mode?: string
  use_case?: string
  area_size_m2?: number | null
}

export const mergeFactorConfig = (
  area: PlanningAreaInput,
  variantConfig: VariantFactorConfig,
): MergedFactorConfig => {
  const merged: MergedFactorConfig = {
    ...variantConfig,
    study_area: area.studyArea as object,
    use_case: area.useCase,
    area_size_m2: area.areaSizeM2,
  }
  if (area.userGeojson != null) merged.user_geojson = area.userGeojson as object
  if (area.userGeojsonMode != null) merged.user_geojson_mode = area.userGeojsonMode
  return merged
}

export const areaInputFromRow = (row: {
  studyArea: Prisma.JsonValue
  userGeojson: Prisma.JsonValue | null
  userGeojsonMode: string | null
  useCase: string
  areaSizeM2: number | null
}): PlanningAreaInput => ({
  studyArea: row.studyArea,
  userGeojson: row.userGeojson ?? undefined,
  userGeojsonMode: row.userGeojsonMode,
  useCase: row.useCase,
  areaSizeM2: row.areaSizeM2,
})
