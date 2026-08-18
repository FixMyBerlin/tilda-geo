import { useEffect, useRef } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import {
  useMapActions,
  useMapBounds,
  useMapInspectorFeatures,
  useMapInspectorSize,
  useMapLoaded,
  useMapSidebarSize,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { useSelectedFeatures } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useSelectedFeatures'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { FadeSlideIn } from '@/components/shared/motion/FadeSlideIn'
import { MobileBottomSheet } from '../mobile/MobileBottomSheet'
import { Inspector } from './Inspector'
import { InspectorHeader } from './InspectorHeader'
import { useResizableInspectorWidth } from './useResizableInspectorWidth'
import { allUrlFeaturesInBounds, createBoundingPolygon, fitBounds } from './util'

export const SidebarInspector = () => {
  const checkBounds = useRef(true)

  const isDesktop = useBreakpoint('sm')
  const { mainMap: map } = useMap()
  const mapLoaded = useMapLoaded()
  const _mapBounds = useMapBounds() // needed to trigger rerendering
  const inspectorFeatures = useMapInspectorFeatures()
  const selectedFeatures = useSelectedFeatures(!inspectorFeatures.length)
  const inspectorSize = useMapInspectorSize()
  const sidebarSize = useMapSidebarSize()

  const features = inspectorFeatures.length
    ? inspectorFeatures
    : selectedFeatures.map((f) => f.mapFeature).filter(Boolean)

  const renderFeatures = !!features.length

  const { ref: desktopPanelRef, onResizeHandlePointerDown } = useResizableInspectorWidth({
    enabled: isDesktop,
    isOpen: renderFeatures,
  })

  const { setFeaturesParam } = useFeaturesParam()
  const { clearInspectorFeatures } = useMapActions()
  const handleClose = () => {
    setFeaturesParam(null)
    clearInspectorFeatures()
  }

  useEffect(
    function fitSelectedFeaturesOnceOnLoad() {
      if (inspectorFeatures.length) {
        // TODO: See https://github.com/FixMyBerlin/private-issues/issues/1775
        checkBounds.current = false
        return
      }

      if (
        !map ||
        !mapLoaded || // before map is not completely loaded we can't queryRenderedFeatures()
        !checkBounds.current || // run this at most once
        inspectorSize.width === 0 // size of the inspector needs to be known to check bounding box
      ) {
        return
      }

      const boundingPolygon = createBoundingPolygon(map, sidebarSize, inspectorSize)
      const urlFeatures = selectedFeatures.map((f) => f.urlFeature)
      if (!allUrlFeaturesInBounds(urlFeatures, boundingPolygon)) {
        fitBounds(map, urlFeatures, sidebarSize, inspectorSize)
      }
      // TODO: See https://github.com/FixMyBerlin/private-issues/issues/1775
      checkBounds.current = false
    },
    [inspectorFeatures.length, inspectorSize, map, mapLoaded, selectedFeatures, sidebarSize],
  )

  // Mobile: the inspector data is shown in the shared bottom sheet (taller than the
  // default — only ~10% map stays visible) instead of the desktop right-hand sidebar.
  if (!isDesktop) {
    return (
      <MobileBottomSheet
        open={renderFeatures}
        onClose={handleClose}
        title={`${features.length} ${features.length === 1 ? 'Element' : 'Elemente'}`}
      >
        <div className="px-4 pb-4">
          <Inspector features={features} />
        </div>
      </MobileBottomSheet>
    )
  }

  // Desktop: right-hand sidebar (this branch + its map-control offset run on desktop only).
  return (
    <div
      ref={desktopPanelRef}
      className={twJoin(
        'group/panel absolute top-0 right-0 bottom-0 z-20 w-(--inspector-width) max-w-[800px] overflow-hidden bg-white shadow-md transition-opacity duration-150',
        !renderFeatures && 'pointer-events-none opacity-0',
      )}
    >
      {renderFeatures ? (
        <>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Inspectorbreite ändern"
            className="absolute top-0 bottom-0 left-0 z-30 w-2 cursor-col-resize touch-none bg-gray-400/70 opacity-0 transition-opacity select-none group-hover/panel:opacity-100 active:opacity-100"
            onPointerDown={onResizeHandlePointerDown}
          />
          {/* Enter-only transform/opacity animation on the content only: the outer panel
              div must stay a plain, always-mounted div — its ResizeObserver and the
              --inspector-width layout effect depend on it (see useResizableInspectorWidth). */}
          <FadeSlideIn x={24} className="relative h-full overflow-y-auto p-5 pr-3">
            <InspectorHeader count={features.length} handleClose={handleClose} />
            <Inspector features={features} />
          </FadeSlideIn>
        </>
      ) : null}
    </div>
  )
}
