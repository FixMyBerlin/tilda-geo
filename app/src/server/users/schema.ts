import { z } from 'zod'

export const UpdateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  osmDescription: z.string().nullish(),
})

export const UpdateOsmDescription = z.object({
  osmDescription: z.string(),
})

export const AccessedRegionSchema = z.object({
  slug: z.string(),
  lastAccessedDay: z.number().transform((val) => new Date(val)), // UTC timestamp (milliseconds) -> Date object
})

export const AccessedRegionsSchema = z.array(AccessedRegionSchema).default([])

export type AccessedRegionType = z.infer<typeof AccessedRegionSchema>
