import {
  mergeFactorConfig,
  type MergedFactorConfig,
  type PlanningAreaInput,
  stripAutoSaettigung,
  type VariantFactorConfig,
} from './mergeFactorConfig'

type FactorLike = MergedFactorConfig | VariantFactorConfig | null | undefined

/** Area fields — separate fingerprint because `stale` is set by both area and factor writes. */
const AREA_KEYS = ['study_area', 'user_datasets', 'use_case', 'area_size_m2'] as const

/**
 * Fields that don't count for "do the factors need a recompute?":
 * - Planungsgebiet — see `areaInputsDiffer`
 * - `min_area_m2` — pure client filter of the area search, not part of any run
 * - the markers around the census saturation — they describe WHERE the value comes from; the
 *   computation uses `bewohnerbedarf_saettigung_ew`, which still counts
 */
const IGNORED_FACTOR_KEYS = new Set<string>([
  ...AREA_KEYS,
  'min_area_m2',
  'bewohnerbedarf_saettigung_auto',
  'bewohnerbedarf_saettigung_auto_ew',
  'bewohnerbedarf_ew_pro_ha',
])

const sortedJson = (value: unknown, omitKey?: (key: string) => boolean) =>
  JSON.stringify(value ?? null, (key, nested) => {
    if (omitKey?.(key)) return undefined
    if (nested === null || typeof nested !== 'object' || Array.isArray(nested)) return nested
    return Object.fromEntries(Object.entries(nested).sort(([a], [b]) => a.localeCompare(b)))
  })

/**
 * Stable comparison value of a variant's computation-relevant factors: same fingerprint
 * = same run. The replacer sorts each object's keys because Postgres `jsonb` returns a
 * different order than the form draft.
 */
export const factorFingerprint = (config: FactorLike) =>
  sortedJson(config, (key) => IGNORED_FACTOR_KEYS.has(key))

export const factorsDiffer = (a: FactorLike, b: FactorLike) =>
  factorFingerprint(a) !== factorFingerprint(b)

/** Raw snapshot vs. current config — not the re-merged snapshot, which carries today's area. */
export const areaInputsDiffer = (current: FactorLike, snapshot: FactorLike) => {
  const pick = (config: FactorLike) => {
    if (config == null) return null
    const record = config as Record<string, unknown>
    return Object.fromEntries(AREA_KEYS.map((key) => [key, record[key] ?? null]))
  }
  return sortedJson(pick(current)) !== sortedJson(pick(snapshot))
}

/**
 * After a factor save: mark the last run stale when the new factors differ from it, clear the flag
 * when they match again and the Gebiet still matches, and leave it when there is no run or the
 * Gebiet itself is still changed.
 */
export const runFreshnessAfterFactorSave = (
  next: VariantFactorConfig,
  area: PlanningAreaInput,
  snapshot: MergedFactorConfig | null | undefined,
) => {
  if (snapshot == null) return 'keep' as const
  // Same comparison as in the UI: merged config vs. the normalized run.
  const merged = mergeFactorConfig(area, next)
  if (factorsDiffer(merged, comparableRunSnapshot(snapshot, area))) return 'stale' as const
  if (areaInputsDiffer(merged, snapshot)) return 'keep' as const
  return 'fresh' as const
}

/** Banner text listing the causes; null when nothing is outdated. */
export const outdatedBannerReason = (factorsChanged: boolean, areaChanged: boolean) => {
  const parts = [
    factorsChanged && 'Faktoren geändert',
    areaChanged && 'Planungsgebiet geändert',
  ].filter((part) => typeof part === 'string')
  return parts.length > 0 ? parts.join(' und ') : null
}

/**
 * Brings a run snapshot into the same shape as the merged variant config:
 * `stripAutoSaettigung` reduces it to variant fields (auto markers and frozen auto value
 * removed), then the same area merge as in the UI. This compares old snapshots without the
 * threshold key and new ones with a merged value fairly — `min_area_m2` and area fields stay
 * ignored via `factorsDiffer`.
 */
export const comparableRunSnapshot = (
  snapshot: MergedFactorConfig | null | undefined,
  area: PlanningAreaInput,
) => {
  if (snapshot == null) return null
  return mergeFactorConfig(area, stripAutoSaettigung(snapshot))
}
