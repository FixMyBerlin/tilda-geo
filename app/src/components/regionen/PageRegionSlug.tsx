import { getRouteApi } from '@tanstack/react-router'
import { HeaderRegionen } from '@/components/shared/layouts/Header/HeaderRegionen/HeaderRegionen'
import { MapInterface } from './pageRegionSlug/MapInterface'
import { RegionAccessDenied } from './pageRegionSlug/RegionDeactivated'

const routeApi = getRouteApi('/regionen/$regionSlug')

export function PageRegionSlug() {
  const data = routeApi.useLoaderData()

  return (
    // Full-bleed map page: fill the WHOLE screen (`h-screen` = large viewport, so the map bleeds
    // under the iOS status bar and Safari toolbar) and stay non-scrollable (`overflow-hidden
    // overscroll-none`) so there's no gray strip and Chrome iOS can't scroll the header out of view.
    // The safe-area insets that keep the controls clear of the chrome live on the buttons, not here.
    <div className="flex h-screen flex-col overflow-hidden overscroll-none">
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
