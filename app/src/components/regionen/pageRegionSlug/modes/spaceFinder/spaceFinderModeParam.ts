import { z } from 'zod'
import { PLANNING_SCORE_MODES } from '@/shared/regionen/planningScoreMode.const'

/**
 * Single JSON param for the Flächenfinder mode (`ff`). `key` is the active `PlanningVariant` id —
 * the planungsgebiet is always derived from it (D7: `useSpaceFinderSelection`), there is no
 * separate area key. `score` and `opacity` control the hexagon result layer (`opacity` 0 also hides
 * it — replaces the old separate visibility flag). `minArea` is the "Gesuchte Fläche" filter;
 * 0/absent means the filter is off (replaces the old separate on/off flag). `new` is the create
 * wizard (new Planungsgebiet or new Variante); `edit` opens the Planungsgebiet editor.
 */
// Per-field `.catch` keeps stale bookmarks usable: `optionalSearchJson` drops the whole object
// as soon as one field fails.
export const zodSpaceFinderModeParam = z.object({
  key: z.number().optional().catch(undefined),
  score: z.enum(PLANNING_SCORE_MODES).optional().catch(undefined),
  opacity: z.number().min(0).max(100).optional().catch(undefined),
  minArea: z.number().optional().catch(undefined),
  new: z.enum(['area', 'variant']).optional().catch(undefined),
  edit: z.literal('area').optional().catch(undefined),
})

export type SpaceFinderModeParam = z.infer<typeof zodSpaceFinderModeParam>

export const compactSpaceFinderModeParam = (param: SpaceFinderModeParam) => {
  const next: SpaceFinderModeParam = {}
  if (param.key !== undefined) next.key = param.key
  if (param.score && param.score !== 'kombination') next.score = param.score
  if (param.opacity !== undefined && param.opacity !== 100) next.opacity = param.opacity
  if (param.minArea) next.minArea = param.minArea
  if (param.new) next.new = param.new
  if (param.edit) next.edit = param.edit
  return Object.keys(next).length > 0 ? next : undefined
}
