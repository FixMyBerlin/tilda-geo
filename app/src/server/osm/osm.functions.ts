import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createOsmNote } from './actions/createOsmNote.server'
import { getOsmUserDetails } from './actions/getOsmUserDetails.server'

const CreateOsmNoteInput = z.object({
  lat: z.number(),
  lon: z.number(),
  text: z.string(),
})

export const createOsmNoteFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateOsmNoteInput>) => CreateOsmNoteInput.parse(data))
  .handler(async ({ data }) => createOsmNote(data))

export const getOsmUserDetailsFn = createServerFn({ method: 'GET' }).handler(async () =>
  getOsmUserDetails(),
)
