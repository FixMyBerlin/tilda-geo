import { createFileRoute } from '@tanstack/react-router'
import { PageApiTokens } from '@/components/admin/api-tokens/PageApiTokens'
import { getAdminApiTokensLoaderFn } from '@/server/admin/adminApiTokens.functions'

export const Route = createFileRoute('/admin/api-tokens')({
  ssr: true,
  loader: async () => await getAdminApiTokensLoaderFn(),
  head: () => ({
    meta: [{ title: 'API-Tokens – ADMIN TILDA' }],
  }),
  component: PageApiTokens,
})
