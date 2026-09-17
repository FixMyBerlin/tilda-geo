import { useQuery } from '@tanstack/react-query'
import { useNotesComposePin } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesComposePin'
import { useFilteredOsmNotes } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/useFilteredOsmNotes'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { authClient } from '@/components/shared/auth/auth-client'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { internalNotesQueryOptions } from '@/server/regions/regionQueryOptions'
import { useHasNewNoteComposerDraft } from '../composerDrafts/useHasComposerDraft'
import { notesAuthorFilterOptions, uniqueOsmNoteAuthorNames } from './notesModeFilters'
import { internalNotesToListEntries, osmNotesToListEntries } from './notesModeListEntry'
import { notesModeToServerFilter } from './notesModeParam'
import { resolveNotesSelection } from './notesSelection'
import { useNotesModeParam } from './useNotesModeParam'
import { useOsmNotesQuery } from './useOsmNotesQuery'

/**
 * Dual-dataset notes list (OSM vs one internal collection). Next step is XOR via `notes.key`
 * (`osm` vs folder id) once both region flags can be on — OSM is a virtual folder, never shown
 * together with an internal folder.
 */
export const useNotesModeListData = () => {
  const region = useRegion()
  const hasPermissions = useHasPermissions()
  const { data: session } = authClient.useSession()
  const { notesMode } = useNotesModeParam()
  const { isComposing } = useNotesComposePin()

  const hasInternalNotes = region.notesInternal
  const hasOsmNotes = region.notesOsm
  const lacksInternalAccess = hasInternalNotes && !hasPermissions
  const selection = resolveNotesSelection({
    hasInternalNotes: hasInternalNotes && hasPermissions,
    hasOsmNotes,
  })
  const showingOsm = selection.kind === 'osm'
  const draftKind = showingOsm ? 'osm' : 'internal'
  const hasNewNoteDraft = useHasNewNoteComposerDraft(region.slug, draftKind)
  const serverFilter = notesModeToServerFilter(notesMode)

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
  const collectionOptions = showingOsm
    ? [{ value: 'osm', label: 'OpenStreetMap-Hinweise (öffentlich)', private: false }]
    : selection.kind === 'internal'
      ? [{ value: 'internal', label: 'TILDA-Hinweise', private: true }]
      : []

  return {
    kind: selection.kind,
    showingOsm,
    entries,
    authorOptions,
    isInternalLoading,
    isInternalError,
    isOsmError,
    hasNewNoteDraft,
    showInternalAuthCallout: lacksInternalAccess,
    capabilities: {
      showDownload: !showingOsm,
      showReactionFilter: !showingOsm,
      showExtentFilter: !showingOsm,
      draftKind,
      collectionOptions,
    },
  }
}
