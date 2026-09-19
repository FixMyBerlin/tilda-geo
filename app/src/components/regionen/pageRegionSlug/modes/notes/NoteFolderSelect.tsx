import { Menu, MenuButton, MenuHeading, MenuItem, MenuItems, MenuSection } from '@headlessui/react'
import { EllipsisHorizontalIcon, PlusIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import type { NoteFolderForRegion } from '@/server/notes/queries/getNoteFoldersForRegion.server'
import { mapOverlayMenuClassName } from '../../mapOverlayChrome.const'
import { ModeCollectionSelect } from '../ModeCollectionSelect'
import { modePanelHeaderIconButtonClassName } from '../modePanel.const'
import { sharedWithRegionsSubtitle } from '../sharedWithRegions'
import { NoteFolderNameModal } from './NoteFolderNameModal'
import { notesOsmCollectionKey, type NotesCollectionKey } from './notesModeParam'
import type { NoteFolderCommands } from './useNoteFolderCommands'

const notesOsmCollectionLabel = 'OpenStreetMap-Hinweise (öffentlich)'

type SelectProps = {
  folders: NoteFolderForRegion[]
  selected: NotesCollectionKey | undefined
  onSelect: (key: NotesCollectionKey) => void
  showOsm: boolean
  canCreateFolder: boolean
  currentRegionSlug: string
}

const menuItemClassName =
  'flex w-full cursor-pointer px-3 py-1.5 text-left text-sm text-gray-700 data-focus:bg-yellow-50 data-disabled:cursor-not-allowed data-disabled:opacity-40'

const menuHeadingClassName = 'px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-gray-500'

/**
 * Note-folder options for the mode header disclosure. A trailing “Neuer Ordner…” row opens
 * the shared name modal (same as Umbenennen).
 */
export const NoteFolderSelect = ({
  folders,
  selected,
  onSelect,
  showOsm,
  canCreateFolder,
  currentRegionSlug,
  commands: { create, rename, selectedFolder, nameModal, openNameModal, closeNameModal },
}: SelectProps & {
  commands: NoteFolderCommands
}) => {
  const options = [
    ...folders.map((folder) => ({
      value: String(folder.id),
      label: folder.name,
      description: String(folder.noteCount),
      private: true,
      regionHint: sharedWithRegionsSubtitle('Ordner', folder.regions, currentRegionSlug),
    })),
    ...(showOsm
      ? [{ value: notesOsmCollectionKey, label: notesOsmCollectionLabel, private: false }]
      : []),
  ]
  const selectedValue =
    selected === notesOsmCollectionKey
      ? notesOsmCollectionKey
      : String(selected ?? folders[0]?.id ?? (showOsm ? notesOsmCollectionKey : ''))

  return (
    <div className="flex flex-col gap-1">
      {options.length > 0 ? (
        <ModeCollectionSelect
          aria-label="Ordner"
          value={selectedValue}
          options={options}
          onChange={(next) =>
            onSelect(next === notesOsmCollectionKey ? notesOsmCollectionKey : Number(next))
          }
        />
      ) : null}
      {canCreateFolder ? (
        <button
          type="button"
          onClick={(event) => openNameModal('create', event.currentTarget)}
          className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-white/90 select-none hover:bg-white/10"
        >
          <PlusIcon className="size-4 shrink-0" aria-hidden />
          <span>Neuer Ordner…</span>
        </button>
      ) : null}
      <NoteFolderNameModal
        kind={nameModal}
        defaultName={nameModal === 'rename' ? (selectedFolder?.name ?? '') : ''}
        isPending={create.isPending || rename.isPending}
        onClose={closeNameModal}
        onSubmit={async (name) => {
          if (nameModal === 'rename') {
            if (!selectedFolder) return
            await rename.mutateAsync({ id: selectedFolder.id, name })
            return
          }
          await create.mutateAsync(name)
        }}
      />
    </div>
  )
}

/** Header ⋯ menu: download for the folder / region, rename/delete for the folder. */
export const NoteFolderManageMenu = ({
  commands: { selectedFolder, openNameModal, remove },
}: {
  commands: NoteFolderCommands
}) => {
  const region = useRegion()
  const downloadBase = `/api/notes/${region.slug}/download`

  return (
    <Menu as="div">
      <MenuButton aria-label="Ordner verwalten" className={modePanelHeaderIconButtonClassName}>
        <EllipsisHorizontalIcon className="size-5" aria-hidden="true" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        modal={false}
        className={twJoin('z-40 min-w-48 py-1 [--anchor-gap:8px]', mapOverlayMenuClassName)}
      >
        {selectedFolder ? (
          <MenuSection>
            <MenuHeading className={menuHeadingClassName}>Hinweise des Ordners</MenuHeading>
            <MenuItem>
              <a
                href={`${downloadBase}?format=csv&folderId=${selectedFolder.id}`}
                download
                className={menuItemClassName}
              >
                Herunterladen (CSV)
              </a>
            </MenuItem>
            <MenuItem>
              <a
                href={`${downloadBase}?format=geojson&folderId=${selectedFolder.id}`}
                download
                className={menuItemClassName}
              >
                Herunterladen (GeoJSON)
              </a>
            </MenuItem>
          </MenuSection>
        ) : null}
        <MenuSection>
          <MenuHeading className={menuHeadingClassName}>Alle Hinweise der Region</MenuHeading>
          <MenuItem>
            <a href={`${downloadBase}?format=csv`} download className={menuItemClassName}>
              Herunterladen (CSV)
            </a>
          </MenuItem>
          <MenuItem>
            <a href={`${downloadBase}?format=geojson`} download className={menuItemClassName}>
              Herunterladen (GeoJSON)
            </a>
          </MenuItem>
        </MenuSection>
        <MenuSection>
          <MenuHeading className={menuHeadingClassName}>Ordner</MenuHeading>
          <MenuItem>
            <button
              type="button"
              onClick={(event) => openNameModal('rename', event.currentTarget)}
              className={menuItemClassName}
            >
              Umbenennen
            </button>
          </MenuItem>
          <MenuItem
            disabled={
              remove.isPending ||
              (selectedFolder?.noteCount ?? 0) > 0 ||
              (selectedFolder?.regions.length ?? 0) > 1
            }
          >
            <button
              type="button"
              title={
                selectedFolder && selectedFolder.noteCount > 0
                  ? 'Nur leere Ordner können gelöscht werden'
                  : selectedFolder && selectedFolder.regions.length > 1
                    ? 'Ordner mit mehreren Regionen können nur im Admin-Bereich gelöscht werden'
                    : undefined
              }
              onClick={() => {
                if (selectedFolder) remove.mutate(selectedFolder.id)
              }}
              className={menuItemClassName}
            >
              Löschen
            </button>
          </MenuItem>
        </MenuSection>
      </MenuItems>
    </Menu>
  )
}
