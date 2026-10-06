import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/note-folders')({
  ssr: true,
  component: () => <Outlet />,
})
