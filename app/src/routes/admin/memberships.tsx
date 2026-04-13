import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/memberships')({
  ssr: true,
  component: () => <Outlet />,
})
