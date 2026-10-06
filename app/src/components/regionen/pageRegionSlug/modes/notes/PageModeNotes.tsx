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
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { authClient } from '@/components/shared/auth/auth-client'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { getNoteAndCommentsFn } from '@/server/notes/notes.functions'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { DraftIndicatorDot } from '../composerDrafts/DraftIndicatorDot'
import { ModePanel } from '../ModePanel'
import {
  modePanelHeaderIconButtonClassName,
  modePanelMutedClassName,
  modePanelPrimaryButtonClassName,
} from '../modePanel.const'
import { sharedWithRegionsSubtitle } from '../sharedWithRegions'
import { useModeDetailSelection } from '../useModeDetailSelection'
import { EditNoteResolvedAtForm } from './detail/EditNoteResolvedAtForm'
import { NoteFolderMoveSelect } from './detail/NoteFolderMoveSelect'
import { NotesDetailInternal } from './detail/NotesDetailInternal'
import {
  NotesDetailOsm,
  NotesDetailOsmHeaderMeta,
  NotesDetailOsmStatusBadge,
} from './detail/NotesDetailOsm'
import { InternalNotesNewForm } from './new/InternalNotesNewForm'
import { NotesNewLoginNotice } from './new/NotesNewLoginNotice'
import { OsmNotesNewForm } from './new/OsmNotesNewForm'
import { NoteFolderManageMenu, NoteFolderSelect } from './NoteFolderSelect'
import { NotesModeFilterBar } from './NotesModeFilterBar'
import { NotesModeList } from './NotesModeList'
import {
  compactNotesModeParam,
  notesOsmCollectionKey,
  type NotesCollectionKey,
} from './notesModeParam'
import { compactNotesCollectionKey } from './notesSelection'
import { useAllowInternalNotes } from './useAllowInternalNotes'
import { useNoteFolderCommands } from './useNoteFolderCommands'
import { useNoteFolders } from './useNoteFolders'
import { useNotesModeListData } from './useNotesModeListData'
import { useNotesModeParam } from './useNotesModeParam'

export const PageModeNotes = () => {
  const { data: session } = authClient.useSession()
  const isAuthenticated = Boolean(session?.user)
  const region = useRegion()
  const allowInternalNotes = useAllowInternalNotes()
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

  const {
    folders,
    selectedFolderId,
    selectedFolder,
    isLoading: isFoldersLoading,
  } = useNoteFolders()
  const isInternal = kind === 'internal'

  const onSelectCollection = (selected: NotesCollectionKey) =>
    setNotesModeParam({
      ...notesMode,
      key: compactNotesCollectionKey({
        selected,
        firstFolderId: folders[0]?.id,
        hasOsmAndInternal: Boolean(region.notesOsm && region.notesInternal),
      }),
    })

  const onSelectFolder = (folderId: number) => onSelectCollection(folderId)

  const noteFolderCommands = useNoteFolderCommands({
    regionSlug: region.slug,
    folders,
    selectedFolderId,
    onSelect: onSelectFolder,
  })

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
    // A plain compose has no related map object; the inspector sets one before navigating here.
    setOsmNewNoteFeature(undefined)
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
      return `OSM-Hinweis #${selectedNoteId}`
    }
    return selectedInternalNote?.subject || selectedListEntry?.title || `Hinweis #${selectedNoteId}`
  })()

  const noteDetail =
    !isComposing && selected && selectedNoteId !== undefined && !Number.isNaN(selectedNoteId)
      ? {
          title: noteDetailTitle,
          titleBadge:
            selected.sourceId === osmNotesSourceId ? (
              <NotesDetailOsmStatusBadge key={selectedNoteId} noteId={selectedNoteId} />
            ) : undefined,
          subtitle:
            selected.sourceId === osmNotesSourceId ? (
              <NotesDetailOsmHeaderMeta key={selectedNoteId} noteId={selectedNoteId} />
            ) : undefined,
          onBack: clearModeDetail,
          children:
            selected.sourceId === osmNotesSourceId ? (
              <NotesDetailOsm key={selectedNoteId} noteId={selectedNoteId} />
            ) : (
              <NotesDetailInternal key={selectedNoteId} noteId={selectedNoteId} />
            ),
        }
      : undefined

  const panelDetail = composeDetail ?? noteDetail

  const panelTitle = showingOsm
    ? 'OSM-Hinweise'
    : isInternal && selectedFolder
      ? `Ordner ${frenchQuote(selectedFolder.name)}`
      : 'Hinweise'

  const panelSubtitle =
    !panelDetail && isInternal
      ? sharedWithRegionsSubtitle('Ordner', selectedFolder?.regions, region.slug)
      : undefined

  const hasNoFolders = isInternal && !isFoldersLoading && folders.length === 0
  const isFolderEmpty = isInternal && selectedFolder !== undefined && selectedFolder.noteCount === 0

  return (
    <ModePanel
      title={panelTitle}
      subtitle={panelSubtitle}
      detail={panelDetail}
      collectionAlwaysOpen={hasNoFolders}
      collection={
        region.notesOsm || isInternal ? (
          <NoteFolderSelect
            folders={folders}
            selected={showingOsm ? notesOsmCollectionKey : selectedFolderId}
            onSelect={onSelectCollection}
            showOsm={Boolean(region.notesOsm)}
            canCreateFolder={allowInternalNotes}
            currentRegionSlug={region.slug}
            commands={noteFolderCommands}
          />
        ) : undefined
      }
      actions={
        !isComposing && isInternalNoteSelected && selectedInternalNote ? (
          <>
            <EditNoteResolvedAtForm key={selectedInternalNote.id} note={selectedInternalNote} />
            <NoteFolderMoveSelect
              noteId={selectedInternalNote.id}
              currentFolderId={selectedInternalNote.folderId}
            />
          </>
        ) : showInternalAuthCallout || panelDetail ? undefined : hasNoFolders ? (
          <Tooltip text="Neuer Ordner">
            <button
              type="button"
              onClick={(event) => noteFolderCommands.openNameModal('create', event.currentTarget)}
              aria-label="Neuer Ordner"
              className={modePanelHeaderIconButtonClassName}
            >
              <PlusIcon className="size-5" aria-hidden />
            </button>
          </Tooltip>
        ) : (
          <>
            <button
              type="button"
              onClick={openNewNote}
              disabled={isInternal && selectedFolderId === undefined}
              aria-label="Neuer Hinweis"
              className={`relative ${modePanelPrimaryButtonClassName}`}
            >
              <PlusIcon className="size-5" aria-hidden />
              <span className="hidden @[30rem]/mode-panel:inline">Neuer Hinweis</span>
              <span className="hidden @[23rem]/mode-panel:inline @[30rem]/mode-panel:hidden">
                Hinweis
              </span>
              {hasNewNoteDraft ? <DraftIndicatorDot /> : null}
            </button>
            {isInternal ? <NoteFolderManageMenu commands={noteFolderCommands} /> : null}
          </>
        )
      }
      filter={
        showInternalAuthCallout || panelDetail ? undefined : (
          <NotesModeFilterBar
            notesMode={notesMode}
            setNotesModeParam={setNotesModeParam}
            showReactionFilter={capabilities.showReactionFilter}
            showExtentFilter={capabilities.showExtentFilter}
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
      ) : hasNoFolders ? (
        <div className="flex flex-col gap-3 px-4 py-4" role="status">
          <div className="flex items-center justify-between gap-3">
            <p className={modePanelMutedClassName}>
              Noch kein Ordner. Lege den ersten Ordner an, um Hinweise zu erfassen.
            </p>
            <button
              type="button"
              onClick={(event) => noteFolderCommands.openNameModal('create', event.currentTarget)}
              aria-label="Neuer Ordner"
              className={modePanelHeaderIconButtonClassName}
            >
              <PlusIcon className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      ) : isFolderEmpty ? (
        <div className="flex flex-col gap-3 px-4 py-4" role="status">
          <div className="flex items-center justify-between gap-3">
            <p className={modePanelMutedClassName}>Noch keine Hinweise in diesem Ordner.</p>
            <button
              type="button"
              onClick={openNewNote}
              aria-label="Neuer Hinweis"
              className={modePanelHeaderIconButtonClassName}
            >
              <PlusIcon className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <NotesModeList
          entries={entries}
          showingOsm={showingOsm}
          selectionKind={kind}
          isInternalLoading={isInternalLoading}
          isInternalError={isInternalError}
          isOsmError={isOsmError}
          extent={capabilities.showExtentFilter ? (notesMode.extent ?? 'view') : undefined}
        />
      )}
    </ModePanel>
  )
}
