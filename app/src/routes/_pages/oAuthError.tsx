import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageOAuthError } from '@/components/pages/oAuthError/PageOAuthError'
import { optionalSearchString } from '@/lib/searchParamsSchema'

const searchSchema = z.object({
  error: optionalSearchString(),
  error_description: optionalSearchString(),
})

export const Route = createFileRoute('/_pages/oAuthError')({
  ssr: true,
  validateSearch: (search) => searchSchema.parse(search),
  component: PageOAuthError,
})
