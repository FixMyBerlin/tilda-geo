import { getRouteApi } from '@tanstack/react-router'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminSearchField, useAdminSearchQuery } from '@/components/admin/AdminSearchField'
import { Link } from '@/components/shared/links/Link'
import { filterRegionsByContractSearch } from '@/server/region-contracts/regionContracts.utils'
import { buildRegionContractFilterItems } from './pageRegions/buildRegionContractFilterItems'
import { RegionContractFilterRow } from './pageRegions/RegionContractFilterRow'
import { RegionsTable } from './pageRegions/RegionsTable'

const routeApi = getRouteApi('/admin/regions/')

export function PageRegions() {
  const { regions } = routeApi.useLoaderData()
  const { contract = '' } = routeApi.useSearch()
  const query = useAdminSearchQuery().toLowerCase()

  const filterItems = buildRegionContractFilterItems(regions)
  const contractRegions = filterRegionsByContractSearch(regions, contract ?? '')
  const filteredRegions = query
    ? contractRegions.filter((region) =>
        [region.slug, region.name, region.fullName].some((value) =>
          value?.toLowerCase().includes(query),
        ),
      )
    : contractRegions

  return (
    <>
      <AdminPageHeader
        title="Regionen"
        action={
          <Link to="/admin/regions/new" button>
            Neue Region
          </Link>
        }
      />

      <div className="mb-6 space-y-3">
        <AdminSearchField label="Regionen durchsuchen" placeholder="Name oder Slug …" />
        <RegionContractFilterRow items={filterItems} activeId={contract ?? ''} regions={regions} />
      </div>

      {filteredRegions.length === 0 ? (
        <AdminEmptyState>
          {regions.length === 0
            ? 'Noch keine Regionen vorhanden.'
            : 'Keine Regionen für diesen Filter.'}
        </AdminEmptyState>
      ) : (
        <RegionsTable regions={filteredRegions} showContractGroups={!contract && !query} />
      )}
    </>
  )
}
