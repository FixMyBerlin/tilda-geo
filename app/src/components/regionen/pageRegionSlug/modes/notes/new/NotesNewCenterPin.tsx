import { MapPinIcon } from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { modeIdentity } from '../../modeIdentity'
import { ModeMapHint } from '../../ModeMapHint'
import { useNotesComposeActive } from '../useNotesComposeActive'

/**
 * Visual pin at the map canvas center while composing a note. The crosshair center sits at
 * 50%/50% — location is always `mainMap.getCenter()`, not a geographic Marker.
 */
export const NotesNewCenterPin = () => {
  const notesComposeActive = useNotesComposeActive()
  if (!notesComposeActive) return null
  return <NotesNewCenterPinSession />
}

const NotesNewCenterPinSession = () => {
  const { mainMap } = useMap()
  const [showHint, setShowHint] = useState(true)

  useEffect(
    function dismissHintOnFirstMapDrag() {
      if (!mainMap || !showHint) return
      const onDragStart = () => setShowHint(false)
      mainMap.on('dragstart', onDragStart)
      return function removeDragStartListener() {
        mainMap.off('dragstart', onDragStart)
      }
    },
    [mainMap, showHint],
  )

  const { accent } = modeIdentity.notes

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Crosshair center = map canvas center; pin tucks into the upper notch (old NotesNewMap stack). */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className={twJoin(
            'relative size-7 drop-shadow-[0_0_1px_rgba(255,255,255,0.95)]',
            accent.textClassName,
          )}
          aria-hidden
        >
          <span className="absolute top-1/2 left-1/2 h-0.5 w-full -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-current" />
          <span className="absolute top-1/2 left-1/2 h-0.5 w-full -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
          <MapPinIcon
            className="absolute bottom-full left-1/2 size-12 -translate-x-1/2 translate-y-2.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
            aria-hidden
          />
        </div>
      </div>
      {showHint ? (
        <ModeMapHint anchor="pin">
          Karte verschieben, bis das Kreuz an der Stelle für den Hinweis liegt.
        </ModeMapHint>
      ) : null}
    </div>
  )
}
