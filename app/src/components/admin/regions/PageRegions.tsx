import { getRouteApi } from '@tanstack/react-router'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { adminHeaderActionButtonClassName, HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { Link } from '@/components/shared/links/Link'
import { filterRegionsByContractSearch } from '@/server/region-contracts/regionContracts.utils'
import { buildRegionContractFilterItems } from './pageRegions/buildRegionContractFilterItems'
import { RegionContractFilterRow } from './pageRegions/RegionContractFilterRow'
import { RegionsTable } from './pageRegions/RegionsTable'

const routeApi = getRouteApi('/admin/regions/')

export function PageRegions() {
  const { regions } = routeApi.useLoaderData()
  const { contract = '' } = routeApi.useSearch()

  const filterItems = buildRegionContractFilterItems(regions)
  const filteredRegions = filterRegionsByContractSearch(regions, contract ?? '')

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/regions', name: 'Regionen' }]} />
        <Link to="/admin/regions/new" button className={adminHeaderActionButtonClassName}>
          Neue Region
        </Link>
      </HeaderWrapper>

      <div className="mb-6">
        <RegionContractFilterRow items={filterItems} activeId={contract ?? ''} regions={regions} />
      </div>

      <RegionsTable regions={filteredRegions} showContractGroups={!contract} />
    </>
  )
}
