import { useState } from 'react'
import { captureModalOpenOrigin } from '@/components/shared/motion/modalOpenOrigin'
import {
  createNoteFolderFn,
  deleteNoteFolderFn,
  updateNoteFolderFn,
} from '@/server/notes/notes.functions'
import type { NoteFolderForRegion } from '@/server/notes/queries/getNoteFoldersForRegion.server'
import { internalNotesQueryKey, noteFoldersQueryOptions } from '@/server/regions/regionQueryOptions'
import { useModeCollectionManager } from '../useModeCollectionManager'

type NoteFolderCommandsInput = {
  regionSlug: string
  folders: NoteFolderForRegion[]
  selectedFolderId: number | undefined
  onSelect: (folderId: number) => void
}

export const useNoteFolderCommands = ({
  regionSlug,
  folders,
  selectedFolderId,
  onSelect,
}: NoteFolderCommandsInput) => {
  const [nameModal, setNameModal] = useState<'create' | 'rename' | null>(null)

  const openNameModal = (kind: 'create' | 'rename', origin?: HTMLElement) => {
    if (origin) captureModalOpenOrigin(origin)
    setNameModal(kind)
  }

  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId)

  const { create, rename, remove } = useModeCollectionManager({
    createFn: (name) => createNoteFolderFn({ data: { regionSlug, name } }),
    renameFn: ({ id, name }) => updateNoteFolderFn({ data: { regionSlug, folderId: id, name } }),
    deleteFn: (id) => deleteNoteFolderFn({ data: { regionSlug, folderId: id } }),
    invalidateKeys: [noteFoldersQueryOptions(regionSlug).queryKey, internalNotesQueryKey],
    onAfterCreate: (folder) => onSelect(folder.id),
  })

  return {
    selectedFolder,
    nameModal,
    openNameModal,
    closeNameModal: () => setNameModal(null),
    create,
    rename,
    remove,
  }
}

export type NoteFolderCommands = ReturnType<typeof useNoteFolderCommands>
