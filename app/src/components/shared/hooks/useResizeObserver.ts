import { useCallback, useEffect, useEffectEvent, useState } from 'react'

type ResizeObserverBoxOptions = 'border-box' | 'content-box' | 'device-pixel-content-box'

type UseResizeObserverOptions<_T extends HTMLElement = HTMLElement> = {
  box?: ResizeObserverBoxOptions
  onResize?: (size: { width?: number; height?: number }) => void
}

export default function useResizeObserver<T extends HTMLElement = HTMLElement>(
  options: UseResizeObserverOptions<T> = {},
) {
  const { box = 'content-box', onResize } = options
  const [element, setElement] = useState<T | null>(null)

  // Non-reactive: keep the observer subscribed; always invoke the latest onResize.
  const onResizeEvent = useEffectEvent((size: { width?: number; height?: number }) => {
    onResize?.(size)
  })

  useEffect(
    function observeElementSize() {
      if (!element) return

      const observer = new ResizeObserver((entries) => {
        if (!entries.length) return

        const entry = entries[0]
        if (!entry) return

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

        onResizeEvent({ width, height })
      })

      observer.observe(element, { box })
      return function disconnectObserver() {
        observer.disconnect()
      }
    },
    [element, box],
  )

  const ref = useCallback((node: T | null) => {
    setElement(node)
  }, [])

  return { ref }
}
