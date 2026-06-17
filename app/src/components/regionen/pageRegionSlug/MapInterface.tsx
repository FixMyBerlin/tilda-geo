import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { useEffect } from 'react'
import { MapProvider } from 'react-map-gl/maplibre'
import { BackgroundLegend } from './background/BackgroundLegend'
import { SelectBackground } from './background/SelectBackground'
import { DebugButton } from './DebugBoxes/DebugButton'
import { DownloadModal } from './DownloadModal/DownloadModal'
import { LoadingIndicator } from './LoadingIndicator/LoadingIndicator'
import { RegionMap } from './Map/RegionMap'
import { PlaceSearch } from './Map/Search/PlaceSearch'
import { MobileLayerButton } from './mobile/MobileLayerButton'
import { MobileMapHeader } from './mobile/MobileMapHeader'
import { InternalNotes } from './notes/InternalNotes/InternalNotes'
import { OsmNotes } from './notes/OsmNotes/OsmNotes'
import { SidebarInspector } from './SidebarInspector/SidebarInspector'
import { SidebarLayerControls } from './SidebarLayerControls/SidebarLayerControls'
import { DesktopOnly } from './utils/Breakpoint'

export const MapInterface = () => {
  useEffect(function registerPmtilesProtocolOnMount() {
    const protocol = new Protocol()
    maplibregl.addProtocol('pmtiles', protocol.tile)
    return function removePmtilesProtocolOnUnmount() {
      maplibregl.removeProtocol('pmtiles')
    }
  }, [])

  // Breakpoint-specific pieces are rendered (not CSS-hidden) so the unused ones stay out of
  // the DOM. Generic/shared components that also appear on the other breakpoint use the
  // <DesktopOnly> helper (it owns the breakpoint check, adds no DOM node). Components that are
  // inherently mobile-only (MobileMapHeader, MobileLayerButton) gate themselves (return null).
  return (
    <MapProvider>
      <div className="relative flex h-full w-full flex-row gap-4">
        {/* The map is a full-screen backdrop on mobile (`fixed inset-0`) so it bleeds *under* the
            iOS status bar and Safari toolbar — edge to edge. The floating UI below stays positioned
            against this *visible-height* container (`h-full` of the `--app-height` page wrapper), so
            the header/controls remain clear of the browser chrome (esp. the Chrome iOS address bar).
            On desktop the map returns to normal flow, filling the area below HeaderRegionen. `z-0`
            keeps it behind the overlays (which are z-10+). */}
        <div className="fixed inset-0 z-0 sm:static sm:inset-auto sm:z-auto sm:h-full sm:w-full">
          <RegionMap />
        </div>
        <MobileMapHeader />
        {/* Desktop search overlay (top-right, left of the zoom control); mobile uses MobileMapHeader. */}
        <DesktopOnly>
          <PlaceSearch className="absolute top-2 right-14 z-20" />
        </DesktopOnly>
        <SidebarLayerControls />
        <SidebarInspector />
        <div
          // Offsets fold in `env(safe-area-inset-*)` so the controls stay above the iOS home
          // indicator / landscape notch; insets are 0 elsewhere, leaving the base right-2.5/bottom-4.
          className="pointer-events-none fixed right-[calc(env(safe-area-inset-right)_+_0.625rem)] bottom-[calc(env(safe-area-inset-bottom)_+_1rem)] z-10 mt-2.5 flex max-w-full flex-wrap items-end justify-end gap-1.5 *:pointer-events-auto"
          data-map-controls="true"
        >
          <LoadingIndicator />
          <OsmNotes />
          <InternalNotes />
          {/* Download lives in the MobileMapHeader (top-left) on mobile; desktop keeps it here. */}
          <DesktopOnly>
            <DownloadModal />
          </DesktopOnly>
          <BackgroundLegend />
          <SelectBackground />
          {/* Primary mobile control: bigger layer button (desktop uses the sidebar). */}
          <MobileLayerButton />
          {/* Desktop debug entry point; mobile has its own in MobileMapHeader (left of search). */}
          <DesktopOnly>
            <DebugButton />
          </DesktopOnly>
        </div>
      </div>
    </MapProvider>
  )
}
