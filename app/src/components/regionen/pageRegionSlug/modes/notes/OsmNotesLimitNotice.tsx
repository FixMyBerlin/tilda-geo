import { useMap } from 'react-map-gl/maplibre'
import { twMerge } from 'tailwind-merge'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { modePanelSmallButtonClassName } from '../modePanel.const'
import { OSM_NOTES_BBOX_LIMIT, osmNotesHitBboxLimit } from './osmNotesQueryOptions'
import { useOsmNotesQuery } from './useOsmNotesQuery'

/**
 * OSM `/notes.json?bbox=` returns at most 100 notes (most recently updated), with no truncated
 * flag in the body. Show this when the page is full so a dense view is not mistaken for all notes.
 */
export const OsmNotesLimitNotice = () => {
  const { data } = useOsmNotesQuery()
  const { mapParam } = useMapParam()
  const { mainMap } = useMap()
  const count = data?.features.length ?? 0
  if (!osmNotesHitBboxLimit(count)) return null

  const nextZoom = Math.min((mapParam?.zoom ?? 0) + 1, 22)

  return (
    <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-yellow-200 bg-yellow-50 px-4 py-2">
      <p className="text-sm text-yellow-900">
        OpenStreetMap liefert höchstens {OSM_NOTES_BBOX_LIMIT} zuletzt geänderte Hinweise in diesem
        Kartenausschnitt. Zoome näher heran, um alle zu sehen.
      </p>
      <button
        type="button"
        className={twMerge(modePanelSmallButtonClassName, 'shrink-0 border-yellow-300 bg-white')}
        disabled={!mainMap}
        onClick={() => {
          mainMap?.zoomTo(nextZoom, { duration: 600 })
        }}
      >
        Hineinzoomen
      </button>
    </div>
  )
}
