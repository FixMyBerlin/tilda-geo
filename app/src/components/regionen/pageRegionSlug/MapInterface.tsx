import { addProtocol, removeProtocol } from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { useEffect } from 'react'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { BackgroundLegend } from './background/BackgroundLegend'
import { SelectBackground } from './background/SelectBackground'
import { DebugButton } from './DebugBoxes/DebugButton'
import { RegionDataModals } from './DownloadModal/RegionDataModals'
import { useBg3dParam } from './hooks/useQueryState/useBg3dParam'
import { LoadingIndicator } from './LoadingIndicator/LoadingIndicator'
import { MapNavigationButtons } from './Map/MapNavigationButtons'
import './Map/maplibreWorker'
import { RegionMap } from './Map/RegionMap'
import { PlaceSearch } from './Map/Search/PlaceSearch'
import {
  mapOverlayBottomRightControlsClassName,
  mapOverlayControlStackClassName,
  mapOverlayTopRightControlsClassName,
} from './mapOverlayChrome.const'
import { MobileLayerButton } from './mobile/MobileLayerButton'
import { MobileMapHeader } from './mobile/MobileMapHeader'
import { ModeScopedSelectionReset } from './modes/ModeScopedSelectionReset'
import { NotesNewCenterPin } from './modes/notes/new/NotesNewCenterPin'
import { OsmNotes } from './modes/notes/OsmNotes'
import { SidebarInspector } from './SidebarInspector/SidebarInspector'
import { SidebarLayerControls } from './SidebarLayerControls/SidebarLayerControls'
import { DesktopOnly } from './utils/Breakpoint'

export const MapInterface = () => {
  const isDesktop = useBreakpoint('sm')
  const { is3dActive } = useBg3dParam()

  useEffect(function registerPmtilesProtocolOnMount() {
    const protocol = new Protocol()
    addProtocol('pmtiles', protocol.tile)
    return function removePmtilesProtocolOnUnmount() {
      removeProtocol('pmtiles')
    }
  }, [])

  // Breakpoint-specific pieces are rendered (not CSS-hidden) so the unused ones stay out of
  // the DOM. Generic/shared components that also appear on the other breakpoint use the
  // <DesktopOnly> helper (it owns the breakpoint check, adds no DOM node). Components that are
  // inherently mobile-only (MobileMapHeader, MobileLayerButton) gate themselves (return null).
  //
  // <MapProvider> is hoisted up to LayoutRegionSlug so the mode panels (rendered in the layout's
  // <Outlet/>) share the same map instance as the one mounted here.
  return (
    <div className="relative h-full w-full">
      {/* Map canvas only. Desktop height is pinned to the visible box (viewport minus header)
          rather than `h-full`: with the welcome panel closed that is exactly this container, and
          when the panel opens and shrinks `main` the map keeps its size and gets pushed down /
          clipped by the parent `overflow-hidden` instead of making MapLibre re-layout every
          animation frame. Mobile stays `fixed inset-0` for edge-to-edge under browser chrome. */}
      <div className="fixed inset-0 z-0 sm:absolute sm:inset-x-0 sm:top-0 sm:h-[calc(var(--app-height,100dvh)-var(--app-header-height))] sm:w-full">
        <div className="relative h-full w-full">
          <RegionMap />
          <NotesNewCenterPin />
        </div>
      </div>

      <MobileMapHeader />
      {/* Top-right: search above glued zoom ± (one stack, not a side-by-side row).
          Mobile search is in MobileMapHeader; zoom/compass only when 3D is on. */}
      <DesktopOnly>
        <div className={mapOverlayTopRightControlsClassName}>
          <PlaceSearch />
          <MapNavigationButtons mapId="mainMap" showCompass={is3dActive} />
        </div>
      </DesktopOnly>
      {!isDesktop && is3dActive && (
        <div className="pointer-events-none absolute top-[calc(var(--map-chrome-top-inset)+3rem)] right-[calc(env(safe-area-inset-right)+0.5rem)] z-20 *:pointer-events-auto">
          <MapNavigationButtons mapId="mainMap" showCompass />
        </div>
      )}
      <ModeScopedSelectionReset />
      <OsmNotes />
      <SidebarLayerControls />
      <SidebarInspector />
      <div className={mapOverlayBottomRightControlsClassName}>
        {isDesktop ? (
          <>
            <div className="absolute right-full bottom-0 mr-2 flex flex-wrap items-end justify-end">
              <BackgroundLegend />
            </div>
            <div className={mapOverlayControlStackClassName}>
              <LoadingIndicator />
              <DebugButton />
              <RegionDataModals />
              <SelectBackground />
            </div>
          </>
        ) : (
          <>
            <LoadingIndicator />
            <SelectBackground />
            <MobileLayerButton />
          </>
        )}
      </div>
    </div>
  )
}
