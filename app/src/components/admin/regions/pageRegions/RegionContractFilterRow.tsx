import { FilterRow } from '@/components/shared/FilterRow/FilterRow'
import type { FilterRowItem } from '@/components/shared/FilterRow/types'
import { Link } from '@/components/shared/links/Link'
import { filterChipStyles, filterChipStylesActive } from '@/components/shared/links/styles'
import { RegionContractStatus } from '@/prisma/generated/browser'
import {
  collectUniqueContractsFromRegions,
  getMultiRegionContracts,
  SINGLETON_CONTRACT_PARAM,
} from '@/server/region-contracts/regionContracts.utils'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { buildRegionContractsListSearch } from './regionContractsListSearch'

type Props = {
  items: FilterRowItem[]
  activeId: string
  regions: TRegion[]
}

export function RegionContractFilterRow({ items, activeId, regions }: Props) {
  const multi = getMultiRegionContracts(collectUniqueContractsFromRegions(regions))
  const inactiveMulti = multi.filter((c) => c.status === RegionContractStatus.INACTIVE)

  const activeItems = items.filter(
    (item) =>
      item.id === '' ||
      item.id === SINGLETON_CONTRACT_PARAM ||
      multi.some((c) => c.slug === item.id && c.status === RegionContractStatus.ACTIVE),
  )

  const inactiveItems = items.filter((item) => inactiveMulti.some((c) => c.slug === item.id))

  return (
    <div className="space-y-3">
      <FilterRow
        items={activeItems}
        activeId={activeId}
        to="/admin/regions"
        buildSearch={buildRegionContractsListSearch}
        ariaLabel="Aufträge"
      />
      {inactiveItems.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-gray-700">Inaktive Aufträge</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {inactiveItems.map((item) => (
              <Link
                key={item.id}
                to="/admin/regions"
                search={buildRegionContractsListSearch(item.id)}
                className={activeId === item.id ? filterChipStylesActive : filterChipStyles}
              >
                {item.label}
                {item.count != null ? ` (${item.count})` : ''}
              </Link>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
