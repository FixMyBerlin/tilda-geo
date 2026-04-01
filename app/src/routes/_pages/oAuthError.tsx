import { createFileRoute } from '@tanstack/react-router'
import { PageOAuthError } from '@/components/pages/oAuthError/PageOAuthError'

export const Route = createFileRoute('/_pages/oAuthError')({
  ssr: true,
  validateSearch: (search: Record<string, unknown>) => ({
    error: (search.error as string) || undefined,
  }),
  component: PageOAuthError,
})
