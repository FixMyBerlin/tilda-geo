import { ChatBubbleLeftRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import {
  useNewInternalNoteMapParam,
  useShowInternalNotesParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import {
  mobileMapIconButtonClassName,
  notesSplitControlFirstSegmentClassName,
  notesSplitControlGroupClassName,
  notesSplitControlLastSegmentClassName,
} from '@/components/regionen/pageRegionSlug/mobile/mobileControlButton.const'
import { captureModalOpenOrigin } from '@/components/shared/motion/modalOpenOrigin'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
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
    <div
      className={twMerge(
        'relative flex',
        showInternalNotesParam && notesSplitControlGroupClassName,
      )}
    >
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
          type="button"
          onClick={() => setShowInternalNotesParam(!showInternalNotesParam)}
          className={twMerge(
            mobileMapIconButtonClassName,
            'relative z-0',
            isError && 'size-auto px-3 py-2',
            showInternalNotesParam && notesSplitControlFirstSegmentClassName,
            showInternalNotesParam
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
            <>
              <ChatBubbleLeftRightIcon className="size-6" aria-hidden="true" />
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
              type="button"
              // Default zoom since Note pins on osm.org are only visible when zoomed in…
              onClick={(e) => {
                captureModalOpenOrigin(e.currentTarget)
                setNewInternalNoteMapParam(mapParam)
              }}
              className={twMerge(
                notesSplitControlLastSegmentClassName,
                'bg-white hover:bg-yellow-50 hover:text-gray-800',
              )}
            >
              <PlusIcon className="size-6" aria-hidden="true" />
              <span className="sr-only">Neuen Interne Hinweis erstellen</span>
            </button>
          </Tooltip>
        </>
      )}
    </div>
  )
}
