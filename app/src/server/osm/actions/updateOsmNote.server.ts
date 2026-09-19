import { osmApiFeaturePointSchema } from '@/components/regionen/pageRegionSlug/modes/notes/osmNotesSchema'
import type { UpdateOsmNoteData } from '../osm.functions'
import { osmApiPost } from './osmApiPost.server'

// Input is already validated by `updateOsmNoteFn` (comment has text, blank text is `undefined`).
export async function updateOsmNote({ noteId, action, text }: UpdateOsmNoteData) {
  // `JSON.stringify` drops `text: undefined`; OSM rejects an explicit empty `text`.
  const result = await osmApiPost(`/notes/${noteId}/${action}.json`, { text }, `${action} OSM note`)
  return osmApiFeaturePointSchema.parse(result)
}
