import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/region-contracts')({
  ssr: true,
  component: () => <Outlet />,
})
