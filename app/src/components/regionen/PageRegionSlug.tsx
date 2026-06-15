import { getRouteApi } from '@tanstack/react-router'
import { HeaderRegionen } from '@/components/shared/layouts/Header/HeaderRegionen/HeaderRegionen'
import { MapInterface } from './pageRegionSlug/MapInterface'
import { RegionAccessDenied } from './pageRegionSlug/RegionDeactivated'

const routeApi = getRouteApi('/regionen/$regionSlug')

export function PageRegionSlug() {
  const data = routeApi.useLoaderData()

  return (
    <div className="flex h-screen flex-col">
      {/* Desktop header only — on mobile the map fills the screen and the controls
          live in the floating MobileMapHeader (see MapInterface). */}
      <div className="hidden sm:block">
        <HeaderRegionen />
      </div>
      <main className="z-0 grow">
        {data.authorized ? <MapInterface /> : <RegionAccessDenied status={data.region.status} />}
      </main>
    </div>
  )
}
