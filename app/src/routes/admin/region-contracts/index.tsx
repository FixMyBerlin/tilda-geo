import { createFileRoute } from '@tanstack/react-router'
import { PageRegionContracts } from '@/components/admin/region-contracts/PageRegionContracts'
import { getAdminRegionContractsLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/region-contracts/')({
  ssr: true,
  loader: async () => await getAdminRegionContractsLoaderFn(),
  head: () => ({
    meta: [{ title: 'Regionen-Aufträge – ADMIN TILDA' }],
  }),
  component: PageRegionContracts,
})
