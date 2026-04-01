import { getRouteApi } from '@tanstack/react-router'
import { HeaderRegionen } from '@/components/shared/layouts/Header/HeaderRegionen/HeaderRegionen'
import { MapInterface } from './pageRegionSlug/MapInterface'
import { RegionAccessDenied } from './pageRegionSlug/RegionDeactivated'

const routeApi = getRouteApi('/regionen/$regionSlug')

export function PageRegionSlug() {
  const data = routeApi.useLoaderData()

  return (
    <div className="flex h-screen flex-col">
      <HeaderRegionen />
      <main className="z-0 grow">
        {data.authorized ? <MapInterface /> : <RegionAccessDenied status={data.region.status} />}
      </main>
    </div>
  )
}
