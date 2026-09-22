import { PLANNING_SCORE_MODES } from '@/shared/regionen/planningScoreMode.const'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import type { UrlMigration } from './types'

const LEGACY_PLANNING_KEYS = [
  'planning',
  'planningArea',
  'planningVariant',
  'planningScenario',
  'planningRun',
  'planningScore',
  'planningHexagons',
  'planningHexagonsOpacity',
  'planningMinArea',
  'planningAreaFilter',
] as const

/**
 * MIGRATION: Flächenfinder URL params (v4, D7). Folds the 10 legacy `planning*` keys into one `ff`
 * JSON object (`key`, `score`, `opacity`, `minArea`). `planningVariant` wins over the deprecated
 * `planningScenario`. `planningArea` and `planningRun` are dropped — both are now derived from the
 * variant (`useSpaceFinderSelection`), not stored in the URL. Legacy `planningHexagons=false` maps
 * to `opacity: 0`; `planningAreaFilter` not `true` clears `minArea` (filter off). The mode path
 * redirect (`?planning=true` on the region root → `/flaechenfinder`) happens in
 * `getRegionRedirectUrl`, not here — this migration only rewrites params, not the pathname.
 */
const migration: UrlMigration = (initialUrl) => {
  const url = new URL(initialUrl)
  const params = url.searchParams

  const variantRaw = params.get('planningVariant') ?? params.get('planningScenario')
  const scoreRaw = params.get('planningScore')
  const hexagonsRaw = params.get('planningHexagons')
  const opacityRaw = params.get('planningHexagonsOpacity')
  const minAreaRaw = params.get('planningMinArea')
  const areaFilterRaw = params.get('planningAreaFilter')

  const hadAnyLegacyParam = LEGACY_PLANNING_KEYS.some((key) => params.has(key))
  for (const key of LEGACY_PLANNING_KEYS) params.delete(key)
  if (!hadAnyLegacyParam) return url.toString()

  const ff: Record<string, unknown> = {}

  const variant = variantRaw !== null ? Number(variantRaw) : NaN
  if (Number.isFinite(variant)) ff.key = variant

  if (
    scoreRaw &&
    (PLANNING_SCORE_MODES as readonly string[]).includes(scoreRaw) &&
    scoreRaw !== 'kombination'
  ) {
    ff.score = scoreRaw
  }

  // `planningHexagons=false` (hidden) always maps to opacity 0, whatever the opacity slider held.
  const hexagonsVisible = hexagonsRaw === null ? true : hexagonsRaw === 'true'
  const rawOpacity = opacityRaw !== null ? Number(opacityRaw) : 100
  const effectiveOpacity = hexagonsVisible && Number.isFinite(rawOpacity) ? rawOpacity : 0
  const clampedOpacity = Math.max(0, Math.min(100, effectiveOpacity))
  if (clampedOpacity !== 100) ff.opacity = clampedOpacity

  const areaFilterOn = areaFilterRaw === 'true'
  const minArea = minAreaRaw !== null ? Number(minAreaRaw) : 0
  if (areaFilterOn && Number.isFinite(minArea) && minArea > 0) ff.minArea = minArea

  if (Object.keys(ff).length > 0) {
    params.set(searchParamsRegistry.ff, JSON.stringify(ff))
  }

  return url.toString()
}

export default migration
