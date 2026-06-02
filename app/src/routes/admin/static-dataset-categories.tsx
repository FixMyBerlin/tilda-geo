import { createFileRoute, Outlet } from '@tanstack/react-router'
import { staticDatasetCategoriesSearchSchema } from '@/lib/staticDatasetCategoriesSearchSchema'

export const Route = createFileRoute('/admin/static-dataset-categories')({
  ssr: true,
  validateSearch: (search) => staticDatasetCategoriesSearchSchema.parse(search),
  component: () => <Outlet />,
})
