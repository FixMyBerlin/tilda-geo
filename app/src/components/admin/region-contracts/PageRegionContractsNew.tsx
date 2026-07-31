import { getRouteApi } from '@tanstack/react-router'
import { AdminPageTitleNew, AdminPageTitleNewLabel } from '@/components/admin/adminPageTitle'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { createRegionContractFn } from '@/server/region-contracts/region-contracts.functions'
import { CreateRegionContractFormSchema } from '@/server/region-contracts/regionContractSchema'
import {
  regionContractFormEmptyDefaults,
  RegionContractForm,
} from './pageRegionContracts/RegionContractForm'

const routeApi = getRouteApi('/admin/region-contracts/new')

export function PageRegionContractsNew() {
  const { regions } = routeApi.useLoaderData()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/region-contracts', name: 'Regionen-Aufträge' },
            {
              href: '/admin/region-contracts/new',
              name: <AdminPageTitleNewLabel label="Neuer Auftrag" variant="breadcrumb" />,
            },
          ]}
        />
      </HeaderWrapper>

      <AdminPageTitleNew label="Neuer Auftrag" />

      <RegionContractForm
        schema={CreateRegionContractFormSchema}
        defaultValues={regionContractFormEmptyDefaults}
        submitLabel="Auftrag anlegen"
        regions={regions.map((r) => ({
          slug: r.slug,
          name: r.name,
          contract: r.contract ? { id: r.contract.id, name: r.contract.name } : null,
        }))}
        onSubmit={async (values) => createRegionContractFn({ data: values })}
      />
    </>
  )
}
