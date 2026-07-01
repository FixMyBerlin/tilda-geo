import { createFileRoute } from '@tanstack/react-router'
import { PageProcessing } from '@/components/admin/processing/PageProcessing'
import { getAdminProcessingOverviewLoaderFn } from '@/server/processing/processing.functions'

export const Route = createFileRoute('/admin/processing/')({
  ssr: true,
  loader: async () => {
    return await getAdminProcessingOverviewLoaderFn()
  },
  head: () => ({
    meta: [{ title: 'Processing – ADMIN TILDA' }],
  }),
  component: PageProcessing,
})
