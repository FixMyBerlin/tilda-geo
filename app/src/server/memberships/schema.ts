import { z } from 'zod'

export const MembershipSchema = z.object({
  userId: z.string().min(1, { message: 'Bitte einen User wählen.' }),
  regionId: z.coerce
    .number()
    .pipe(z.number().int().positive({ message: 'Bitte eine Region wählen.' })),
})

export type MembershipParsed = z.infer<typeof MembershipSchema>
