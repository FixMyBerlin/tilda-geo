import { ChatBubbleLeftRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import {
  useNewOsmNoteMapParam,
  useShowOsmNotesParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesOsmParams'
import {
  mobileMapIconButtonClassName,
  notesSplitControlGroupClassName,
  notesSplitControlSegmentClassName,
} from '@/components/regionen/pageRegionSlug/mobile/mobileControlButton.const'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { useNotesActiveByZoom } from '../utils/useNotesActiveByZoom'
import { OsmNotesFilterControl } from './OsmNotesControls/OsmNotesFilterControl'

type Props = { isLoading: boolean; isError: boolean }

export const OsmNotesControls = ({ isLoading, isError }: Props) => {
  const { showOsmNotesParam, setShowOsmNotesParam } = useShowOsmNotesParam()
  const { setNewOsmNoteMapParam } = useNewOsmNoteMapParam()
  const { mapParam } = useMapParam()
  const notesActiveByZoom = useNotesActiveByZoom()

  return (
    <div className={twMerge('relative flex', showOsmNotesParam && notesSplitControlGroupClassName)}>
      <Tooltip
        text={
          notesActiveByZoom
            ? showOsmNotesParam
              ? 'Hinweise von openstreetmap.org ausblenden'
              : 'Hinweise von openstreetmap.org anzeigen'
            : 'Hinweise von openstreetmap.org sind erst ab Zoomstufe 10 verfügbar; bitte zoomen Sie näher heran.'
        }
      >
        <button
          type="button"
          onClick={() => setShowOsmNotesParam(!showOsmNotesParam)}
          className={twMerge(
            mobileMapIconButtonClassName,
            'z-0',
            isError && 'size-auto px-3 py-2',
            showOsmNotesParam && 'rounded-none shadow-none',
            showOsmNotesParam
              ? notesActiveByZoom
                ? 'bg-yellow-400'
                : 'bg-orange-400'
              : 'bg-white hover:bg-yellow-50',
          )}
        >
          {isLoading ? (
            <div className="flex size-5 items-center justify-center overflow-hidden">
              <SmallSpinner />
            </div>
          ) : (
            <ChatBubbleLeftRightIcon className="size-6" />
          )}
          {isError && <span className="ml-1 text-orange-500">Fehler beim Laden der Hinweise</span>}
        </button>
      </Tooltip>

      {showOsmNotesParam && (
        <>
          <OsmNotesFilterControl />
          <Tooltip text="Hinweis auf openstreetmap.org erstellen">
            <button
              type="button"
              // Default zoom since Note pins on osm.org are only visible when zoomed in…
              onClick={() => setNewOsmNoteMapParam(mapParam)}
              className={twMerge(
                notesSplitControlSegmentClassName,
                'bg-white hover:bg-yellow-50 hover:text-gray-800',
              )}
            >
              <PlusIcon className="size-6" />
              <span className="sr-only">Neuen Hinweis auf openstreetmap.org erstellen</span>
            </button>
          </Tooltip>
        </>
      )}
    </div>
  )
}
