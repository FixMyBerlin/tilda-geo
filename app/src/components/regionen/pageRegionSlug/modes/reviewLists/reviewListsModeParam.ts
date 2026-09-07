import { z } from 'zod'

/**
 * Single JSON param for the review lists mode (`rl`). `key` is the review-list Prisma id.
 * `extent` is omitted when `'view'` (the default). `new` is the compose/draw session (like Hinweise).
 * `move` is the geometry-edit session for the selected entry (header pencil).
 */
// Per-field `.catch` keeps stale bookmarks usable: `optionalSearchJson` drops the whole object
// as soon as one field fails.
export const zodReviewListsModeParam = z.object({
  key: z.number().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  extent: z.enum(['view', 'all']).optional().catch(undefined),
  status: z.enum(['OPEN', 'OK', 'PROBLEM']).optional().catch(undefined),
  source: z.enum(['UPLOAD', 'MANUAL']).optional().catch(undefined),
  new: z.literal(true).optional().catch(undefined),
  move: z.literal(true).optional().catch(undefined),
})

export type ReviewListsModeParam = z.infer<typeof zodReviewListsModeParam>

export const compactReviewListsModeParam = (param: ReviewListsModeParam) => {
  const next: ReviewListsModeParam = {}
  if (param.key !== undefined) next.key = param.key
  if (param.search) next.search = param.search
  if (param.extent && param.extent !== 'view') next.extent = param.extent
  if (param.status) next.status = param.status
  if (param.source) next.source = param.source
  if (param.new) next.new = true
  if (param.move) next.move = true
  return Object.keys(next).length > 0 ? next : undefined
}
