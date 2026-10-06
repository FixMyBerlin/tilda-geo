import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageRegionContracts } from '@/components/admin/region-contracts/PageRegionContracts'
import { optionalSearchString } from '@/lib/searchParamsSchema'
import { getAdminRegionContractsLoaderFn } from '@/server/admin/admin.functions'

// `q`: list search (`AdminSearchField`).
const regionContractsListSearchSchema = z.object({ q: optionalSearchString() })

export const Route = createFileRoute('/admin/region-contracts/')({
  ssr: true,
  validateSearch: (search) => regionContractsListSearchSchema.parse(search),
  loader: async () => await getAdminRegionContractsLoaderFn(),
  head: () => ({
    meta: [{ title: 'Regionen-Aufträge – ADMIN TILDA' }],
  }),
  component: PageRegionContracts,
})
