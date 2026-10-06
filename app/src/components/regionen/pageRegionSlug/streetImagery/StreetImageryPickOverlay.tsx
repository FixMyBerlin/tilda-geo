import { XMarkIcon } from '@heroicons/react/20/solid'
import { findLocationOpener } from '@osm-editor-kit/street-imagery'
import {
  useArmedLocationOpenerId,
  useLocationPickActions,
} from '@osm-editor-kit/street-imagery-react'
import { useEffect, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'

/** About three times the crosshair cursor, so the place that will open is easy to see. */
const RING_SIZE_PX = 72

/**
 * While an "open in …" service is armed (layer controls): a hint over the map and a ring that
 * follows the pointer. The click itself is handled by `<LocationPickOnMap>` inside the map.
 */
export const StreetImageryPickOverlay = () => {
  const armedOpenerId = useArmedLocationOpenerId()
  if (!armedOpenerId) return null
  return <StreetImageryPickOverlaySession openerId={armedOpenerId} />
}

type ArmedOpenerId = NonNullable<ReturnType<typeof useArmedLocationOpenerId>>

const StreetImageryPickOverlaySession = ({ openerId }: { openerId: ArmedOpenerId }) => {
  const { mainMap } = useMap()
  const { disarm } = useLocationPickActions()
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
  const opener = findLocationOpener(openerId)

  useEffect(
    function followPointerOverMap() {
      if (!mainMap) return
      const onMove = (event: { point: { x: number; y: number } }) =>
        setPointer({ x: event.point.x, y: event.point.y })
      const onOut = () => setPointer(null)
      mainMap.on('mousemove', onMove)
      mainMap.on('mouseout', onOut)
      return function stopFollowingPointer() {
        mainMap.off('mousemove', onMove)
        mainMap.off('mouseout', onOut)
      }
    },
    [mainMap],
  )

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {pointer && (
        <div
          aria-hidden
          className="absolute rounded-full border-2 border-yellow-500 bg-yellow-400/20 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
          style={{
            width: RING_SIZE_PX,
            height: RING_SIZE_PX,
            left: pointer.x - RING_SIZE_PX / 2,
            top: pointer.y - RING_SIZE_PX / 2,
          }}
        />
      )}
      <div className="absolute inset-x-4 top-[calc(var(--map-chrome-top-inset,0px)+4rem)] flex justify-center sm:top-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-sm bg-yellow-400 py-1.5 pr-1.5 pl-3 text-sm text-yellow-950 shadow-md">
          <span>
            Auf die Karte klicken, um den Ort in <strong>{opener?.label}</strong> zu öffnen.
          </span>
          <button
            type="button"
            onClick={disarm}
            className="flex-none cursor-pointer rounded-sm p-1 hover:bg-yellow-500 focus:ring-2 focus:ring-yellow-700 focus:outline-none"
          >
            <XMarkIcon className="size-4" aria-hidden="true" />
            <span className="sr-only">Abbrechen</span>
          </button>
        </div>
      </div>
    </div>
  )
}
