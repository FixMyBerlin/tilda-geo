import { z } from 'zod'

const nullishString = z
  .string()
  .transform((v) => (v === '' ? null : v))
  .nullish()

export const UpdateUserSchema = z.object({
  email: z.email(),
  firstName: nullishString,
  lastName: nullishString,
  osmDescription: nullishString,
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
