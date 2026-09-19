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
  folderId: z.number(),
  author: Author,
  subject: z.string(),
  body: z.string().nullable(),
  resolvedAt: z.coerce.date().nullable(),
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

// Admin: note folder region assignment (mirrors app/src/server/review-lists/schemas.ts)

const NoteFolderConfigSchema = z.object({
  name: z.string().trim().min(1),
  regionSlugs: z.array(z.string().min(1)).min(1, 'Mindestens eine Region auswählen'),
})

export type NoteFolderConfigInput = z.infer<typeof NoteFolderConfigSchema>

const NoteFolderFormRawSchema = z.object({
  name: z.string().trim().min(1),
  regionSlugs: z.array(z.string()),
})

export type NoteFolderFormInput = z.input<typeof NoteFolderFormRawSchema>

const NoteFolderFormSchema = NoteFolderFormRawSchema.transform((form): NoteFolderConfigInput => ({
  name: form.name,
  regionSlugs: [...new Set(form.regionSlugs.filter(Boolean))],
})).pipe(NoteFolderConfigSchema)

export const UpdateNoteFolderFormSchema = NoteFolderFormSchema

export const DeleteNoteFolderSchema = z.object({
  id: z.number(),
})

export function noteFolderConfigToFormValues(config: NoteFolderConfigInput) {
  return {
    name: config.name,
    regionSlugs: config.regionSlugs,
  }
}
