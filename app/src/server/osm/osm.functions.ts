import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { postOsmNote } from './actions/postOsmNote.server'

const CreateOsmNoteInput = z.object({
  lat: z.number(),
  lon: z.number(),
  text: z.string(),
})

export const createOsmNoteFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateOsmNoteInput>) => CreateOsmNoteInput.parse(data))
  .handler(async ({ data }) => postOsmNote('/notes.json', data))

const UpdateOsmNoteInput = z
  .object({
    noteId: z.number().int().positive(),
    action: z.enum(['comment', 'close', 'reopen']),
    // Blank text becomes `undefined`, which `JSON.stringify` drops; OSM rejects an empty `text`.
    text: z
      .string()
      .trim()
      .optional()
      .transform((text) => text || undefined),
  })
  .refine((data) => data.action !== 'comment' || data.text, {
    message: 'Bitte Kommentar eingeben.',
    path: ['text'],
  })

export type UpdateOsmNoteInputType = z.input<typeof UpdateOsmNoteInput>

export const updateOsmNoteFn = createServerFn({ method: 'POST' })
  .validator((data: UpdateOsmNoteInputType) => UpdateOsmNoteInput.parse(data))
  .handler(async ({ data: { noteId, action, text } }) =>
    postOsmNote(`/notes/${noteId}/${action}.json`, { text }),
  )
