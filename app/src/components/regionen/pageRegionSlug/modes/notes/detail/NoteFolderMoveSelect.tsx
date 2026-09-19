import { Menu, MenuButton, MenuHeading, MenuItem, MenuItems, MenuSection } from '@headlessui/react'
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { twJoin } from 'tailwind-merge'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import { moveNoteToFolderFn } from '@/server/notes/notes.functions'
import { noteFoldersQueryKey } from '@/server/regions/regionQueryOptions'
import { mapOverlayMenuClassName } from '../../../mapOverlayChrome.const'
import { modePanelHeaderIconButtonClassName } from '../../modePanel.const'
import { compactNotesCollectionKey } from '../notesSelection'
import { useInternalNotesQueryKey } from '../useInternalNotesQueryKey'
import { useNoteFolders } from '../useNoteFolders'
import { useNotesModeParam } from '../useNotesModeParam'

type Props = {
  noteId: number
  currentFolderId: number
}

const menuItemClassName =
  'flex w-full cursor-pointer px-3 py-1.5 text-left text-sm text-gray-700 data-focus:bg-yellow-50 data-disabled:cursor-not-allowed data-disabled:opacity-40'

const menuHeadingClassName = 'px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-gray-500'

/**
 * Detail-header move control. Moving a note switches `notesMode.key` to the target folder so
 * the open detail stays valid.
 */
export const NoteFolderMoveSelect = ({ noteId, currentFolderId }: Props) => {
  const hasPermissions = useHasPermissions()
  const region = useRegion()
  const queryClient = useQueryClient()
  const queryKeyMap = useInternalNotesQueryKey()
  const { folders } = useNoteFolders()
  const { notesMode, setNotesModeParam } = useNotesModeParam()

  const { mutate, isPending } = useMutation({
    mutationFn: (folderId: number) =>
      moveNoteToFolderFn({ data: { regionSlug: region.slug, noteId, folderId } }),
    onSuccess: (_result, folderId) => {
      queryClient.invalidateQueries({ queryKey: queryKeyMap })
      queryClient.invalidateQueries({ queryKey: noteFoldersQueryKey })
      queryClient.invalidateQueries({ queryKey: ['notes', 'getNoteAndComments', { id: noteId }] })
      setNotesModeParam({
        ...notesMode,
        key: compactNotesCollectionKey({
          selected: folderId,
          firstFolderId: folders[0]?.id,
          hasOsmAndInternal: Boolean(region.notesOsm && region.notesInternal),
        }),
      })
      const targetFolder = folders.find((folder) => folder.id === folderId)
      if (targetFolder) toastSuccess(`Hinweis verschoben nach ${frenchQuote(targetFolder.name)}.`)
    },
  })

  if (!hasPermissions || folders.length < 2) return null

  return (
    <Menu as="div">
      <MenuButton
        aria-label="Hinweis verschieben"
        disabled={isPending}
        className={modePanelHeaderIconButtonClassName}
      >
        <ArrowsRightLeftIcon className="size-5" aria-hidden />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        modal={false}
        className={twJoin('z-40 min-w-56 py-1 [--anchor-gap:8px]', mapOverlayMenuClassName)}
      >
        <MenuSection>
          <MenuHeading className={menuHeadingClassName}>Hinweis verschieben</MenuHeading>
          {folders.map((folder) => (
            <MenuItem key={folder.id} disabled={folder.id === currentFolderId || isPending}>
              <button type="button" onClick={() => mutate(folder.id)} className={menuItemClassName}>
                {`In Ordner ${frenchQuote(folder.name)}`}
              </button>
            </MenuItem>
          ))}
        </MenuSection>
      </MenuItems>
    </Menu>
  )
}
