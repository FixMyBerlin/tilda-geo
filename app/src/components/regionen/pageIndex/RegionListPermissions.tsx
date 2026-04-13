import type { RegionWithAdditionalData } from '@/server/regions/queries/getRegionsWithAdditionalData.server'
import { RegionTeaser } from './RegionTeaser'

type Props = {
  activeRegions: RegionWithAdditionalData[]
  deactivatedRegions: RegionWithAdditionalData[]
}

export const RegionListPermissions = ({ activeRegions, deactivatedRegions }: Props) => {
  if (activeRegions.length === 0 && deactivatedRegions.length === 0) return null

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 overflow-hidden sm:px-6 lg:px-8">
      {activeRegions.length > 0 && (
        <>
          <div className="prose mt-5 px-4 sm:px-0">
            <h2>Ihre Regionen</h2>
          </div>

          <div className="my-10 grid grid-cols-2 border-t border-l border-gray-200 sm:mx-0 md:grid-cols-3 lg:grid-cols-4">
            {activeRegions.map((region) => (
              <RegionTeaser key={region.slug} region={region} />
            ))}
          </div>
        </>
      )}

      {deactivatedRegions.length > 0 && (
        <>
          <div className="prose mt-5 px-4 sm:px-0">
            <h2 className="text-gray-500">Deaktivierte Regionen</h2>
            <p className="text-sm text-gray-500">
              Diese Regionen sind nicht mehr aktiv und können nicht mehr verwendet werden.
            </p>
          </div>

          <div className="my-10 grid grid-cols-2 border-t border-l border-gray-200 opacity-60 sm:mx-0 md:grid-cols-3 lg:grid-cols-4">
            {deactivatedRegions.map((region) => (
              <RegionTeaser key={region.slug} region={region} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
