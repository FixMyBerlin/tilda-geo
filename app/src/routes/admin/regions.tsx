import { createFileRoute, Outlet } from '@tanstack/react-router'
import { regionContractsSearchSchema } from '@/lib/regionContractsSearchSchema'
import { optionalSearchString } from '@/lib/searchParamsSchema'

// `q`: list search (`AdminSearchField`).
const regionsSearchSchema = regionContractsSearchSchema.extend({ q: optionalSearchString() })

export const Route = createFileRoute('/admin/regions')({
  ssr: true,
  validateSearch: (search) => regionsSearchSchema.parse(search),
  component: () => <Outlet />,
})
