import { type RefObject, useCallback, useRef } from 'react'
import useResizeObserver from './useResizeObserver'

type ElementSize = { width: number; height: number }

type UseElementSizeOptions<T extends HTMLElement> = {
  // Mirror the observed node here so callers can read it without wrapping the returned ref.
  elementRef?: RefObject<T | null>
}

// Observe an element's border-box size; reports only fully-measured (defined) sizes.
export function useElementSize<T extends HTMLElement = HTMLElement>(
  onResize: (size: ElementSize) => void,
  options: UseElementSizeOptions<T> = {},
) {
  const { elementRef } = options
  const onResizeRef = useRef(onResize)
  onResizeRef.current = onResize

  // Stable callback required: useResizeObserver reconnects whenever onResize identity changes.
  const handleResize = useCallback((size: { width?: number; height?: number }) => {
    const { width, height } = size
    if (width === undefined || height === undefined) return
    onResizeRef.current({ width, height })
  }, [])

  const { ref: observerRef } = useResizeObserver<T>({ box: 'border-box', onResize: handleResize })

  return useCallback(
    (node: T | null) => {
      if (elementRef) elementRef.current = node
      observerRef(node)
    },
    [elementRef, observerRef],
  )
}
