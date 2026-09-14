import { PlusIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useOsmNotesActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import {
  useFlyMainMapToComposePin,
  useNotesComposePin,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesComposePin'
import { useRegionSearchNavigation } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useRegionSearchNavigation'
import { serializeMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParam'
import { internalNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersInternalNotes'
import { osmNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersOsmNotes'
import { RegionMembershipCallout } from '@/components/regionen/pageRegionSlug/RegionMembershipCallout'
import { authClient } from '@/components/shared/auth/auth-client'
import { getNoteAndCommentsFn } from '@/server/notes/notes.functions'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { DraftIndicatorDot } from '../composerDrafts/DraftIndicatorDot'
import { ModeCollectionSelect } from '../ModeCollectionSelect'
import { ModePanel } from '../ModePanel'
import { modePanelPrimaryButtonClassName } from '../modePanel.const'
import { useModeDetailSelection } from '../useModeDetailSelection'
import { NotesDetailInternal } from './detail/NotesDetailInternal'
import { NotesDetailOsm } from './detail/NotesDetailOsm'
import { InternalNotesDownloadModal } from './InternalNotesDownloadModal'
import { InternalNotesNewForm } from './new/InternalNotesNewForm'
import { NotesNewLoginNotice } from './new/NotesNewLoginNotice'
import { OsmNotesNewForm } from './new/OsmNotesNewForm'
import { NotesModeFilterBar } from './NotesModeFilterBar'
import { NotesModeList } from './NotesModeList'
import { compactNotesModeParam } from './notesModeParam'
import { useNotesModeListData } from './useNotesModeListData'
import { useNotesModeParam } from './useNotesModeParam'

export const PageModeNotes = () => {
  const { data: session } = authClient.useSession()
  const isAuthenticated = Boolean(session?.user)
  const { mapParam } = useMapParam()
  const { clearInspectorFeatures } = useMapActions()
  const { setOsmNewNoteFeature } = useOsmNotesActions()
  const { selected, clearModeDetail } = useModeDetailSelection()
  const { notesMode, setNotesModeParam } = useNotesModeParam()
  const { isComposing, clearComposeParams } = useNotesComposePin()
  const { updateSearch } = useRegionSearchNavigation()
  useFlyMainMapToComposePin()

  const {
    kind,
    showingOsm,
    entries,
    authorOptions,
    isInternalLoading,
    isInternalError,
    isOsmError,
    hasNewNoteDraft,
    showInternalAuthCallout,
    capabilities,
  } = useNotesModeListData()

  const extent = notesMode.extent ?? 'view'

  const selectedNoteId = selected ? Number(selected.id) : undefined
  const isInternalNoteSelected =
    selected?.sourceId === internalNotesSourceId &&
    selectedNoteId !== undefined &&
    !Number.isNaN(selectedNoteId)

  // Shares cache with NotesDetailInternal so the panel title can show the subject.
  const { data: selectedInternalNote } = useQuery({
    queryKey: ['notes', 'getNoteAndComments', { id: selectedNoteId }],
    queryFn: () => getNoteAndCommentsFn({ data: { id: selectedNoteId! } }),
    enabled: !isComposing && isInternalNoteSelected,
  })

  const openNewNote = () => {
    if (!mapParam) return
    clearInspectorFeatures()
    updateSearch(
      {
        [searchParamsRegistry.notes]: compactNotesModeParam({
          ...notesMode,
          new: serializeMapParam(mapParam),
        }),
        [searchParamsRegistry.f]: undefined,
      },
      { replace: true },
    )
  }

  const closeCompose = () => {
    clearComposeParams()
    setOsmNewNoteFeature(undefined)
  }

  const composeDetail = isComposing
    ? {
        title: showingOsm ? 'Neuer Hinweis auf OpenStreetMap' : 'Neuer interner Hinweis',
        onBack: closeCompose,
        children: !isAuthenticated ? (
          <NotesNewLoginNotice />
        ) : showingOsm ? (
          <OsmNotesNewForm />
        ) : (
          <InternalNotesNewForm />
        ),
      }
    : undefined

  const selectedListEntry = entries.find(
    (entry) => entry.id === selectedNoteId && entry.sourceId === selected?.sourceId,
  )

  const noteDetailTitle = (() => {
    if (selectedNoteId === undefined || Number.isNaN(selectedNoteId)) return 'Hinweis'
    if (selected?.sourceId === osmNotesSourceId) {
      return selectedListEntry?.title ?? `OSM-Hinweis #${selectedNoteId}`
    }
    return selectedInternalNote?.subject || selectedListEntry?.title || `Hinweis #${selectedNoteId}`
  })()

  const noteDetail =
    !isComposing && selected && selectedNoteId !== undefined && !Number.isNaN(selectedNoteId)
      ? {
          title: noteDetailTitle,
          onBack: clearModeDetail,
          children:
            selected.sourceId === osmNotesSourceId ? (
              <NotesDetailOsm noteId={selectedNoteId} />
            ) : (
              <NotesDetailInternal noteId={selectedNoteId} />
            ),
        }
      : undefined

  const panelDetail = composeDetail ?? noteDetail
  const collectionOption = capabilities.collectionOptions[0]

  return (
    <ModePanel
      title="Hinweise"
      detail={panelDetail}
      collection={
        collectionOption ? (
          <ModeCollectionSelect
            aria-label="Hinweise-Sammlung"
            value={collectionOption.value}
            options={capabilities.collectionOptions}
            readOnly
          />
        ) : undefined
      }
      actions={
        showInternalAuthCallout || panelDetail ? undefined : (
          <>
            <button
              type="button"
              onClick={openNewNote}
              className={`relative ${modePanelPrimaryButtonClassName}`}
            >
              <PlusIcon className="size-5" aria-hidden />
              Neuer Hinweis
              {hasNewNoteDraft ? <DraftIndicatorDot /> : null}
            </button>
            {capabilities.showDownload ? <InternalNotesDownloadModal /> : null}
          </>
        )
      }
      filter={
        showInternalAuthCallout || panelDetail ? undefined : (
          <NotesModeFilterBar
            notesMode={notesMode}
            setNotesModeParam={setNotesModeParam}
            showReactionFilter={capabilities.showReactionFilter}
            authorOptions={authorOptions}
          />
        )
      }
    >
      {showInternalAuthCallout ? (
        <RegionMembershipCallout
          className="px-4 py-3"
          accessMessage="Interne Hinweise stehen nur für Mitglieder dieser Region zur Verfügung."
        />
      ) : (
        <NotesModeList
          entries={entries}
          showingOsm={showingOsm}
          selectionKind={kind}
          isInternalLoading={isInternalLoading}
          isInternalError={isInternalError}
          isOsmError={isOsmError}
          extent={extent}
        />
      )}
    </ModePanel>
  )
}
