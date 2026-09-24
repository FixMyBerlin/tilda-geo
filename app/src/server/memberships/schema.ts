import { z } from 'zod'

export const MembershipSchema = z.object({
  userId: z.string().min(1, { message: 'Bitte einen User wählen.' }),
  role: z.enum(['USER', 'ADMIN'], { message: 'Bitte eine Rolle wählen.' }),
  // Empty string = "keine Region hinzufügen" (e.g. when only the role changes)
  regionId: z
    .string()
    .transform((value) => (value === '' ? undefined : Number(value)))
    .pipe(z.number().int().positive({ message: 'Bitte eine Region wählen.' }).optional()),
})

export type MembershipParsed = z.infer<typeof MembershipSchema>
