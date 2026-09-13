import { MapPinIcon } from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { modeAccentInvertedClassName, modeAccentStyle, modeIdentity } from '../../modeIdentity'
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
    function dismissHintOnFirstMapMove() {
      if (!mainMap || !showHint) return
      const onMove = () => setShowHint(false)
      mainMap.on('move', onMove)
      return function removeMoveListener() {
        mainMap.off('move', onMove)
      }
    },
    [mainMap, showHint],
  )

  const notesAccentStyle = modeAccentStyle(modeIdentity.notes.accent)

  return (
    <div className="pointer-events-none absolute inset-0 z-10" style={notesAccentStyle}>
      {/* Crosshair center = map canvas center; pin tucks into the upper notch (old NotesNewMap stack). */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="relative size-7 text-(--mode-accent) drop-shadow-[0_0_1px_rgba(255,255,255,0.95)]"
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
        <div
          className={twJoin(
            'absolute inset-x-4 top-[calc(50%+2.5rem)] z-50 rounded-sm p-1.5 text-center text-sm text-white shadow-sm sm:inset-x-20 sm:p-2',
            modeAccentInvertedClassName,
          )}
        >
          Bewegen Sie die Karte, um das Kreuz dort zu positionieren, wo Sie Ihren Hinweis eintragen
          möchten.
        </div>
      ) : null}
    </div>
  )
}
