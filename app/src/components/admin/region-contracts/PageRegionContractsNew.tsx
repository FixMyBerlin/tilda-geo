import { getRouteApi } from '@tanstack/react-router'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { RegionContractForm } from './pageRegionContracts/RegionContractForm'

const routeApi = getRouteApi('/admin/region-contracts/new')

export function PageRegionContractsNew() {
  const { regions } = routeApi.useLoaderData()

  return (
    <>
      <AdminPageHeader
        title="Neuer Auftrag"
        parent={{ label: 'Regionen-Aufträge', to: '/admin/region-contracts' }}
      />
      <RegionContractForm
        mode="create"
        regions={regions.map((r) => ({
          slug: r.slug,
          name: r.name,
          contract: r.contract ? { id: r.contract.id, name: r.contract.name } : null,
        }))}
      />
    </>
  )
}
