import { twMerge } from 'tailwind-merge'
import type { RegionWithAdditionalData } from '@/server/regions/queries/getRegionsWithAdditionalData.server'
import { RegionTeaser } from './RegionTeaser'

type Props = {
  nonPublicRegions: RegionWithAdditionalData[]
}

const partitionNonPublicRegions = (regions: RegionWithAdditionalData[]) => {
  const active = regions.filter((r) => r.status !== 'DEACTIVATED')
  const deactivated = regions.filter((r) => r.status === 'DEACTIVATED')

  return { active, deactivated }
}

const RegionTeaserGrid = ({
  regions,
  className,
}: {
  regions: RegionWithAdditionalData[]
  className?: string
}) => (
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
            <RegionTeaserGrid regions={active} />
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
            <RegionTeaserGrid regions={deactivated} className="opacity-60" />
          </>
        )}
      </div>
    </div>
  )
}
