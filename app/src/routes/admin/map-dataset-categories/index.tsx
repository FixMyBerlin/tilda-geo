import { createFileRoute } from '@tanstack/react-router'
import { PageMapDatasetCategories } from '@/components/admin/map-dataset-categories/PageMapDatasetCategories'
import { getMapDatasetCategoriesAdminListFn } from '@/server/map-dataset-categories/mapDatasetCategories.functions'

export const Route = createFileRoute('/admin/map-dataset-categories/')({
  ssr: true,
  loader: async () => {
    return await getMapDatasetCategoriesAdminListFn()
  },
  head: () => ({
    meta: [{ title: 'Statische Daten: Kategorien – ADMIN TILDA' }],
  }),
  component: PageMapDatasetCategories,
})
