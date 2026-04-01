import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { zodInternalNotesFilterParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import { createNote } from './mutations/createNote.server'
import { createNoteComment } from './mutations/createNoteComment.server'
import { deleteNote } from './mutations/deleteNote.server'
import { deleteNoteComment } from './mutations/deleteNoteComment.server'
import { updateNote } from './mutations/updateNote.server'
import { updateNoteComment } from './mutations/updateNoteComment.server'
import { updateNoteResolvedAt } from './mutations/updateNoteResolvedAt.server'
import { getNoteAndComments } from './queries/getNoteAndComments.server'
import { getNotesAndCommentsForRegion } from './queries/getNotesAndCommentsForRegion.server'
import { CreateNoteCommentSchema, CreateNoteSchema } from './schemas'

const CreateNoteInput = CreateNoteSchema.extend({ regionSlug: z.string() })
const CreateNoteCommentInput = CreateNoteCommentSchema.extend({ regionSlug: z.string() })
const UpdateNoteResolvedAtInput = z.object({
  noteId: z.number(),
  regionSlug: z.string(),
  resolved: z.boolean(),
})
const UpdateNoteInput = z.object({
  noteId: z.number(),
  subject: z.string(),
  body: z.string(),
  resolved: z.boolean(),
  regionSlug: z.string(),
})
const DeleteNoteInput = z.object({ regionSlug: z.string(), noteId: z.number() })
const UpdateNoteCommentInput = z.object({
  regionSlug: z.string(),
  commentId: z.number(),
  body: z.string(),
})
const DeleteNoteCommentInput = z.object({ regionSlug: z.string(), commentId: z.number() })
const GetNoteAndCommentsInput = z.object({ id: z.number() })
const GetNotesAndCommentsForRegionSchema = z.object({
  regionSlug: z.string(),
  filter: zodInternalNotesFilterParam.nullish(),
})

export type CreateNoteInputType = z.infer<typeof CreateNoteInput>
export type CreateNoteCommentInputType = z.infer<typeof CreateNoteCommentInput>
export type UpdateNoteResolvedAtInputType = z.infer<typeof UpdateNoteResolvedAtInput>
export type UpdateNoteInputType = z.infer<typeof UpdateNoteInput>
export type DeleteNoteInputType = z.infer<typeof DeleteNoteInput>
export type UpdateNoteCommentInputType = z.infer<typeof UpdateNoteCommentInput>
export type DeleteNoteCommentInputType = z.infer<typeof DeleteNoteCommentInput>

export const getNoteAndCommentsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof GetNoteAndCommentsInput>) =>
    GetNoteAndCommentsInput.parse(data),
  )
  .handler(async ({ data }) => {
    const result = await getNoteAndComments({ id: data.id }, getRequestHeaders())
    if (result === null) throw notFound()
    return result
  })

export const getNotesAndCommentsForRegionFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof GetNotesAndCommentsForRegionSchema>) =>
    GetNotesAndCommentsForRegionSchema.parse(data),
  )
  .handler(async ({ data }) => {
    return getNotesAndCommentsForRegion(data, getRequestHeaders())
  })

export const createNoteFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateNoteInput>) => CreateNoteInput.parse(data))
  .handler(async ({ data }) => createNote(data, getRequestHeaders()))

export const createNoteCommentFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateNoteCommentInput>) =>
    CreateNoteCommentInput.parse(data),
  )
  .handler(async ({ data }) => createNoteComment(data, getRequestHeaders()))

export const updateNoteResolvedAtFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateNoteResolvedAtInput>) =>
    UpdateNoteResolvedAtInput.parse(data),
  )
  .handler(async ({ data }) => updateNoteResolvedAt(data, getRequestHeaders()))

export const updateNoteFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateNoteInput>) => UpdateNoteInput.parse(data))
  .handler(async ({ data }) => updateNote(data, getRequestHeaders()))

export const deleteNoteFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof DeleteNoteInput>) => DeleteNoteInput.parse(data))
  .handler(async ({ data }) => deleteNote(data, getRequestHeaders()))

export const updateNoteCommentFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateNoteCommentInput>) =>
    UpdateNoteCommentInput.parse(data),
  )
  .handler(async ({ data }) => updateNoteComment(data, getRequestHeaders()))

export const deleteNoteCommentFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof DeleteNoteCommentInput>) =>
    DeleteNoteCommentInput.parse(data),
  )
  .handler(async ({ data }) => deleteNoteComment(data, getRequestHeaders()))
