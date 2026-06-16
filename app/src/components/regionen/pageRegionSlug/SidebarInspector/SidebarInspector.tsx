import { useEffect, useRef } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { useInitialSizeMeasurement } from '@/components/regionen/pageRegionSlug/hooks/mapState/useInitialSizeMeasurement'
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
import { MobileBottomSheet } from '../mobile/MobileBottomSheet'
import { Inspector } from './Inspector'
import { InspectorHeader } from './InspectorHeader'
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

  const { clearInspectorFeatures, updateInspectorSize } = useMapActions()
  // One-time measurement for initial map-fit visible area (see useInitialSizeMeasurement).
  const ref = useInitialSizeMeasurement<HTMLDivElement>(updateInspectorSize)

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

  const features = inspectorFeatures.length
    ? inspectorFeatures
    : selectedFeatures.map((f) => f.mapFeature).filter(Boolean)

  const renderFeatures = !!features.length

  const { setFeaturesParam } = useFeaturesParam()
  const handleClose = () => {
    setFeaturesParam(null)
    clearInspectorFeatures()
  }

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
      ref={ref}
      className={twJoin(
        'absolute top-0 right-0 bottom-0 z-20 w-140 max-w-full overflow-y-scroll bg-white p-5 pr-3 shadow-md',
        !renderFeatures && 'pointer-events-none opacity-0',
      )}
    >
      {renderFeatures ? (
        <>
          <InspectorHeader count={features.length} handleClose={handleClose} />
          <Inspector features={features} />
          <style
            // oxlint-disable-next-line react/no-danger -- static CSS for map controls
            dangerouslySetInnerHTML={{
              __html:
                '.maplibregl-ctrl-top-right { right: 35rem } [data-map-controls="true"] { right: calc(35rem + 10px) }',
            }}
          />
        </>
      ) : null}
    </div>
  )
}
