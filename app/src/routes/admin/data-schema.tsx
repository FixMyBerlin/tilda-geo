import { createFileRoute } from '@tanstack/react-router'
import { PageDataSchema } from '@/components/admin/data-schema/PageDataSchema'
import { dataSchemaOverviewQueryOptions } from '@/server/dataSchema/dataSchemaOverviewQueryOptions'

export const Route = createFileRoute('/admin/data-schema')({
  ssr: true,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(dataSchemaOverviewQueryOptions())
  },
  head: () => ({
    meta: [{ title: 'Data-Schema – ADMIN TILDA' }],
  }),
  component: PageDataSchema,
})
