import { osmApiFeaturePointSchema } from '@/components/regionen/pageRegionSlug/modes/notes/osmNotesSchema'
import { osmApiPost } from './osmApiPost.server'

const errorLabelByAction = {
  comment: 'comment on OSM note',
  close: 'close OSM note',
  reopen: 'reopen OSM note',
} as const

export async function updateOsmNote(input: {
  noteId: number
  action: 'comment' | 'close' | 'reopen'
  text?: string
}) {
  const trimmedText = input.text?.trim()
  if (input.action === 'comment' && !trimmedText) {
    throw new Error('Comment text is required to comment on an OSM note.')
  }

  // OSM API rejects an explicit empty `text`, so only send the field when there is content.
  const body = trimmedText ? { text: trimmedText } : {}
  const result = await osmApiPost(
    `/notes/${input.noteId}/${input.action}.json`,
    body,
    errorLabelByAction[input.action],
  )
  return osmApiFeaturePointSchema.parse(result)
}
