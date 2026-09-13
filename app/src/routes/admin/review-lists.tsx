import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/review-lists')({
  ssr: true,
  component: () => <Outlet />,
})
