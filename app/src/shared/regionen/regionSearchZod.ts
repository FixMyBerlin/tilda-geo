import { z } from 'zod'

export const zodInternalNotesFilterParam = z.object({
  query: z.string().optional().nullable(),
  completed: z.boolean().optional().nullable(),
  user: z.string().optional().nullable(),
  commented: z.boolean().optional().nullable(),
  notReacted: z.boolean().optional().nullable(),
})
