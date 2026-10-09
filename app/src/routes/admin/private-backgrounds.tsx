import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/private-backgrounds')({
  ssr: true,
  component: () => <Outlet />,
})
