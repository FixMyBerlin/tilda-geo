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
import { usePlanningCandidatesState } from '@/components/regionen/pageRegionSlug/hooks/mapState/usePlanningCandidatesState'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { useSelectedFeatures } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useSelectedFeatures'
import { CloseButton } from '@/components/shared/CloseButton/CloseButton'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { FadeSlideIn } from '@/components/shared/motion/FadeSlideIn'
import { MobileBottomSheet } from '../mobile/MobileBottomSheet'
import { PlanningCandidateList } from '../Planning/candidates/PlanningCandidateList'
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

  // Kandidaten-Auswahlwerkzeug des Planungsmoduls: solange es aktiv ist, zeigt dieselbe
  // Sidebar statt der Einzel-Feature-Ansicht die Übersicht der ausgewählten Hexagone
  // (PlanningCandidateList) – gleiche Panel-Chrome, gleiche ziehbare Breite.
  const candidateSelectActive = usePlanningCandidatesState((s) => s.selectActive)
  const setCandidateSelectActive = usePlanningCandidatesState((s) => s.setSelectActive)
  const candidateCount = usePlanningCandidatesState((s) => s.candidates.length)

  const renderFeatures = !!features.length || candidateSelectActive

  const { ref: desktopPanelRef, onResizeHandlePointerDown } = useResizableInspectorWidth({
    enabled: isDesktop,
    isOpen: renderFeatures,
  })

  const { setFeaturesParam } = useFeaturesParam()
  const { clearInspectorFeatures } = useMapActions()
  const handleClose = () => {
    setFeaturesParam(null)
    clearInspectorFeatures()
    // Schließt die Sidebar auch dann, wenn sie gerade die Kandidatenliste zeigt
    // (die Auswahl selbst bleibt erhalten und wird auf der Karte weiter markiert).
    setCandidateSelectActive(false)
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
        title={
          candidateSelectActive
            ? `${candidateCount} ${candidateCount === 1 ? 'Kandidat' : 'Kandidaten'}`
            : `${features.length} ${features.length === 1 ? 'Element' : 'Elemente'}`
        }
      >
        <div className="px-4 pb-4">
          {candidateSelectActive ? <PlanningCandidateList /> : <Inspector features={features} />}
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
            {candidateSelectActive ? (
              <>
                <h2 className="mb-3 text-base font-medium text-gray-900">
                  {candidateCount} {candidateCount === 1 ? 'Kandidat' : 'Kandidaten'}:
                </h2>
                <CloseButton onClick={handleClose} positionClasses="top-3 right-3" />
                <PlanningCandidateList />
              </>
            ) : (
              <>
                <InspectorHeader count={features.length} handleClose={handleClose} />
                <Inspector features={features} />
              </>
            )}
          </FadeSlideIn>
        </>
      ) : null}
    </div>
  )
}
