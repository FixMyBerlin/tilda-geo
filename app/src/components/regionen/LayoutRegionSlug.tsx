import { MapProvider } from 'react-map-gl/maplibre'
import { HeaderRegionen } from '@/components/layouts/Header/HeaderRegionen/HeaderRegionen'
import { MapInterface } from './pageRegionSlug/MapInterface'
import { MapLayoutResizeSync } from './pageRegionSlug/modes/MapLayoutResizeSync'
import { ModeColumnShell } from './pageRegionSlug/modes/ModeColumnShell'

/**
 * Layout for the region map and its mode pages. The map mounts here (not in the child routes) so
 * switching modes never remounts the MapLibre instance. Child routes (mode pages) render into the
 * <Outlet/> as a panel on the right of the map; the default map mode (`index.tsx`) renders nothing.
 *
 * <MapProvider> wraps BOTH the panel <Outlet/> and <MapInterface/> so the mode panels can reach the
 * shared map via `useMap()` (flyTo/fitBounds) — the map itself still mounts inside <MapInterface/>.
 */
export function LayoutRegionSlug() {
  return (
    // Full-bleed map page: lock to the *measured* visible viewport (`--app-height`, set by
    // useVisibleViewportHeightVar in LayoutRoot; `100dvh` is only the pre-hydration fallback
    // because raw dvh is unreliable on Chrome/Firefox iOS) so Safari/Chrome leave no gray strip
    // and the document stays non-scrollable (otherwise Chrome iOS lets you scroll the floating
    // header/URL bar out of view).
    <div className="flex h-(--app-height,100dvh) flex-col overflow-hidden overscroll-none">
      {/* Desktop header only — on mobile the map fills the screen and the controls
          live in the floating MobileMapHeader (see MapInterface). */}
      {/* Desktop header sits above mode panel + map in the shadow stack (header → modes → map). */}
      <div className="relative z-40 hidden sm:block">
        <HeaderRegionen />
      </div>
      <MapProvider>
        <main className="z-0 flex grow flex-row overflow-hidden">
          <MapLayoutResizeSync>
            <MapInterface />
          </MapLayoutResizeSync>
          <ModeColumnShell />
        </main>
      </MapProvider>
    </div>
  )
}
