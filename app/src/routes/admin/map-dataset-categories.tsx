import { createFileRoute, Outlet } from '@tanstack/react-router'
import { mapDatasetCategoriesSearchSchema } from '@/lib/mapDatasetCategoriesSearchSchema'

export const Route = createFileRoute('/admin/map-dataset-categories')({
  ssr: true,
  validateSearch: (search) => mapDatasetCategoriesSearchSchema.parse(search),
  component: () => <Outlet />,
})
