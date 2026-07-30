import { z } from 'zod'

export const zodInternalNotesFilterParam = z.object({
  query: z.string().optional().nullable(),
  completed: z.boolean().optional().nullable(),
  user: z.string().optional().nullable(),
  commented: z.boolean().optional().nullable(),
  notReacted: z.boolean().optional().nullable(),
})

export const zodOsmFilterParam = z.object({
  query: z.string().optional().nullable(),
  completed: z.boolean().optional().nullable(),
  user: z.string().optional().nullable(),
  commented: z.boolean().optional().nullable(),
})

export const zodQaFilterParam = z.object({
  users: z.array(z.string()).optional().nullable(),
})
