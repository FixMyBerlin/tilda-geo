import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import { Tooltip } from '@/src/app/_components/Tooltip/Tooltip'
import { useMapParam } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useMapParam'
import { ChatBubbleLeftRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import {
  useNewInternalNoteMapParam,
  useShowInternalNotesParam,
} from '../../../_hooks/useQueryState/useNotesAtlasParams'
import { useNotesActiveByZoom } from '../utils/useNotesActiveByZoom'
import { InternalNotesDownloadModal } from './InternalNotesControls/InternalNotesDownloadModal'
import { InternalNotesFilterControl } from './InternalNotesControls/InternalNotesFilterControl'

type Props = { totalNotes: number | undefined; isLoading: boolean; isError: boolean }

export const InternalNotesControls = ({ totalNotes, isLoading, isError }: Props) => {
  const { showInternalNotesParam, setShowInternalNotesParam } = useShowInternalNotesParam()
  const { setNewInternalNoteMapParam } = useNewInternalNoteMapParam()
  const { mapParam } = useMapParam()
  const notesActiveByZoom = useNotesActiveByZoom()

  return (
    <div className="relative flex shadow-lg">
      <Tooltip
        text={
          notesActiveByZoom
            ? showInternalNotesParam
              ? 'Interne Hinweise ausblenden'
              : 'Interne Hinweise anzeigen'
            : 'Interne Hinweise sind erst ab Zoomstufe 10 verfügbar; bitte zoomen Sie näher heran.'
        }
      >
        <button
          onClick={() => setShowInternalNotesParam(!showInternalNotesParam)}
          className={twJoin(
            'relative z-0 inline-flex justify-center border border-gray-300 px-3 py-2 text-sm font-medium shadow-md focus:relative focus:z-10 focus:outline-none focus:ring-2 focus:ring-yellow-500',
            showInternalNotesParam ? 'rounded-l-md' : 'rounded-md',
            showInternalNotesParam ? 'text-gray-700' : 'text-gray-500 hover:text-gray-700',
            showInternalNotesParam
              ? notesActiveByZoom
                ? 'bg-yellow-400'
                : 'bg-orange-400'
              : 'bg-white hover:bg-yellow-50',
          )}
        >
          {isLoading ? (
            <div className="flex size-5 items-center justify-center overflow-hidden">
              {/* Wrapper required to cut off some additional space that <Spinner> has */}
              <SmallSpinner />
            </div>
          ) : (
            <>
              <ChatBubbleLeftRightIcon className="size-5" aria-hidden="true" />
              {showInternalNotesParam && Boolean(totalNotes) && (
                <div
                  className="absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-700 px-1 text-xs tracking-tighter text-yellow-400"
                  style={{ top: '0.125em', right: '0.125em' }}
                >
                  {totalNotes}
                </div>
              )}
            </>
          )}
          {isError && <span className="ml-1 text-orange-500">Fehler beim Laden der Hinweise</span>}
        </button>
      </Tooltip>

      {showInternalNotesParam && (
        <>
          <InternalNotesFilterControl />
          <InternalNotesDownloadModal />
          <Tooltip text="Interne Hinweis erstellen">
            <button
              // Default zoom since Note pins on osm.org are only visible when zoomed in…
              onClick={() => setNewInternalNoteMapParam(mapParam)}
              className="z-0 -ml-px inline-flex justify-center rounded-r-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-md hover:bg-yellow-50 hover:text-gray-800 focus:relative focus:z-10 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <PlusIcon className="size-5" aria-hidden="true" />
              <span className="sr-only">Neuen Interne Hinweis erstellen</span>
            </button>
          </Tooltip>
        </>
      )}
    </div>
  )
}
