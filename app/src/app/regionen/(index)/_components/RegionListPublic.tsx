import { invoke } from '@/src/blitz-server'
import getRegionsWithAdditionalData from '@/src/server/regions/queries/getRegionsWithAdditionalData'
import 'server-only'
import { RegionTeaser } from './RegionTeaser'

export const RegionListPublic = async () => {
  const publicRegions = await invoke(getRegionsWithAdditionalData, { where: { public: true } })

  return (
    <div className="mx-auto max-w-7xl overflow-hidden sm:px-6 lg:px-8">
      <div className="prose mt-5 px-4 sm:px-0">
        <h2>Öffentliche Regionen</h2>
      </div>

      <div className="my-10 grid grid-cols-2 border-l border-t border-gray-200 sm:mx-0 md:grid-cols-3 lg:grid-cols-4">
        {publicRegions?.map((region) => (
          <RegionTeaser key={region.slug} region={region} />
        ))}
        {publicRegions?.length === 0 && (
          <div className="p-4 font-semibold text-gray-400">Keine Regionen</div>
        )}
      </div>
    </div>
  )
}
