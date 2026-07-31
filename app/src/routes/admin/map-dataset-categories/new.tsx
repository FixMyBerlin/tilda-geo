import { createFileRoute } from '@tanstack/react-router'
import { PageMapDatasetCategoryNew } from '@/components/admin/map-dataset-categories/PageMapDatasetCategoryNew'

export const Route = createFileRoute('/admin/map-dataset-categories/new')({
  ssr: true,
  head: () => ({
    meta: [{ title: 'Statische Daten: Neue Kategorie – ADMIN TILDA' }],
  }),
  component: PageMapDatasetCategoryNew,
})
