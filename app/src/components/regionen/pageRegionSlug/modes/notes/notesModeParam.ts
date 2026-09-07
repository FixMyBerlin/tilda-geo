import { z } from 'zod'

/**
 * Single JSON param for the notes mode (`notesMode`). `key` is `'osm'` or a TILDA folder id;
 * omitted while a region has one notes kind. `extent` is omitted when `'view'` (the default).
 */
// Per-field `.catch` keeps stale bookmarks usable: `optionalSearchJson` drops the whole object
// as soon as one field fails.
export const zodNotesModeParam = z.object({
  key: z.string().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  extent: z.enum(['view', 'all']).optional().catch(undefined),
  completed: z.boolean().optional().catch(undefined),
  commented: z.boolean().optional().catch(undefined),
  notReacted: z.boolean().optional().catch(undefined),
  user: z.string().optional().catch(undefined),
})

export type NotesModeParam = z.infer<typeof zodNotesModeParam>

export const compactNotesModeParam = (param: NotesModeParam) => {
  const next: NotesModeParam = {}
  if (param.key) next.key = param.key
  if (param.search) next.search = param.search
  if (param.extent && param.extent !== 'view') next.extent = param.extent
  if (param.completed !== undefined) next.completed = param.completed
  if (param.commented !== undefined) next.commented = param.commented
  if (param.notReacted !== undefined) next.notReacted = param.notReacted
  if (param.user) next.user = param.user
  return Object.keys(next).length > 0 ? next : undefined
}

/** Server notes query still uses `query`; URL state uses `search`. */
export const notesModeToServerFilter = (notesMode: NotesModeParam) => ({
  query: notesMode.search,
  completed: notesMode.completed,
  commented: notesMode.commented,
  notReacted: notesMode.notReacted,
  user: notesMode.user,
})
