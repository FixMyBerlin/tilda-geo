import { useCallback, useRef } from 'react'
import useResizeObserver from '@/components/shared/hooks/useResizeObserver'

/**
 * One-time overlay size measurement for map-fit geometry.
 *
 * We only need panel dimensions when deciding whether URL-selected features fit
 * in the visible map area (createBoundingPolygon / fitBounds). That check runs
 * once after load. Writing size to the shared store on every ResizeObserver
 * callback caused unnecessary churn and ResizeObserver loop warnings. This hook
 * observes the ref'd element, forwards the first valid { width, height } to the
 * given setter, then ignores further resize events. Returns only the ref to
 * attach to the measured element.
 */
export function useInitialSizeMeasurement<T extends HTMLElement = HTMLElement>(
  setSize: (size: { width: number; height: number }) => void,
) {
  const hasMeasured = useRef(false)

  const onResize = useCallback(
    (size: { width?: number; height?: number }) => {
      if (hasMeasured.current) return
      const { width, height } = size
      if (width === undefined || height === undefined) return
      hasMeasured.current = true
      setSize({ width, height })
    },
    [setSize],
  )

  const { ref } = useResizeObserver<T>({
    box: 'border-box',
    onResize,
  })

  return ref
}
