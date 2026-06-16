import { getRouteApi } from '@tanstack/react-router'
import { HeaderRegionen } from '@/components/shared/layouts/Header/HeaderRegionen/HeaderRegionen'
import { MapInterface } from './pageRegionSlug/MapInterface'
import { RegionAccessDenied } from './pageRegionSlug/RegionDeactivated'

const routeApi = getRouteApi('/regionen/$regionSlug')

export function PageRegionSlug() {
  const data = routeApi.useLoaderData()

  return (
    // Full-bleed map page: lock to the *dynamic* viewport (h-dvh, not h-screen/100vh) so iOS
    // Safari/Chrome don't leave a gray strip below the map and the document stays non-scrollable
    // (otherwise Chrome iOS lets you scroll the floating header/URL bar out of view).
    <div className="flex h-dvh flex-col overflow-hidden overscroll-none">
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
