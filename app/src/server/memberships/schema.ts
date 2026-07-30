import { z } from 'zod'

export const MembershipSchema = z.object({
  userId: z.string().min(1, { message: 'Bitte einen User wählen.' }),
  regionId: z
    .string()
    .min(1, { message: 'Bitte eine Region wählen.' })
    .transform((value) => Number(value))
    .pipe(z.number().int().positive({ message: 'Bitte eine Region wählen.' })),
})

export type MembershipParsed = z.infer<typeof MembershipSchema>
