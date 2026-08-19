import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { useEffect } from 'react'
import { MapProvider } from 'react-map-gl/maplibre'
import { BackgroundLegend } from './background/BackgroundLegend'
import { SelectBackground } from './background/SelectBackground'
import { DebugButton } from './DebugBoxes/DebugButton'
import { RegionDataModals } from './DownloadModal/RegionDataModals'
import { LoadingIndicator } from './LoadingIndicator/LoadingIndicator'
import { RegionMap } from './Map/RegionMap'
import { PlaceSearch } from './Map/Search/PlaceSearch'
import { MobileLayerButton } from './mobile/MobileLayerButton'
import { mobileMapBottomControlsClassName } from './mobile/mobileMapChrome.const'
import { MobileMapHeader } from './mobile/MobileMapHeader'
import { InternalNotes } from './notes/InternalNotes/InternalNotes'
import { OsmNotes } from './notes/OsmNotes/OsmNotes'
import { PlanningCandidateToggle } from './Planning/candidates/PlanningCandidateToggle'
import { PlanningPanel } from './Planning/PlanningPanel'
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
      {/* Visible chrome box (= main under the header). Inspector/sidebars size to this. */}
      <div className="relative h-full w-full">
        {/* Map canvas only: full viewport tall on desktop so welcome-panel open/close can clip
            the bottom without MapLibre resizing. Parent `overflow-hidden` clips the overflow.
            Mobile stays `fixed inset-0` for edge-to-edge under browser chrome. */}
        <div className="fixed inset-0 z-0 sm:absolute sm:inset-x-0 sm:top-0 sm:h-(--app-height,100dvh) sm:w-full">
          <RegionMap />
        </div>

        <MobileMapHeader />
        {/* Desktop search overlay (top-right, left of the zoom control); mobile uses MobileMapHeader.
            Left of it (planning mode only): the candidate-selection tool, same button look. */}
        <PlanningPanel />
        <DesktopOnly>
          <PlaceSearch className="absolute top-2 right-[calc(var(--inspector-width)+3.5rem)] z-20" />
          <PlanningCandidateToggle className="absolute top-2 right-[calc(var(--inspector-width)+6.5rem)] z-20" />
        </DesktopOnly>
        <SidebarLayerControls />
        {/* Also renders the planning candidate list while that tool is active. */}
        <SidebarInspector />
        <div className={mobileMapBottomControlsClassName} data-map-controls="true">
          <LoadingIndicator />
          <OsmNotes />
          <InternalNotes />
          {/* Download + documentation modals live in MobileMapHeader (top-left) on mobile; desktop keeps them here. */}
          <DesktopOnly>
            <RegionDataModals />
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
