import { twMerge } from 'tailwind-merge'
import {
  groupRegionsByContract,
  SINGLETON_CONTRACT_PARAM,
  UNASSIGNED_CONTRACT_GROUP_LABEL,
} from '@/server/region-contracts/regionContracts.utils'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { RegionTeaser } from './RegionTeaser'

type Props = {
  nonPublicRegions: TRegion[]
}

const partitionNonPublicRegions = (regions: TRegion[]) => {
  const active = regions.filter((r) => r.status !== 'DEACTIVATED')
  const deactivated = regions.filter((r) => r.status === 'DEACTIVATED')

  return { active, deactivated }
}

const RegionTeaserGrid = ({ regions, className }: { regions: TRegion[]; className?: string }) => (
  <div
    className={twMerge(
      'my-10 grid grid-cols-2 border-t border-l border-gray-200 sm:mx-0 md:grid-cols-3 lg:grid-cols-4',
      className,
    )}
  >
    {regions.map((region) => (
      <RegionTeaser key={region.slug} region={region} />
    ))}
  </div>
)

const RegionTeaserGrouped = ({ regions }: { regions: TRegion[] }) => {
  const groups = groupRegionsByContract(regions)

  return (
    <div className="space-y-8">
      {groups.map(({ contract, regions: contractRegions }) => (
        <section key={contract?.slug ?? SINGLETON_CONTRACT_PARAM}>
          <h3 className="px-4 text-lg font-semibold text-gray-800 sm:px-0">
            {contract?.name ?? UNASSIGNED_CONTRACT_GROUP_LABEL}
          </h3>
          <RegionTeaserGrid regions={contractRegions} />
        </section>
      ))}
    </div>
  )
}

export const RegionListAdmins = ({ nonPublicRegions }: Props) => {
  if (nonPublicRegions.length === 0) return null

  const { active, deactivated } = partitionNonPublicRegions(nonPublicRegions)

  return (
    <div className="bg-pink-200">
      <div className="mx-auto w-full max-w-7xl min-w-0 overflow-hidden sm:px-6 lg:px-8">
        {active.length > 0 && (
          <>
            <div className="prose mt-5 px-4 sm:px-0">
              <h2>Nicht öffentliche Regionen</h2>
              <p className="text-sm text-gray-700">
                Regionen, die nicht in der öffentlichen Übersicht erscheinen — privat, nicht
                gelistet oder beides.
              </p>
            </div>
            <RegionTeaserGrouped regions={active} />
          </>
        )}

        {deactivated.length > 0 && (
          <>
            <div className="prose mt-8 px-4 sm:px-0">
              <h2 className="text-gray-600">Deaktivierte Regionen</h2>
              <p className="text-sm text-gray-600">
                Diese Regionen sind nicht mehr aktiv und können nicht mehr verwendet werden.
              </p>
            </div>
            <div className="opacity-60">
              <RegionTeaserGrouped regions={deactivated} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
