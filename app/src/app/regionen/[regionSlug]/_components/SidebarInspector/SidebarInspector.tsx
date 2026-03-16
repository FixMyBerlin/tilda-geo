import { Spinner } from '@/src/app/_components/Spinner/Spinner'
import { useSelectedFeatures } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useFeaturesParam/useSelectedFeatures'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import useResizeObserver from 'use-resize-observer'
import {
  useInspectorWidthStore,
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
import { ResizeHandle } from './ResizeHandle'
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

  // Resize functionality
  const inspectorWidth = useInspectorWidthStore((state) => state.inspectorWidth)
  const setInspectorWidth = useInspectorWidthStore((state) => state.setInspectorWidth)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const resizeHandleRef = useRef<HTMLDivElement | null>(null)
  const styleElementRef = useRef<HTMLStyleElement | null>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  const lastWidthRef = useRef(0)

  const updateWidth = useCallback((width: number) => {
    lastWidthRef.current = width
    if (containerRef.current) {
      containerRef.current.style.width = `${width}px`
    }
    if (resizeHandleRef.current) {
      resizeHandleRef.current.style.right = `${width - 1}px`
    }
    if (styleElementRef.current) {
      styleElementRef.current.textContent = `.maplibregl-ctrl-top-right { right: ${width}px } [data-map-controls="true"] { right: calc(${width}px + 10px) }`
    }
  }, [])

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)
      startXRef.current = e.clientX
      startWidthRef.current = inspectorWidth
    },
    [inspectorWidth],
  )

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startXRef.current - e.clientX
      const newWidth = startWidthRef.current + delta
      // Min: 320px (20rem), Max: 800px (50rem)
      const clampedWidth = Math.min(Math.max(newWidth, 320), 800)
      updateWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      const finalWidth = lastWidthRef.current
      // Save to persistent store only once
      setInspectorWidth(finalWidth)
      setIsResizing(false)

      // Update inspectorSize in store after resize is complete
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight
        setInspectorSize({ width: finalWidth, height })
      }
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, setInspectorWidth, updateWidth])

  const { ref: observerRef } = useResizeObserver<HTMLDivElement>({
    box: 'border-box',
    onResize: ({ width, height }) => {
      // Don't update store during manual resize to prevent re-renders
      if (isResizing) return
      if (width !== undefined && height !== undefined) {
        setInspectorSize({ width, height })
      }
    },
  })

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node
      observerRef(node)
    },
    [observerRef],
  )

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
  const handleClose = useCallback(() => {
    setFeaturesParam(null)
    resetInspectorFeatures()
  }, [setFeaturesParam, resetInspectorFeatures])

  return (
    <div
      ref={ref}
      style={{ width: `${inspectorWidth}px` }}
      className={twJoin(
        'absolute top-0 right-0 bottom-0 z-20 max-w-full overflow-y-scroll bg-white p-5 pr-3 shadow-md',
        !renderFeatures && 'pointer-events-none opacity-0',
      )}
    >
      {isResizing && (
        <div
          className="fixed inset-0 z-50 cursor-col-resize"
          style={{ background: 'rgba(147, 51, 234, 0.05)' }}
        />
      )}
      <Suspense fallback={<Spinner />}>
        {renderFeatures ? (
          <>
            <ResizeHandle
              ref={resizeHandleRef}
              onResizeStart={handleResizeStart}
              inspectorWidth={inspectorWidth}
            />
            <InspectorHeader count={features.length} handleClose={handleClose} />
            <Inspector features={features} />
            <style
              ref={styleElementRef}
              dangerouslySetInnerHTML={{
                __html: `.maplibregl-ctrl-top-right { right: ${inspectorWidth}px } [data-map-controls="true"] { right: calc(${inspectorWidth}px + 10px) }`,
              }}
            />
          </>
        ) : null}
      </Suspense>
    </div>
  )
}
