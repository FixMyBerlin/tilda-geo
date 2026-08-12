import { createFileRoute } from '@tanstack/react-router'
import { PageDataSchema } from '@/components/admin/data-schema/PageDataSchema'
import { getDataSchemaOverviewLoaderFn } from '@/server/dataSchema/dataSchema.functions'

export const Route = createFileRoute('/admin/data-schema')({
  ssr: true,
  loader: async () => await getDataSchemaOverviewLoaderFn(),
  head: () => ({
    meta: [{ title: 'Data-Schema – ADMIN TILDA' }],
  }),
  component: PageDataSchema,
})
