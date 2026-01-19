import { Spinner } from '@/src/app/_components/Spinner/Spinner'
import { useSelectedFeatures } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useFeaturesParam/useSelectedFeatures'
import { Suspense, useRef } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import useResizeObserver from 'use-resize-observer'
import {
  useMapActions,
  useMapBounds,
  useMapInspectorFeatures,
  useMapInspectorSize,
  useMapLoaded,
  useMapSidebarSize,
} from '../../_hooks/mapState/useMapState'
import { useFeaturesParam } from '../../_hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { Inspector } from './Inspector'
import { InspectorHeader } from './InspectorHeader'
import { allUrlFeaturesInBounds, createBoundingPolygon, fitBounds } from './util'

export const SidebarInspector = () => {
  const checkBounds = useRef(true)

  const { mainMap: map } = useMap()
  const mapLoaded = useMapLoaded()
  const mapBounds = useMapBounds() // needed to trigger rerendering
  const inspectorFeatures = useMapInspectorFeatures()
  const selectedFeatures = useSelectedFeatures(!inspectorFeatures.length)
  const inspectorSize = useMapInspectorSize()
  const sidebarSize = useMapSidebarSize()

  const { resetInspectorFeatures, setInspectorSize } = useMapActions()

  const { ref } = useResizeObserver<HTMLDivElement>({
    box: 'border-box',
    onResize: ({ width, height }) => {
      if (width !== undefined && height !== undefined) {
        setInspectorSize({ width, height })
      }
    },
  })

  if (inspectorFeatures.length) {
    // TODO: See https://github.com/FixMyBerlin/private-issues/issues/1775
    // eslint-disable-next-line react-compiler/react-compiler
    checkBounds.current = false
  }

  if (
    map &&
    mapLoaded && // before map is not completely loaded we can't queryRenderedFeatures()
    // TODO: See https://github.com/FixMyBerlin/private-issues/issues/1775
    // eslint-disable-next-line react-compiler/react-compiler
    checkBounds.current && // run this at most once
    inspectorSize.width !== 0 // size of the inspector needs to be known to check bounding box
  ) {
    const boundingPolygon = createBoundingPolygon(map, sidebarSize, inspectorSize)
    const urlFeatures = selectedFeatures.map((f) => f.urlFeature)
    if (!allUrlFeaturesInBounds(urlFeatures, boundingPolygon)) {
      fitBounds(map, urlFeatures, sidebarSize, inspectorSize)
    }
    // TODO: See https://github.com/FixMyBerlin/private-issues/issues/1775
    // eslint-disable-next-line react-compiler/react-compiler
    checkBounds.current = false
  }

  const features = inspectorFeatures.length
    ? inspectorFeatures
    : selectedFeatures.map((f) => f.mapFeature).filter(Boolean)

  const renderFeatures = !!features.length

  const { setFeaturesParam } = useFeaturesParam()
  const handleClose = () => {
    setFeaturesParam(null)
    resetInspectorFeatures()
  }

  return (
    <div
      ref={ref}
      className={twJoin(
        'absolute top-0 right-0 bottom-0 z-20 w-[35rem] max-w-full overflow-y-scroll bg-white p-5 pr-3 shadow-md',
        !renderFeatures && 'pointer-events-none opacity-0',
      )}
    >
      <Suspense fallback={<Spinner />}>
        {renderFeatures ? (
          <>
            <InspectorHeader count={features.length} handleClose={handleClose} />
            <Inspector features={features} />
            <style
              dangerouslySetInnerHTML={{
                __html:
                  '.maplibregl-ctrl-top-right { right: 35rem } [data-map-controls="true"] { right: calc(35rem + 10px) }',
              }}
            />
          </>
        ) : null}
      </Suspense>
    </div>
  )
}
