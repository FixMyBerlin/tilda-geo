import { z } from 'zod'

const UploadSchema = z.object({
  id: z.number(),
  slug: z.string(),
  url: z.url(),
  public: z.boolean(),
})

export const GetUploadSchema = UploadSchema.pick({ slug: true })
