import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageOAuthError } from '@/components/pages/oAuthError/PageOAuthError'

const searchSchema = z.object({
  error: z.string().nullish().catch(null),
  error_description: z.string().nullish().catch(null),
})

export const Route = createFileRoute('/_pages/oAuthError')({
  ssr: true,
  validateSearch: (search) => searchSchema.parse(search),
  component: PageOAuthError,
})
