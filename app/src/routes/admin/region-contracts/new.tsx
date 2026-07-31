import { createFileRoute } from '@tanstack/react-router'
import { PageRegionContractsNew } from '@/components/admin/region-contracts/PageRegionContractsNew'
import { getAdminRegionContractNewLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/region-contracts/new')({
  ssr: true,
  loader: async () => await getAdminRegionContractNewLoaderFn(),
  head: () => ({
    meta: [{ title: 'Neuer Auftrag – ADMIN TILDA' }],
  }),
  component: PageRegionContractsNew,
})
