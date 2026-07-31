import { createFileRoute, Outlet } from '@tanstack/react-router'
import { regionContractsSearchSchema } from '@/lib/regionContractsSearchSchema'

export const Route = createFileRoute('/admin/regions')({
  ssr: true,
  validateSearch: (search) => regionContractsSearchSchema.parse(search),
  component: () => <Outlet />,
})
