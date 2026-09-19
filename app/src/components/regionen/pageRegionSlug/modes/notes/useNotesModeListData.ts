import { useQuery } from '@tanstack/react-query'
import { useNotesComposePin } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesComposePin'
import { useFilteredOsmNotes } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/useFilteredOsmNotes'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { authClient } from '@/components/shared/auth/auth-client'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import {
  internalNotesQueryOptions,
  regionMemberOsmNamesQueryOptions,
} from '@/server/regions/regionQueryOptions'
import { useHasNewNoteComposerDraft } from '../composerDrafts/useHasComposerDraft'
import { notesAuthorFilterOptions, uniqueOsmNoteAuthorNames } from './notesModeFilters'
import { internalNotesToListEntries, osmNotesToListEntries } from './notesModeListEntry'
import { notesModeToServerFilter } from './notesModeParam'
import { useNoteFolders } from './useNoteFolders'
import { useNotesModeParam } from './useNotesModeParam'
import { useNotesSelection } from './useNotesSelection'
import { useOsmNotesQuery } from './useOsmNotesQuery'

/**
 * Dual-dataset notes list. OSM and TILDA are XOR via `notes.key` (`osm` vs folder id).
 * When both region flags are on, OSM is a virtual folder and never shown together with
 * an internal folder.
 */
export const useNotesModeListData = () => {
  const region = useRegion()
  const hasPermissions = useHasPermissions()
  const { data: session } = authClient.useSession()
  const { notesMode } = useNotesModeParam()
  const { isComposing } = useNotesComposePin()

  const hasInternalNotes = region.notesInternal
  const lacksInternalAccess = hasInternalNotes && !hasPermissions && !region.notesOsm
  const selection = useNotesSelection()
  const showingOsm = selection.kind === 'osm'
  const draftKind = showingOsm ? 'osm' : 'internal'
  const hasNewNoteDraft = useHasNewNoteComposerDraft(region.slug, draftKind)
  const serverFilter = notesModeToServerFilter(notesMode)

  const { selectedFolderId } = useNoteFolders()

  const {
    data: internalData,
    isLoading: isInternalLoading,
    isError: isInternalError,
  } = useQuery({
    ...internalNotesQueryOptions(region.slug, selectedFolderId, serverFilter),
    enabled:
      selection.kind === 'internal' &&
      hasPermissions &&
      !isComposing &&
      selectedFolderId !== undefined,
  })
  const { isError: isOsmError } = useOsmNotesQuery()
  const osmCollection = useFilteredOsmNotes(serverFilter)
  const { data: regionMembers } = useQuery({
    ...regionMemberOsmNamesQueryOptions(region.slug),
    enabled: showingOsm && hasPermissions,
  })

  const entries = showingOsm
    ? osmNotesToListEntries(osmCollection.features, regionMembers)
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
      showReactionFilter: !showingOsm,
      showExtentFilter: !showingOsm,
      draftKind,
    },
  }
}
