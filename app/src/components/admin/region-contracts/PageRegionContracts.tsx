import { getRouteApi } from '@tanstack/react-router'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminSearchField, useAdminSearchQuery } from '@/components/admin/AdminSearchField'
import { Link } from '@/components/shared/links/Link'
import { RegionContractsTable } from './pageRegionContracts/RegionContractsTable'

const routeApi = getRouteApi('/admin/region-contracts/')

export function PageRegionContracts() {
  const { contracts } = routeApi.useLoaderData()
  const query = useAdminSearchQuery().toLowerCase()

  const filteredContracts = query
    ? contracts.filter((contract) =>
        [contract.slug, contract.name].some((value) => value.toLowerCase().includes(query)),
      )
    : contracts

  return (
    <>
      <AdminPageHeader
        title="Regionen-Aufträge"
        action={
          <Link to="/admin/region-contracts/new" button>
            Neuer Auftrag
          </Link>
        }
      />

      {contracts.length > 0 ? (
        <div className="mb-6">
          <AdminSearchField label="Aufträge durchsuchen" placeholder="Name oder Slug …" />
        </div>
      ) : null}

      {filteredContracts.length === 0 ? (
        <AdminEmptyState>
          {contracts.length === 0
            ? 'Noch keine Aufträge vorhanden.'
            : 'Keine Aufträge für diesen Filter.'}
        </AdminEmptyState>
      ) : (
        <RegionContractsTable contracts={filteredContracts} />
      )}
    </>
  )
}
