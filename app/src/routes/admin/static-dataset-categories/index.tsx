import { createFileRoute } from '@tanstack/react-router'
import { PageStaticDatasetCategories } from '@/components/admin/static-dataset-categories/PageStaticDatasetCategories'
import { getStaticDatasetCategoriesAdminListFn } from '@/server/static-dataset-categories/staticDatasetCategories.functions'

export const Route = createFileRoute('/admin/static-dataset-categories/')({
  ssr: true,
  loader: async () => {
    return await getStaticDatasetCategoriesAdminListFn()
  },
  head: () => ({
    meta: [{ title: 'Statische Datensatz-Kategorien – ADMIN TILDA' }],
  }),
  component: PageStaticDatasetCategories,
})
