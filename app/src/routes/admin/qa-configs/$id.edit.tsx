import { createFileRoute } from '@tanstack/react-router'
import { PageQaConfigEdit } from '@/components/admin/qa-configs/PageQaConfigEdit'
import { getAdminQaConfigEditLoaderFn } from '@/server/admin/admin.functions'
import { createOffsetSearchSchema } from '@/shared/pagination/offsetSearchSchema'

const qaConfigEditSearchSchema = createOffsetSearchSchema({ maxTake: 200 })

export const Route = createFileRoute('/admin/qa-configs/$id/edit')({
  ssr: true,
  validateSearch: (search) => qaConfigEditSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({
    skip: search.skip,
    take: search.take,
  }),
  loader: async ({ params, deps }) => {
    return await getAdminQaConfigEditLoaderFn({
      data: { id: Number(params.id), ...deps },
    })
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] }
    return {
      meta: [{ title: `${loaderData.qaConfig.label} bearbeiten – ADMIN TILDA` }],
    }
  },
  component: PageQaConfigEdit,
})
