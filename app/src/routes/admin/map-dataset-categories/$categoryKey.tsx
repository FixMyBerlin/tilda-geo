import { createFileRoute } from '@tanstack/react-router'
import { PageMapDatasetCategoryEdit } from '@/components/admin/map-dataset-categories/PageMapDatasetCategoryEdit'
import { getMapDatasetCategoryAdminOneFn } from '@/server/map-dataset-categories/mapDatasetCategories.functions'

export const Route = createFileRoute('/admin/map-dataset-categories/$categoryKey')({
  ssr: true,
  loader: async ({ params }) => {
    return await getMapDatasetCategoryAdminOneFn({
      data: { categoryKey: params.categoryKey },
    })
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] }
    return {
      meta: [{ title: `${loaderData.category.title} bearbeiten – ADMIN TILDA` }],
    }
  },
  component: PageMapDatasetCategoryEdit,
})
