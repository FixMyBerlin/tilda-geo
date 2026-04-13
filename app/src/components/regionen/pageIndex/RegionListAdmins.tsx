import type { RegionWithAdditionalData } from '@/server/regions/queries/getRegionsWithAdditionalData.server'
import { RegionTeaser } from './RegionTeaser'

type Props = {
  nonPublicRegions: RegionWithAdditionalData[]
}

export const RegionListAdmins = ({ nonPublicRegions }: Props) => {
  if (nonPublicRegions.length === 0) return null

  return (
    <div className="bg-pink-200">
      <div className="mx-auto w-full max-w-7xl min-w-0 overflow-hidden sm:px-6 lg:px-8">
        <div className="prose mt-5 px-4 sm:px-0">
          <h2>ADMIN: Nicht veröffentlichte Regionen</h2>
        </div>

        <div className="my-10 grid grid-cols-2 border-t border-l border-gray-200 sm:mx-0 md:grid-cols-3 lg:grid-cols-4">
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
