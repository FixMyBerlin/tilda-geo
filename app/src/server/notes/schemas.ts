import { z } from 'zod'

const Author = z.object({
  id: z.string(), // Now String (cuid) instead of number
  osmName: z.string(),
  // osmAvatar: z.string().nullable(), // Not used ATM
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  role: z.enum(['ADMIN', 'USER']),
})

export const NoteAndCommentsSchema = z.object({
  id: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  userId: z.string(), // Now String (cuid) instead of number
  author: Author,
  subject: z.string(),
  body: z.string().nullable(),
  resolvedAt: z.union([z.null(), z.coerce.date()]),
  latitude: z.number(),
  longitude: z.number(),
  noteComments: z
    .array(
      z.object({
        id: z.number(),
        noteId: z.number(),
        createdAt: z.coerce.date(),
        updatedAt: z.coerce.date(),
        author: Author,
        body: z.string(),
      }),
    )
    .optional(),
})

export const CreateNoteSchema = z.object({
  // id: z.number(),
  // createdAt: z.string(),
  // updatedAt: z.string(),
  // userId: z.number(),
  // regionId: z.number(),
  subject: z.string(),
  body: z.string().optional(),
  // resolvedAt: z.date(),
  latitude: z.number(),
  longitude: z.number(),
})

export const CreateNoteCommentSchema = z.object({
  // id: z.string(),
  // createdAt: z.string(),
  // updatedAt: z.string(),
  // userId: z.number(),
  noteId: z.number(),
  body: z.string(),
})
