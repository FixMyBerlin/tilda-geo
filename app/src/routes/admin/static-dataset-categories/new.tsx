import { createFileRoute } from '@tanstack/react-router'
import { PageStaticDatasetCategoryNew } from '@/components/admin/static-dataset-categories/PageStaticDatasetCategoryNew'

export const Route = createFileRoute('/admin/static-dataset-categories/new')({
  ssr: true,
  head: () => ({
    meta: [{ title: 'Neue statische Datensatz-Kategorie – ADMIN TILDA' }],
  }),
  component: PageStaticDatasetCategoryNew,
})
