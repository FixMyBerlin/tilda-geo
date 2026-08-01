import { getRouteApi } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { HeaderRegionen } from '@/components/layouts/Header/HeaderRegionen/HeaderRegionen'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { MapInterface } from './pageRegionSlug/MapInterface'
import { RegionAccessDenied } from './pageRegionSlug/RegionDeactivated'

const routeApi = getRouteApi('/regionen/$regionSlug')

export function PageRegionSlug() {
  const data = routeApi.useLoaderData()
  // Same mount gate as MobileMapHeader: only one welcome surface (and its Escape/focus
  // handlers) exists at a time — CSS `hidden` would leave the desktop header mounted.
  const isDesktop = useBreakpoint('sm')

  return (
    /* Full-bleed map page: lock to the *measured* visible viewport (`--app-height`, set by
    useVisibleViewportHeightVar; `100dvh` is only the pre-hydration fallback because raw dvh is
    unreliable on Chrome/Firefox iOS) so Safari/Chrome leave no gray strip and the document stays
    non-scrollable (otherwise Chrome iOS lets you scroll the floating header/URL bar out of view). */
    <div className="flex h-(--app-height,100dvh) flex-col overflow-hidden overscroll-none">
      {/* Desktop header only — on mobile the map fills the screen and the controls
          live in the floating MobileMapHeader (see MapInterface). */}
      {isDesktop ? <HeaderRegionen /> : null}
      <motion.main layout className="z-0 min-h-0 grow">
        {data.authorized ? (
          <div className="relative h-full overflow-hidden">
            {/* Desktop: fixed full-viewport map height clipped by the flex main area so the
                welcome panel can push the map down without MapLibre re-layout each frame. */}
            <div className="h-full sm:absolute sm:inset-x-0 sm:top-0 sm:h-(--app-height,100dvh)">
              <MapInterface />
            </div>
          </div>
        ) : (
          <RegionAccessDenied status={data.region.status} />
        )}
      </motion.main>
    </div>
  )
}
