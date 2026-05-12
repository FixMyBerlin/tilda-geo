import { createFileRoute } from '@tanstack/react-router'
import { PageStaticDatasetCategoryEdit } from '@/components/admin/static-dataset-categories/PageStaticDatasetCategoryEdit'
import { getStaticDatasetCategoryAdminOneFn } from '@/server/static-dataset-categories/staticDatasetCategories.functions'

export const Route = createFileRoute('/admin/static-dataset-categories/$categoryKey')({
  ssr: true,
  loader: async ({ params }) => {
    return await getStaticDatasetCategoryAdminOneFn({
      data: { categoryKey: params.categoryKey },
    })
  },
  head: () => ({
    meta: [{ title: 'Kategorie bearbeiten – ADMIN TILDA' }],
  }),
  component: PageStaticDatasetCategoryEdit,
})
