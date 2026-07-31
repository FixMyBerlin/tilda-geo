import { createFileRoute } from '@tanstack/react-router'
import { PageQaConfigEdit } from '@/components/admin/qa-configs/PageQaConfigEdit'
import { getAdminQaConfigEditLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/qa-configs/$id/edit')({
  ssr: true,
  loader: async ({ params }) => {
    return await getAdminQaConfigEditLoaderFn({ data: { id: Number(params.id) } })
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] }
    return {
      meta: [{ title: `${loaderData.qaConfig.label} bearbeiten – ADMIN TILDA` }],
    }
  },
  component: PageQaConfigEdit,
})
