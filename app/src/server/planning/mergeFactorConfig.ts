import { StoredUserDatasetsSchema, type UserDataset } from '@/lib/planningUserGeojson'
import type { Prisma } from '@/prisma/generated/client'

/** Variant assumptions without geometry (stored on PlanningVariant.factorConfig). */
export type VariantFactorConfig = {
  name?: string
  /** Strength (0–1) per "Eigene Daten" dataset, key = `UserDataset.id`. Only applies to the
   * bonus/penalty modes; name, mode and geometry belong to the Planungsgebiet. */
  eigendaten_weights?: Record<string, number>
  h3_resolution?: number
  dem_source?: 'srtm' | 'dgm1' | 'mapterhorn'
  weights?: Record<string, number>
  vegetation_direction?: 'positive' | 'negative'
  platz_direction?: 'positive' | 'negative'
  cir_source?: 'auto' | 'bayern' | 'bb' | 'hessen'
  max_cyclepath_dist_m?: number
  exclude_carriageways?: boolean
  intersection_radius_m?: number
  parken_radius_m?: number
  fussgaengerzone_radius_m?: number
  bestand_default_diameter_m?: number
  bewohnerbedarf_radius_m?: number
  bewohnerbedarf_saettigung_ew?: number
  /** Ratio of the four target location categories in percent (sum 100) — only applies within
   * the factor `w_target`, see `zielortShares.ts` and `scorer.py`. If the field is missing
   * (variants from before category weighting), an equal split applies. */
  zielort_category_shares?: Record<string, number>
  /** Ratio of public transit to bike sharing in percent (sum 100) — only applies within the
   * factor `w_transit`, see `oepnvShares.ts` and `scorer.py`. If the field is missing (variants
   * from before category weighting), 50/50 applies — UNLIKE `zielort_category_shares` this is
   * NOT the behaviour from before the change (see comment in `oepnvCategories.ts`). */
  oepnv_category_shares?: Record<string, number>
  min_score_threshold?: number
  /** Target size of the area search (m²), client filter on cluster_area_m2 — per variant. */
  min_area_m2?: number | null
}

/** Area geometry, use-case, size, and optional user obstacles (stored on PlanningArea). */
export type PlanningAreaInput = {
  studyArea: unknown
  userDatasets?: UserDataset[]
  useCase: string
  areaSizeM2: number | null
  /** Census suggestion for `bewohnerbedarf_saettigung_ew`, computed once per Planungsgebiet. */
  censusSaettigungEw?: number | null
  censusEwPerHa?: number | null
}

/**
 * Fallback when the area has no census suggestion (data schema missing, uninhabited area).
 * Must match `UseCaseConfig.bewohnerbedarf_saettigung_ew` in `flaechenfinder/config.py`
 * and `FALLBACK_SAETTIGUNG_EW` in `planning-worker/merge_factor_config.py` — otherwise the
 * worker computes with a different value than the UI shows.
 */
export const FALLBACK_SAETTIGUNG_EW = 30

/**
 * Markers around `bewohnerbedarf_saettigung_ew` that only live in the merged config: they come
 * from the Planungsgebiet, not the variant, and must therefore never end up in
 * `PlanningVariant.factorConfig` (the suggestion would otherwise freeze as a user value).
 */
const AUTO_SAETTIGUNG_KEYS = [
  'bewohnerbedarf_saettigung_auto',
  'bewohnerbedarf_saettigung_auto_ew',
  'bewohnerbedarf_ew_pro_ha',
] as const

/** Flat dict consumed by the Python worker and planning UI (area + variant merged). */
export type MergedFactorConfig = VariantFactorConfig & {
  study_area?: object
  user_datasets?: UserDataset[]
  use_case?: string
  area_size_m2?: number | null
  /** true while the saturation comes from the census suggestion and was not set by hand. */
  bewohnerbedarf_saettigung_auto?: boolean
  /** The suggestion itself — kept after an override so the UI can show it and offer
   * a reset to the automatic value. */
  bewohnerbedarf_saettigung_auto_ew?: number | null
  /** Gross density of the area, only for the explanatory hint text. */
  bewohnerbedarf_ew_pro_ha?: number | null
}

/** Mirror of `merge_factor_config` in `planning-worker/merge_factor_config.py` (fallback 30). */
export const mergeFactorConfig = (area: PlanningAreaInput, variantConfig: VariantFactorConfig) => {
  // The saturation is only in the variant config if it was set by hand. Otherwise the
  // Planungsgebiet's census suggestion applies — all variants of an area start on the same
  // value, and the value still lands as a fixed number in the run snapshot.
  const suggestion = area.censusSaettigungEw ?? null
  const isAuto = variantConfig.bewohnerbedarf_saettigung_ew == null && suggestion != null
  const merged: MergedFactorConfig = {
    ...variantConfig,
    bewohnerbedarf_saettigung_ew:
      variantConfig.bewohnerbedarf_saettigung_ew ?? suggestion ?? FALLBACK_SAETTIGUNG_EW,
    bewohnerbedarf_saettigung_auto: isAuto,
    bewohnerbedarf_saettigung_auto_ew: suggestion,
    bewohnerbedarf_ew_pro_ha: area.censusEwPerHa ?? null,
    study_area: area.studyArea as object,
    use_case: area.useCase,
    area_size_m2: area.areaSizeM2,
  }
  // `variantConfig` may be an old snapshot with area fields — the area always wins.
  if (area.userDatasets != null && area.userDatasets.length > 0)
    merged.user_datasets = area.userDatasets
  else delete merged.user_datasets
  return merged
}

/**
 * Upgrades a run snapshot from the time with a single "Eigene Daten" upload (`user_geojson`,
 * `user_geojson_mode`, `weights.w_eigendaten`) to the current shape (`user_datasets` +
 * `eigendaten_weights`, dataset ID `d1` as in the migration). New snapshots stay unchanged.
 * Only the app reads old snapshots; the worker always computes with the current config.
 */
export const normalizeLegacyEigendaten = <T extends MergedFactorConfig | VariantFactorConfig>(
  config: T,
) => {
  const record = config as Record<string, unknown>
  const legacy = record.user_geojson
  const weights = (record.weights ?? {}) as Record<string, number>
  const hasLegacyWeight = 'w_eigendaten' in weights
  if (legacy == null && !hasLegacyWeight) return config

  const { user_geojson: _g, user_geojson_mode: _m, weights: _w, ...rest } = record
  const { w_eigendaten, ...restWeights } = weights
  const next: Record<string, unknown> = { ...rest }
  // An empty `weights` would otherwise remain as `{}` and differ from "not set".
  if (Object.keys(restWeights).length > 0) next.weights = restWeights
  if (legacy != null && next.user_datasets == null) {
    next.user_datasets = [
      {
        id: 'd1',
        name: 'Eigene Daten',
        mode: (record.user_geojson_mode as string | undefined) ?? 'bonus',
        geojson: legacy,
      },
    ]
    if (next.eigendaten_weights == null && w_eigendaten != null)
      next.eigendaten_weights = { d1: w_eigendaten }
  }
  return next as T
}

/**
 * Cleans a variant config sent by the client before saving: the area markers are always
 * removed, and while the client reports `bewohnerbedarf_saettigung_auto`, the saturation
 * itself too — only this way "automatic" stays a state and does not turn into a frozen user
 * value on the first save of any other change.
 */
export const stripAutoSaettigung = (config: MergedFactorConfig) => {
  const rest = { ...config } as Record<string, unknown>
  const wasAuto = rest.bewohnerbedarf_saettigung_auto === true
  for (const key of AUTO_SAETTIGUNG_KEYS) delete rest[key]
  if (wasAuto) delete rest.bewohnerbedarf_saettigung_ew
  return rest as VariantFactorConfig
}

/**
 * Saving factors must not touch the target size of the area search: it belongs to the filter in
 * »Anzeige« (`minAreaM2`). Otherwise an auto-save with an older draft could revert a value that was
 * just saved.
 */
export const keepStoredMinArea = <T extends VariantFactorConfig>(
  incoming: T,
  stored: VariantFactorConfig,
) => {
  const { min_area_m2: _ignored, ...rest } = incoming
  return (
    stored.min_area_m2 === undefined ? rest : { ...rest, min_area_m2: stored.min_area_m2 }
  ) as T
}

/** Initial strength of a new "Eigene Daten" dataset (10 points) so it takes effect immediately. */
export const DEFAULT_EIGENDATEN_WEIGHT = 0.1

/**
 * Syncs a variant config's `eigendaten_weights` with the area's datasets: strengths of removed
 * datasets are dropped, new datasets get `DEFAULT_EIGENDATEN_WEIGHT`, existing values (incl. 0)
 * stay. Without datasets the field is omitted.
 */
export const syncEigendatenWeights = <T extends VariantFactorConfig>(
  config: T,
  datasets: Pick<UserDataset, 'id'>[] | undefined,
) => {
  const current = config.eigendaten_weights ?? {}
  const next = Object.fromEntries(
    (datasets ?? []).map(({ id }) => [id, current[id] ?? DEFAULT_EIGENDATEN_WEIGHT]),
  )
  return { ...config, eigendaten_weights: Object.keys(next).length > 0 ? next : undefined }
}

export const areaInputFromRow = (row: {
  studyArea: Prisma.JsonValue
  /** Prisma JSON or already parsed with `StoredUserDatasetsSchema`. */
  userDatasets: unknown
  useCase: string
  areaSizeM2: number | null
  censusSaettigungEw?: number | null
  censusEwPerHa?: number | null
}) => ({
  studyArea: row.studyArea,
  userDatasets: StoredUserDatasetsSchema.parse(row.userDatasets),
  useCase: row.useCase,
  areaSizeM2: row.areaSizeM2,
  censusSaettigungEw: row.censusSaettigungEw ?? null,
  censusEwPerHa: row.censusEwPerHa ?? null,
})
