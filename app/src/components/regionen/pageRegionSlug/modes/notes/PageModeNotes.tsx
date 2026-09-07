import { PlusIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useOsmNotesActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { useNewInternalNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import { useNewOsmNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesOsmParams'
import { useRegionSearchNavigation } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useRegionSearchNavigation'
import { serializeMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParam'
import { internalNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersInternalNotes'
import { osmNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersOsmNotes'
import { RegionMembershipCallout } from '@/components/regionen/pageRegionSlug/RegionMembershipCallout'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { authClient } from '@/components/shared/auth/auth-client'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { getNoteAndCommentsFn } from '@/server/notes/notes.functions'
import { internalNotesQueryOptions } from '@/server/regions/regionQueryOptions'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useFilteredOsmNotes } from '../../Map/SourcesAndLayers/utils/useFilteredOsmNotes'
import { DraftIndicatorDot } from '../composerDrafts/DraftIndicatorDot'
import { useHasNewNoteComposerDraft } from '../composerDrafts/useHasComposerDraft'
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
import { notesAuthorFilterOptions, uniqueOsmNoteAuthorNames } from './notesModeFilters'
import { NotesModeList } from './NotesModeList'
import { internalNotesToListEntries, osmNotesToListEntries } from './notesModeListEntry'
import { notesModeToServerFilter } from './notesModeParam'
import { resolveNotesSelection, type NotesSelection } from './notesSelection'
import { useNotesModeParam } from './useNotesModeParam'
import { useOsmNotesQuery } from './useOsmNotesQuery'

export const PageModeNotes = () => {
  const region = useRegion()
  const hasPermissions = useHasPermissions()
  const { data: session } = authClient.useSession()
  const isAuthenticated = Boolean(session?.user)
  const { mainMap } = useMap()
  const { mapParam } = useMapParam()
  const { clearInspectorFeatures } = useMapActions()
  const { setOsmNewNoteFeature } = useOsmNotesActions()
  const { selected, clearModeDetail } = useModeDetailSelection()
  const { notesMode, setNotesModeParam } = useNotesModeParam()
  const { newOsmNoteMapParam, setNewOsmNoteMapParam } = useNewOsmNoteMapParam()
  const { newInternalNoteMapParam, setNewInternalNoteMapParam } = useNewInternalNoteMapParam()
  const { updateSearch } = useRegionSearchNavigation()

  const hasInternalNotes = region.notesInternal
  const hasOsmNotes = region.notesOsm
  const lacksInternalAccess = hasInternalNotes && !hasPermissions

  const extent = notesMode.extent ?? 'view'
  const serverFilter = notesModeToServerFilter(notesMode)

  const selection = resolveNotesSelection({
    hasInternalNotes: hasInternalNotes && hasPermissions,
    hasOsmNotes,
  }) satisfies NotesSelection
  const showingOsm = selection.kind === 'osm'
  const showInternalAuthCallout = lacksInternalAccess
  const hasNewNoteDraft = useHasNewNoteComposerDraft(region.slug, showingOsm ? 'osm' : 'internal')

  const composingOsm = Boolean(newOsmNoteMapParam)
  const composingInternal = Boolean(newInternalNoteMapParam)
  const isComposing = composingOsm || composingInternal

  const {
    data: internalData,
    isLoading: isInternalLoading,
    isError: isInternalError,
  } = useQuery({
    ...internalNotesQueryOptions(region.slug, serverFilter),
    enabled: selection.kind === 'internal' && hasPermissions && !isComposing,
  })
  const { isError: isOsmError } = useOsmNotesQuery()
  const osmCollection = useFilteredOsmNotes(serverFilter)

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

  const entries = showingOsm
    ? osmNotesToListEntries(osmCollection.features)
    : internalNotesToListEntries(internalData?.featureCollection)

  const authors = internalData?.authors ?? []
  const osmAuthorNames = showingOsm ? uniqueOsmNoteAuthorNames(osmCollection.features) : []
  const myAuthorValue = showingOsm
    ? session?.user?.additionalFields?.osmName || undefined
    : (authors.find((author) => author.currentUser)?.id ?? session?.user?.id)
  const authorOptions = notesAuthorFilterOptions({
    authors: showingOsm ? [] : authors,
    osmAuthorNames,
    myValue: myAuthorValue,
  })
  const notesCollectionOptions = showingOsm
    ? [{ value: 'osm', label: 'OpenStreetMap-Hinweise (öffentlich)', private: false }]
    : selection.kind === 'internal'
      ? [{ value: 'internal', label: 'TILDA-Hinweise', private: true }]
      : []

  const openNewNote = () => {
    if (!mapParam) return
    clearInspectorFeatures()
    const createKey = showingOsm ? searchParamsRegistry.osmNote : searchParamsRegistry.internalNote
    updateSearch(
      {
        [createKey]: serializeMapParam(mapParam),
        [searchParamsRegistry.f]: undefined,
      },
      { replace: true },
    )
  }

  const closeCompose = () => {
    setNewOsmNoteMapParam(null)
    setNewInternalNoteMapParam(null)
    setOsmNewNoteFeature(undefined)
  }

  const composePin = newOsmNoteMapParam ?? newInternalNoteMapParam
  const composePinKey = composePin ? `${composePin.zoom}/${composePin.lat}/${composePin.lng}` : null

  // Bookmark / inspector open: fly main map to the create-param pin when compose starts or the pin changes.
  useEffect(
    function flyMainMapToComposePinOnEnter() {
      if (!mainMap || !composePinKey) return
      const parts = composePinKey.split('/')
      const zoom = Number(parts[0])
      const lat = Number(parts[1])
      const lng = Number(parts[2])
      if (!Number.isFinite(zoom) || !Number.isFinite(lat) || !Number.isFinite(lng)) return
      const center = mainMap.getCenter()
      const currentZoom = mainMap.getZoom()
      const samePlace =
        Math.abs(center.lat - lat) < 1e-5 &&
        Math.abs(center.lng - lng) < 1e-5 &&
        Math.abs(currentZoom - zoom) < 0.05
      if (samePlace) return
      mainMap.flyTo({ center: [lng, lat], zoom })
    },
    [mainMap, composePinKey],
  )

  const composeDetail = isComposing
    ? {
        title: composingOsm ? 'Neuer Hinweis auf OpenStreetMap' : 'Neuer interner Hinweis',
        onBack: closeCompose,
        children: !isAuthenticated ? (
          <NotesNewLoginNotice />
        ) : composingOsm ? (
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

  return (
    <ModePanel
      title="Hinweise"
      detail={panelDetail}
      collection={
        notesCollectionOptions[0] ? (
          <ModeCollectionSelect
            aria-label="Hinweise-Sammlung"
            value={notesCollectionOptions[0].value}
            options={notesCollectionOptions}
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
            {showingOsm ? null : <InternalNotesDownloadModal />}
          </>
        )
      }
      filter={
        showInternalAuthCallout || panelDetail ? undefined : (
          <NotesModeFilterBar
            notesMode={notesMode}
            setNotesModeParam={setNotesModeParam}
            showingOsm={showingOsm}
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
          selectionKind={selection.kind}
          isInternalLoading={isInternalLoading}
          isInternalError={isInternalError}
          isOsmError={isOsmError}
          extent={extent}
        />
      )}
    </ModePanel>
  )
}
