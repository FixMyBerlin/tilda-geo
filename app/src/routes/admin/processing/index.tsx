import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { PageProcessing } from '@/components/admin/processing/PageProcessing'
import { getAdminProcessingOverviewLoaderFn } from '@/server/processing/processing.functions'
import { createPageSearchSchema, pageSearchDefaults } from '@/shared/pagination/pageSearchSchema'

export const Route = createFileRoute('/admin/processing/')({
  ssr: true,
  validateSearch: createPageSearchSchema(),
  search: { middlewares: [stripSearchParams(pageSearchDefaults)] },
  loaderDeps: ({ search }) => ({ page: search.page, pageSize: search.pageSize }),
  loader: async ({ deps }) => {
    return await getAdminProcessingOverviewLoaderFn({ data: deps })
  },
  head: () => ({
    meta: [{ title: 'Processing – ADMIN TILDA' }],
  }),
  component: PageProcessing,
})
