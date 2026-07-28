import { createFileRoute, notFound } from '@tanstack/react-router'
import { PageProcessingRunDetail } from '@/components/admin/processing/PageProcessingRunDetail'
import { getAdminProcessingRunDetailLoaderFn } from '@/server/processing/processing.functions'

export const Route = createFileRoute('/admin/processing/$metaId')({
  ssr: true,
  loader: async ({ params }) => {
    const metaId = Number(params.metaId)
    if (!Number.isInteger(metaId) || metaId <= 0) {
      throw notFound()
    }
    return await getAdminProcessingRunDetailLoaderFn({ data: { metaId } })
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] }
    return {
      meta: [{ title: `Processing Run #${loaderData.run.id} – ADMIN TILDA` }],
    }
  },
  component: PageProcessingRunDetail,
})
