import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createOsmNote } from './actions/createOsmNote.server'
import { updateOsmNote } from './actions/updateOsmNote.server'

const CreateOsmNoteInput = z.object({
  lat: z.number(),
  lon: z.number(),
  text: z.string(),
})

export const createOsmNoteFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateOsmNoteInput>) => CreateOsmNoteInput.parse(data))
  .handler(async ({ data }) => createOsmNote(data))

const UpdateOsmNoteInput = z
  .object({
    noteId: z.number().int().positive(),
    action: z.enum(['comment', 'close', 'reopen']),
    text: z.string().optional(),
  })
  .refine((data) => data.action !== 'comment' || Boolean(data.text?.trim()), {
    message: 'Bitte Kommentar eingeben.',
    path: ['text'],
  })

export const updateOsmNoteFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateOsmNoteInput>) => UpdateOsmNoteInput.parse(data))
  .handler(async ({ data }) => updateOsmNote(data))
