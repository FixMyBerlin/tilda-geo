import { useCallback, useEffect, useRef } from 'react'

type ResizeObserverBoxOptions = 'border-box' | 'content-box' | 'device-pixel-content-box'

type UseResizeObserverOptions<_T extends HTMLElement = HTMLElement> = {
  box?: ResizeObserverBoxOptions
  onResize?: (size: { width?: number; height?: number }) => void
}

export default function useResizeObserver<T extends HTMLElement = HTMLElement>(
  options: UseResizeObserverOptions<T> = {},
) {
  const { box = 'content-box', onResize } = options
  const elementRef = useRef<T | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  const ref = useCallback(
    (element: T | null) => {
      // Clean up previous observer
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }

      elementRef.current = element

      if (!element) {
        return
      }

      // Create new observer
      observerRef.current = new ResizeObserver((entries) => {
        if (!entries.length) return

        const entry = entries[0]
        let width: number | undefined
        let height: number | undefined

        if (box === 'border-box') {
          width = entry.borderBoxSize?.[0]?.inlineSize
          height = entry.borderBoxSize?.[0]?.blockSize
        } else if (box === 'content-box') {
          width = entry.contentBoxSize?.[0]?.inlineSize
          height = entry.contentBoxSize?.[0]?.blockSize
        } else if (box === 'device-pixel-content-box') {
          width = entry.devicePixelContentBoxSize?.[0]?.inlineSize
          height = entry.devicePixelContentBoxSize?.[0]?.blockSize
        }

        // Fallback to contentRect for older browsers
        if (width === undefined || height === undefined) {
          width = entry.contentRect.width
          height = entry.contentRect.height
        }

        onResize?.({ width, height })
      })

      observerRef.current.observe(element, { box })
    },
    [box, onResize],
  )

  // Cleanup on unmount
  useEffect(function disconnectObserverOnUnmount() {
    return function disconnectObserver() {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [])

  return { ref }
}
