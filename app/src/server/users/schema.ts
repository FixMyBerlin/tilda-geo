import { z } from 'zod'
import { isOsmPlaceholderEmail } from '@/components/shared/utils/osmPlaceholderEmail'

export const nullishString = z
  .string()
  .transform((v) => (v === '' ? null : v))
  .nullish()

const updateUserFieldsSchema = z.object({
  email: z.email(),
  firstName: nullishString,
  lastName: nullishString,
  osmDescription: nullishString,
})

function rejectOsmPlaceholderEmail(
  data: { email: string },
  ctx: { addIssue: (issue: { code: 'custom'; message: string; path: ['email'] }) => void },
) {
  if (isOsmPlaceholderEmail(data.email)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Bitte eine echte Kontakt-E-Mail-Adresse angeben.',
      path: ['email'],
    })
  }
}

export const UpdateUserSchema = updateUserFieldsSchema.superRefine(rejectOsmPlaceholderEmail)

export const ContactProfilePromptFormSchema = updateUserFieldsSchema
  .omit({ osmDescription: true })
  .superRefine(rejectOsmPlaceholderEmail)

export const UpdateOsmDescription = z.object({
  osmDescription: z.string(),
})

export const AccessedRegionSchema = z.object({
  slug: z.string(),
  lastAccessedDay: z.number().transform((val) => new Date(val)), // UTC timestamp (milliseconds) -> Date object
})

export const AccessedRegionsSchema = z.array(AccessedRegionSchema).default([])

export type AccessedRegionType = z.infer<typeof AccessedRegionSchema>
