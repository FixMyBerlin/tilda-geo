import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/regionen')({
  ssr: true,
  component: () => <Outlet />,
})
