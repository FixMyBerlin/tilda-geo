import { invoke } from '@/src/blitz-server'
import getRegionsWithAdditionalData from '@/src/server/regions/queries/getRegionsWithAdditionalData'
import getCurrentUser from '@/src/server/users/queries/getCurrentUser'
import 'server-only'
import { RegionTeaser } from './RegionTeaser'

export const RegionListAdmins = async () => {
  const user = await invoke(getCurrentUser, null)
  if (user?.role !== 'ADMIN') return null

  // Has to be below the role check.
  const nonPublicRegions = await invoke(getRegionsWithAdditionalData, { where: { public: false } })

  return (
    <div className="bg-pink-200">
      <div className="mx-auto max-w-7xl overflow-hidden sm:px-6 lg:px-8">
        <div className="prose mt-5 px-4 sm:px-0">
          <h2>ADMIN: Nicht veröffentlichte Regionen</h2>
        </div>

        <div className="my-10 grid grid-cols-2 border-l border-t border-gray-200 sm:mx-0 md:grid-cols-3 lg:grid-cols-4">
          {nonPublicRegions?.map((region) => (
            <RegionTeaser key={region.slug} region={region} />
          ))}
          {nonPublicRegions?.length === 0 && (
            <div className="p-4 font-semibold text-gray-400">Keine Regionen</div>
          )}
        </div>
      </div>
    </div>
  )
}
