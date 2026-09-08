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
import { isModeOwnedSource } from '@/components/regionen/pageRegionSlug/modes/modeScopedSelection'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { FadeSlideIn } from '@/components/shared/motion/FadeSlideIn'
import { mapOverlayMaxHeightClassName, mapOverlaySheetClassName } from '../mapOverlayChrome.const'
import { MobileBottomSheet } from '../mobile/MobileBottomSheet'
import { PanelResizeHandle } from '../PanelResizeHandle'
import { Inspector } from './Inspector'
import { InspectorHeader } from './InspectorHeader'
import { inspectorRenderableFeatures } from './useInspectorRenderableFeatures'
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

  const features = inspectorRenderableFeatures(
    inspectorFeatures,
    selectedFeatures.map((feature) => feature.mapFeature),
  )

  const renderFeatures = !!features.length

  const { ref: desktopPanelRef, onResizeHandlePointerDown } = useResizableInspectorWidth({
    enabled: isDesktop,
    isOpen: renderFeatures,
  })

  const { featuresParam, setFeaturesParam } = useFeaturesParam()
  const { clearInspectorFeatures } = useMapActions()
  const handleClose = () => {
    const modeUrlFeatures = featuresParam.filter((feature) => isModeOwnedSource(feature.sourceId))
    setFeaturesParam(modeUrlFeatures.length > 0 ? modeUrlFeatures : null)
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

  // Desktop: floating right-hand sheet (this branch + its map-control offset run on desktop only).
  return (
    <div
      ref={desktopPanelRef}
      className={twJoin(
        'absolute z-20 flex w-(--inspector-width) max-w-[800px] flex-col overflow-hidden transition-opacity duration-150',
        'top-(--map-overlay-inset) right-(--map-overlay-inset)',
        mapOverlayMaxHeightClassName,
        mapOverlaySheetClassName,
        !renderFeatures && 'pointer-events-none opacity-0',
      )}
    >
      {renderFeatures ? (
        <>
          <PanelResizeHandle
            label="Inspectorbreite ändern"
            onPointerDown={onResizeHandlePointerDown}
          />
          {/* Enter-only transform/opacity animation on the content only: the outer panel
              div must stay a plain, always-mounted div — its ResizeObserver and the
              --inspector-width layout effect depend on it (see useResizableInspectorWidth). */}
          <FadeSlideIn x={24} className="relative min-h-0 overflow-y-auto p-2">
            <InspectorHeader count={features.length} handleClose={handleClose} />
            <Inspector features={features} />
          </FadeSlideIn>
        </>
      ) : null}
    </div>
  )
}
