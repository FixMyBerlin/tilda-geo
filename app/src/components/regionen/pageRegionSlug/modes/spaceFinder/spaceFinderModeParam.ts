import { z } from 'zod'
import { SPACE_FINDER_SCORE_MODES } from '@/shared/regionen/spaceFinderScoreMode.const'
import { SPACE_FINDER_TOP_BY, SPACE_FINDER_TOP_MAX } from '@/shared/regionen/spaceFinderTop.const'

/**
 * Single JSON param for the Flächenfinder mode (`space`). `key` is the active `SpaceFinderVariant` id —
 * the planungsgebiet is always derived from it (D7: `useSpaceFinderSelection`), there is no
 * separate area key. `score` and `opacity` control the hexagon result layer (`opacity` 0 also hides
 * it — replaces the old separate visibility flag). `minArea: true` turns the "Mindestgröße"
 * filter on; absent means off. The square meters live on the variant (`factorConfig.min_area_m2`),
 * not in the URL — a draft in the space-finder store covers the value while it is being typed.
 * `top` turns »Beste Standorte« on and holds how many; `topBy` defaults to 'area'.
 * `new` opens the create wizard for a Planungsgebiet (a new Variante is a modal); `edit` opens the
 * Planungsgebiet editor.
 */
// Per-field `.catch` keeps stale bookmarks usable: `optionalSearchJson` drops the whole object
// as soon as one field fails.
export const zodSpaceFinderModeParam = z.object({
  key: z.number().optional().catch(undefined),
  score: z.enum(SPACE_FINDER_SCORE_MODES).optional().catch(undefined),
  opacity: z.number().min(0).max(100).optional().catch(undefined),
  minArea: z.literal(true).optional().catch(undefined),
  top: z.number().int().min(1).max(SPACE_FINDER_TOP_MAX).optional().catch(undefined),
  topBy: z.enum(SPACE_FINDER_TOP_BY).optional().catch(undefined),
  new: z.literal('area').optional().catch(undefined),
  edit: z.literal('area').optional().catch(undefined),
})

export type SpaceFinderModeParam = z.infer<typeof zodSpaceFinderModeParam>

/**
 * A Planungsgebiet is being created or edited. `key` stays set as the way back (»Abbrechen«) and,
 * for editing, as the Gebiet being edited — but no result is shown meanwhile (`useSpaceFinderSelection`).
 */
export const isSpaceFinderAreaFormOpen = (param: SpaceFinderModeParam) =>
  param.new === 'area' || param.edit === 'area'

export const compactSpaceFinderModeParam = (param: SpaceFinderModeParam) => {
  const next: SpaceFinderModeParam = {}
  if (param.key !== undefined) next.key = param.key
  if (param.score && param.score !== 'kombination') next.score = param.score
  if (param.opacity !== undefined && param.opacity !== 100) next.opacity = param.opacity
  if (param.minArea) next.minArea = true
  if (param.top !== undefined) next.top = param.top
  if (param.topBy && param.topBy !== 'area') next.topBy = param.topBy
  if (param.new) next.new = param.new
  if (param.edit) next.edit = param.edit
  return Object.keys(next).length > 0 ? next : undefined
}

/**
 * Square meters the map dims below. `0` means the filter is off or has no threshold yet.
 * `draft` is the number being typed (`0` = field cleared); `null` means use the variant's
 * saved `min_area_m2`.
 */
export const appliedMinAreaM2 = (
  filterOn: boolean,
  savedMinAreaM2: number | null | undefined,
  draft: number | null,
) => {
  if (!filterOn) return 0
  const value = draft ?? savedMinAreaM2 ?? 0
  return value > 0 ? value : 0
}

export const clampTopCount = (value: number) =>
  Math.min(SPACE_FINDER_TOP_MAX, Math.max(1, Math.round(value)))

/**
 * How many hexagons »Beste Standorte« ranks, `null` when it is off. A cleared field (`draft` 0)
 * keeps the count from the URL instead of dropping the ranking while retyping.
 */
export const appliedTopCount = (top: number | undefined, draft: number | null) => {
  if (top == null) return null
  return draft != null && draft > 0 ? clampTopCount(draft) : top
}
