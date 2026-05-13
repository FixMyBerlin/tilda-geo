import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/static-dataset-categories')({
  ssr: true,
  component: () => <Outlet />,
})
