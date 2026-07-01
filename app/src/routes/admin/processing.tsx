import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/processing')({
  ssr: true,
  component: () => <Outlet />,
})
