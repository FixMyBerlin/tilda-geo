import { useRef } from 'react'
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
import { useInitialSizeMeasurement } from '@/components/regionen/pageRegionSlug/hooks/mapState/useInitialSizeMeasurement'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { useSelectedFeatures } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useSelectedFeatures'
import { Inspector } from './Inspector'
import { InspectorHeader } from './InspectorHeader'
import { allUrlFeaturesInBounds, createBoundingPolygon, fitBounds } from './util'

export const SidebarInspector = () => {
  const checkBounds = useRef(true)

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

  if (inspectorFeatures.length) {
    // TODO: See https://github.com/FixMyBerlin/private-issues/issues/1775

    checkBounds.current = false
  }

  if (
    map &&
    mapLoaded && // before map is not completely loaded we can't queryRenderedFeatures()
    // TODO: See https://github.com/FixMyBerlin/private-issues/issues/1775

    checkBounds.current && // run this at most once
    inspectorSize.width !== 0 // size of the inspector needs to be known to check bounding box
  ) {
    const boundingPolygon = createBoundingPolygon(map, sidebarSize, inspectorSize)
    const urlFeatures = selectedFeatures.map((f) => f.urlFeature)
    if (!allUrlFeaturesInBounds(urlFeatures, boundingPolygon)) {
      fitBounds(map, urlFeatures, sidebarSize, inspectorSize)
    }
    // TODO: See https://github.com/FixMyBerlin/private-issues/issues/1775

    checkBounds.current = false
  }

  const features = inspectorFeatures.length
    ? inspectorFeatures
    : selectedFeatures.map((f) => f.mapFeature).filter(Boolean)

  const renderFeatures = !!features.length

  const { setFeaturesParam } = useFeaturesParam()
  const handleClose = () => {
    setFeaturesParam(null)
    clearInspectorFeatures()
  }

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
            // biome-ignore lint/security/noDangerouslySetInnerHtml: static CSS for map controls
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
