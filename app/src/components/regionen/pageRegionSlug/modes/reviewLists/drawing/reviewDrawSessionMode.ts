import { REVIEW_DRAW_MODE, type ReviewDrawMode } from './reviewTerraDrawConfig'

export type ReviewDrawSessionKind = 'compose' | 'edit'

/** `drawSession` is `'new'`, `'edit-${id}'`, or `'idle'`. */
export const reviewDrawSessionKind = (drawSession: string) => {
  if (drawSession === 'new') return 'compose' as const
  if (drawSession.startsWith('edit-')) return 'edit' as const
  return null
}

/**
 * Terra-draw mode to apply when a session starts (before `setEnabled(true)`).
 * Compose uses the toolbar geometry mode and never `select` (a leftover select
 * from idle/edit would make map clicks no-ops). Edit always starts in `select` so
 * map clicks move the existing pin instead of drawing a new one.
 */
export const reviewDrawStartMode = (
  kind: ReviewDrawSessionKind,
  composeMode: ReviewDrawMode = REVIEW_DRAW_MODE.point,
) => {
  if (kind === 'edit') return REVIEW_DRAW_MODE.select
  if (composeMode === REVIEW_DRAW_MODE.select) return REVIEW_DRAW_MODE.point
  return composeMode
}
