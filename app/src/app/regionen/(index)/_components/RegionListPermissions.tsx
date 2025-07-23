import { invoke } from '@/src/blitz-server'
import getRegionsWithAdditionalData from '@/src/server/regions/queries/getRegionsWithAdditionalData'
import getCurrentUser from '@/src/server/users/queries/getCurrentUser'
import 'server-only'
import { RegionTeaser } from './RegionTeaser'

export const RegionListPermissions = async () => {
  const user = await invoke(getCurrentUser, null)
  if (!user?.id || !user?.role) return null

  // Has to be below the role check.
  const permissionsRegions = await invoke(getRegionsWithAdditionalData, {
    where: { Membership: { some: { userId: user.id } } },
  })

  return (
    <div className="mx-auto max-w-7xl overflow-hidden sm:px-6 lg:px-8">
      <div className="prose mt-5 px-4 sm:px-0">
        <h2>Ihre Regionen</h2>
      </div>

      <div className="my-10 grid grid-cols-2 border-l border-t border-gray-200 sm:mx-0 md:grid-cols-3 lg:grid-cols-4">
        {permissionsRegions?.map((region) => (
          <RegionTeaser key={region.slug} region={region} />
        ))}
        {permissionsRegions?.length === 0 && (
          <div className="col-span-4 p-4 font-normal text-gray-500">
            Ihr Account ist noch für keine Region freigeschaltet.
          </div>
        )}
      </div>
    </div>
  )
}
