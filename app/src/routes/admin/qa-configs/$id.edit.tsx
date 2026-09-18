import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { PageQaConfigEdit } from '@/components/admin/qa-configs/PageQaConfigEdit'
import { getAdminQaConfigEditLoaderFn } from '@/server/admin/admin.functions'
import { createPageSearchSchema, pageSearchDefaults } from '@/shared/pagination/pageSearchSchema'

export const Route = createFileRoute('/admin/qa-configs/$id/edit')({
  ssr: true,
  // `page`/`pageSize` of the orphaned-evaluations table.
  validateSearch: createPageSearchSchema(),
  search: { middlewares: [stripSearchParams(pageSearchDefaults)] },
  loaderDeps: ({ search }) => ({ page: search.page, pageSize: search.pageSize }),
  loader: async ({ params, deps }) =>
    getAdminQaConfigEditLoaderFn({ data: { id: Number(params.id), ...deps } }),
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] }
    return {
      meta: [{ title: `${loaderData.qaConfig.label} bearbeiten – ADMIN TILDA` }],
    }
  },
  component: PageQaConfigEdit,
})
