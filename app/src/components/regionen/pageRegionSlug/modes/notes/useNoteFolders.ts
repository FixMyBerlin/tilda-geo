import { useQuery } from '@tanstack/react-query'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { noteFoldersQueryOptions } from '@/server/regions/regionQueryOptions'
import { resolveSelectedNoteFolderId } from './notesSelection'
import { useAllowInternalNotes } from './useAllowInternalNotes'
import { useNotesModeValue } from './useNotesModeParam'

/**
 * Single source of truth for the active note folder: the panel, the map layer, the new-note
 * form and the detail move select all read this instead of re-deriving `notesMode.key`.
 */
export const useNoteFolders = () => {
  const region = useRegion()
  const allowInternalNotes = useAllowInternalNotes()
  const notesMode = useNotesModeValue()

  const { data, isLoading } = useQuery({
    ...noteFoldersQueryOptions(region.slug),
    enabled: allowInternalNotes,
  })
  const folders = data?.folders ?? []
  const selectedFolderId = resolveSelectedNoteFolderId(notesMode.key, folders)
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId)

  return { folders, selectedFolderId, selectedFolder, isLoading }
}
