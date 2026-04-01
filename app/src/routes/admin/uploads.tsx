import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/uploads')({
  ssr: true,
  component: () => <Outlet />,
})
