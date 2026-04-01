import { z } from 'zod'

export const UploadSchema = z.object({
  id: z.number(),
  slug: z.string(),
  url: z.url(),
  public: z.boolean(),
})

export const GetUploadSchema = UploadSchema.pick({ slug: true })

export const DeleteUploadSchema = UploadSchema.pick({ id: true })

export const UpdateUploadSchema = UploadSchema.pick({ id: true, public: true }).extend({
  regions: z.array(z.number()),
})

export const UploadFormSchema = z.object({
  regions: z
    .union([z.undefined(), z.boolean(), z.array(z.coerce.number())])
    .transform((v) => v || []),
  public: z.string().transform((v) => JSON.parse(v)),
})
