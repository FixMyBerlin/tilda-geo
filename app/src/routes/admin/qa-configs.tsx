import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/qa-configs')({
  ssr: true,
  component: () => <Outlet />,
})
