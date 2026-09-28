import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/users')({
  ssr: true,
  component: () => <Outlet />,
})
