import type { ReactNode } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { useElementSize } from '@/components/shared/hooks/useElementSize'

/** Keeps MapLibre in sync when the map flex column grows or shrinks (e.g. mode panel width spring). */
export const MapLayoutResizeSync = ({ children }: { children: ReactNode }) => {
  const { mainMap } = useMap()

  const ref = useElementSize(() => {
    mainMap?.resize()
  })

  return (
    <div ref={ref} className="relative h-full grow">
      {children}
    </div>
  )
}
