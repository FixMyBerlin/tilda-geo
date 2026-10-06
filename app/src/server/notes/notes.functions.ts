import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { zodInternalNotesFilterParam } from '@/shared/regionen/regionSearchZod'
import { createNote } from './mutations/createNote.server'
import { createNoteComment } from './mutations/createNoteComment.server'
import { createNoteFolder } from './mutations/createNoteFolder.server'
import { deleteNote } from './mutations/deleteNote.server'
import { deleteNoteComment } from './mutations/deleteNoteComment.server'
import { deleteNoteFolder } from './mutations/deleteNoteFolder.server'
import { deleteNoteFolderForAdmin } from './mutations/deleteNoteFolderForAdmin.server'
import { moveNoteToFolder } from './mutations/moveNoteToFolder.server'
import { updateNote } from './mutations/updateNote.server'
import { updateNoteComment } from './mutations/updateNoteComment.server'
import { updateNoteFolder } from './mutations/updateNoteFolder.server'
import { updateNoteFolderForAdmin } from './mutations/updateNoteFolderForAdmin.server'
import { updateNoteResolvedAt } from './mutations/updateNoteResolvedAt.server'
import { getNoteAndComments } from './queries/getNoteAndComments.server'
import { getNoteFoldersForRegion } from './queries/getNoteFoldersForRegion.server'
import { getNotesAndCommentsForRegion } from './queries/getNotesAndCommentsForRegion.server'
import {
  CreateNoteCommentSchema,
  CreateNoteSchema,
  DeleteNoteFolderSchema,
  UpdateNoteFolderFormSchema,
} from './schemas'

const RegionSlug = z.object({ regionSlug: z.string() })
const FolderInRegion = RegionSlug.extend({ folderId: z.number() })

const CreateNoteInput = CreateNoteSchema.extend({
  regionSlug: z.string(),
  folderId: z.number(),
})
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
  folderId: z.number(),
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
  .validator((data: z.infer<typeof GetNoteAndCommentsInput>) => GetNoteAndCommentsInput.parse(data))
  .handler(async ({ data }) => {
    const result = await getNoteAndComments({ id: data.id }, getRequestHeaders())
    if (result === null) throw notFound()
    return result
  })

export const getNotesAndCommentsForRegionFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof GetNotesAndCommentsForRegionSchema>) =>
    GetNotesAndCommentsForRegionSchema.parse(data),
  )
  .handler(async ({ data }) => {
    return getNotesAndCommentsForRegion(data, getRequestHeaders())
  })

export const createNoteFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateNoteInput>) => CreateNoteInput.parse(data))
  .handler(async ({ data }) => createNote(data, getRequestHeaders()))

export const createNoteCommentFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateNoteCommentInput>) => CreateNoteCommentInput.parse(data))
  .handler(async ({ data }) => createNoteComment(data, getRequestHeaders()))

export const updateNoteResolvedAtFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateNoteResolvedAtInput>) =>
    UpdateNoteResolvedAtInput.parse(data),
  )
  .handler(async ({ data }) => updateNoteResolvedAt(data, getRequestHeaders()))

export const updateNoteFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateNoteInput>) => UpdateNoteInput.parse(data))
  .handler(async ({ data }) => updateNote(data, getRequestHeaders()))

export const deleteNoteFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof DeleteNoteInput>) => DeleteNoteInput.parse(data))
  .handler(async ({ data }) => deleteNote(data, getRequestHeaders()))

export const updateNoteCommentFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateNoteCommentInput>) => UpdateNoteCommentInput.parse(data))
  .handler(async ({ data }) => updateNoteComment(data, getRequestHeaders()))

export const deleteNoteCommentFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof DeleteNoteCommentInput>) => DeleteNoteCommentInput.parse(data))
  .handler(async ({ data }) => deleteNoteComment(data, getRequestHeaders()))

// Note folders ("Ordner")
export const getNoteFoldersForRegionFn = createServerFn({ method: 'GET' })
  .validator(RegionSlug)
  .handler(async ({ data }) => getNoteFoldersForRegion(data, getRequestHeaders()))

const CreateNoteFolderInput = RegionSlug.extend({ name: z.string().trim().min(1) })
export const createNoteFolderFn = createServerFn({ method: 'POST' })
  .validator(CreateNoteFolderInput)
  .handler(async ({ data }) => createNoteFolder(data, getRequestHeaders()))

// Members may only rename. Region links are admin-only (`updateNoteFolderForAdminFn`).
const UpdateNoteFolderInput = FolderInRegion.extend({ name: z.string().trim().min(1) })
export const updateNoteFolderFn = createServerFn({ method: 'POST' })
  .validator(UpdateNoteFolderInput)
  .handler(async ({ data }) => updateNoteFolder(data, getRequestHeaders()))

export const deleteNoteFolderFn = createServerFn({ method: 'POST' })
  .validator(FolderInRegion)
  .handler(async ({ data }) => deleteNoteFolder(data, getRequestHeaders()))

const MoveNoteToFolderInput = RegionSlug.extend({ noteId: z.number(), folderId: z.number() })
export const moveNoteToFolderFn = createServerFn({ method: 'POST' })
  .validator(MoveNoteToFolderInput)
  .handler(async ({ data }) => moveNoteToFolder(data, getRequestHeaders()))

// Admin folder mutations
export const updateNoteFolderForAdminFn = createServerFn({ method: 'POST' })
  .validator((data: { id: number } & z.input<typeof UpdateNoteFolderFormSchema>) => {
    const { id, ...rest } = data
    const config = UpdateNoteFolderFormSchema.parse(rest)
    return { id, ...config }
  })
  .handler(async ({ data }) => {
    const { id, ...config } = data
    return updateNoteFolderForAdmin(id, config, getRequestHeaders())
  })

export const deleteNoteFolderForAdminFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof DeleteNoteFolderSchema>) => DeleteNoteFolderSchema.parse(data))
  .handler(async ({ data }) => deleteNoteFolderForAdmin(data, getRequestHeaders()))
