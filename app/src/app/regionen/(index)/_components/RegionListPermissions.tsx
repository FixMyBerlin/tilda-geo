import { invoke } from '@/src/blitz-server'
import getRegionsWithAdditionalData from '@/src/server/regions/queries/getRegionsWithAdditionalData'
import getCurrentUser from '@/src/server/users/queries/getCurrentUser'
import 'server-only'
import { RegionTeaser } from './RegionTeaser'

export const RegionListPermissions = async () => {
  const user = await invoke(getCurrentUser, null)
  if (!user?.id || !user?.role) return null

  // Has to be below the role check.
  // Get all regions where user has membership
  const allRegions = await invoke(getRegionsWithAdditionalData, {
    where: { Membership: { some: { userId: user.id } } },
  })

  // Filter into active and deactivated regions
  const activeRegions = allRegions.filter((region) => region.status !== 'DEACTIVATED')
  const deactivatedRegions = allRegions.filter((region) => region.status === 'DEACTIVATED')

  const hasAnyRegions = allRegions.length > 0

  return (
    <div className="mx-auto max-w-7xl overflow-hidden sm:px-6 lg:px-8">
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

      {!hasAnyRegions && (
        <div className="my-10 px-4">
          <div className="col-span-4 p-4 font-normal text-gray-500">
            Ihr Account ist noch für keine Region freigeschaltet.
          </div>
        </div>
      )}
    </div>
  )
}
