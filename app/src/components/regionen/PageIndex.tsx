import { useQuery } from '@tanstack/react-query'
import { regionenIndexQueryOptions } from '@/server/regions/regionenIndexQueryOptions'
import { RegionListAdmins } from './pageIndex/RegionListAdmins'
import { RegionListPermissions } from './pageIndex/RegionListPermissions'
import { RegionListPublic } from './pageIndex/RegionListPublic'

export function PageIndex() {
  const { data } = useQuery(regionenIndexQueryOptions())
  const activeRegions = data?.activeRegions ?? []
  const deactivatedRegions = data?.deactivatedRegions ?? []
  const nonPublicRegions = data?.nonPublicRegions ?? []
  const publicRegions = data?.publicRegions ?? []

  return (
    <main className="flex w-full min-w-0 flex-1 flex-col pt-10">
      <RegionListPermissions
        activeRegions={activeRegions}
        deactivatedRegions={deactivatedRegions}
      />
      <RegionListPublic publicRegions={publicRegions} />
      <RegionListAdmins nonPublicRegions={nonPublicRegions} />
    </main>
  )
}
