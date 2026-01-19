import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import { Tooltip } from '@/src/app/_components/Tooltip/Tooltip'
import { useMapParam } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useMapParam'
import { ChatBubbleLeftRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import {
  useNewOsmNoteMapParam,
  useShowOsmNotesParam,
} from '../../../_hooks/useQueryState/useNotesOsmParams'
import { useNotesActiveByZoom } from '../utils/useNotesActiveByZoom'
import { OsmNotesFilterControl } from './OsmNotesControls/OsmNotesFilterControl'

type Props = { isLoading: boolean; isError: boolean }

export const OsmNotesControls = ({ isLoading, isError }: Props) => {
  const { showOsmNotesParam, setShowOsmNotesParam } = useShowOsmNotesParam()
  const { setNewOsmNoteMapParam } = useNewOsmNoteMapParam()
  const { mapParam } = useMapParam()
  const notesActiveByZoom = useNotesActiveByZoom()

  return (
    <div className="relative flex shadow-lg">
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
          onClick={() => setShowOsmNotesParam(!showOsmNotesParam)}
          className={twJoin(
            'z-0 inline-flex justify-center border border-gray-300 px-3 py-2 text-sm font-medium shadow-md focus:relative focus:z-10 focus:ring-2 focus:ring-yellow-500 focus:outline-none',
            showOsmNotesParam ? 'rounded-l-md' : 'rounded-md',
            showOsmNotesParam ? 'text-gray-700' : 'text-gray-500 hover:text-gray-700',
            showOsmNotesParam
              ? notesActiveByZoom
                ? 'bg-yellow-400'
                : 'bg-orange-400'
              : 'bg-white hover:bg-yellow-50',
          )}
        >
          {isLoading ? (
            <div className="flex h-5 w-5 items-center justify-center overflow-hidden">
              {/* Wrapper required to cut off some additional space that <Spinner> has */}
              <SmallSpinner />
            </div>
          ) : (
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
          )}
          {isError && <span className="ml-1 text-orange-500">Fehler beim Laden der Hinweise</span>}
        </button>
      </Tooltip>

      {showOsmNotesParam && (
        <>
          <OsmNotesFilterControl />
          <Tooltip text="Hinweis auf openstreetmap.org erstellen">
            <button
              // Default zoom since Note pins on osm.org are only visible when zoomed in…
              onClick={() => setNewOsmNoteMapParam(mapParam)}
              className="z-0 -ml-px justify-center rounded-r-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-md hover:bg-yellow-50 hover:text-gray-800 focus:relative focus:z-10 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            >
              <PlusIcon className="size-5" />
              <span className="sr-only">Neuen Hinweis auf openstreetmap.org erstellen</span>
            </button>
          </Tooltip>
        </>
      )}
    </div>
  )
}
