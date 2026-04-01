import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/regions')({
  ssr: true,
  component: () => <Outlet />,
})
