import { createFileRoute } from '@tanstack/react-router'
import { PageDataSchema } from '@/components/admin/data-schema/PageDataSchema'
import { dataSchemaOverviewQueryOptions } from '@/server/dataSchema/dataSchemaOverviewQueryOptions'

export const Route = createFileRoute('/admin/data-schema')({
  ssr: true,
  // Awaited so the SSR markup already has the data (an un-awaited prefetch rendered the spinner on
  // the server but the streamed data on the client → hydration mismatch).
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(dataSchemaOverviewQueryOptions())
  },
  head: () => ({
    meta: [{ title: 'Data-Schema – ADMIN TILDA' }],
  }),
  component: PageDataSchema,
})
