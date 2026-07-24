import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/map-dataset-uploads')({
  ssr: true,
  component: () => <Outlet />,
})
