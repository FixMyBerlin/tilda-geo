import { Menu, MenuButton, MenuHeading, MenuItem, MenuItems, MenuSection } from '@headlessui/react'
import { EllipsisHorizontalIcon, PlusIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import type { ReviewListForRegion } from '@/server/review-lists/queries/getReviewListsForRegion.server'
import { mapOverlayMenuClassName } from '../../mapOverlayChrome.const'
import { ModeCollectionSelect } from '../ModeCollectionSelect'
import { modePanelHeaderIconButtonClassName } from '../modePanel.const'
import { ReviewListGeojsonUploadModal } from './ReviewListGeojsonUploadModal'
import { ReviewListNameModal } from './ReviewListNameModal'
import type { ReviewListCommands } from './useReviewListCommands'

type SelectProps = {
  lists: ReviewListForRegion[]
  canManage: boolean
  selectedListId: number | undefined
  onSelect: (listId: number) => void
}

const menuItemClassName =
  'flex w-full cursor-pointer px-3 py-1.5 text-left text-sm text-gray-700 data-focus:bg-yellow-50 data-disabled:cursor-not-allowed data-disabled:opacity-40'

const menuHeadingClassName = 'px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-gray-500'

/**
 * Review-list options for the mode header disclosure. A trailing “Neue Prüfliste…” row opens
 * the shared name modal (same as Umbenennen).
 */
export const ReviewListSelect = ({
  lists,
  canManage,
  selectedListId,
  onSelect,
  commands: { uploadError, create, rename, selectedList, nameModal, openNameModal, closeNameModal },
}: Pick<SelectProps, 'lists' | 'canManage' | 'selectedListId' | 'onSelect'> & {
  commands: ReviewListCommands
}) => {
  return (
    <div className="flex flex-col gap-1">
      {lists.length > 0 ? (
        <ModeCollectionSelect
          aria-label="Prüfliste"
          value={String(selectedListId ?? lists[0]?.id ?? '')}
          options={lists.map((list) => ({
            value: String(list.id),
            label: list.name,
            description: String(list.entryCount),
            private: true,
          }))}
          onChange={(next) => onSelect(Number(next))}
        />
      ) : null}
      {canManage ? (
        <button
          type="button"
          onClick={(event) => openNameModal('create', event.currentTarget)}
          className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-white/90 select-none hover:bg-white/10"
        >
          <PlusIcon className="size-4 shrink-0" aria-hidden />
          <span>Neue Prüfliste…</span>
        </button>
      ) : null}
      {uploadError ? <p className="text-xs text-red-200">{uploadError}</p> : null}
      <ReviewListNameModal
        kind={nameModal}
        defaultName={nameModal === 'rename' ? (selectedList?.name ?? '') : ''}
        isPending={create.isPending || rename.isPending}
        onClose={closeNameModal}
        onSubmit={async (name) => {
          if (nameModal === 'rename') {
            if (!selectedList) return
            await rename.mutateAsync({ id: selectedList.id, name })
            return
          }
          await create.mutateAsync(name)
        }}
      />
    </div>
  )
}

/** Header ⋯ menu: GeoJSON for entries, rename/delete for the list. */
export const ReviewListManageMenu = ({
  regionSlug: _regionSlug,
  canManage,
  selectedListId,
  commands: {
    setUploadError,
    selectedList,
    openNameModal,
    remove,
    uploadPending,
    handleDownload,
    uploadModalOpen,
    openUploadModal,
    closeUploadModal,
    uploadGeojsonFile,
    uploadError,
    existingFeatures,
    existingFeaturesReady,
    createdCount,
  },
}: Pick<SelectProps, 'canManage' | 'selectedListId'> & {
  regionSlug: string
  commands: ReviewListCommands
}) => {
  return (
    <>
      <Menu as="div">
        <MenuButton aria-label="Prüfliste verwalten" className={modePanelHeaderIconButtonClassName}>
          <EllipsisHorizontalIcon className="size-5" aria-hidden="true" />
        </MenuButton>
        <MenuItems
          anchor="bottom end"
          modal={false}
          className={twJoin('z-40 min-w-48 py-1 [--anchor-gap:8px]', mapOverlayMenuClassName)}
        >
          <MenuSection>
            <MenuHeading className={menuHeadingClassName}>Einträge der Liste</MenuHeading>
            <MenuItem>
              <button type="button" onClick={handleDownload} className={menuItemClassName}>
                Herunterladen (GeoJSON)
              </button>
            </MenuItem>
            {canManage ? (
              <MenuItem disabled={uploadPending || selectedListId === undefined}>
                <button
                  type="button"
                  onClick={(event) => openUploadModal(event.currentTarget)}
                  className={menuItemClassName}
                >
                  {uploadPending ? 'Wird hinzugefügt…' : 'Einträge hinzufügen (GeoJSON)'}
                </button>
              </MenuItem>
            ) : null}
          </MenuSection>
          {canManage ? (
            <MenuSection>
              <MenuHeading className={menuHeadingClassName}>Liste</MenuHeading>
              <MenuItem>
                <button
                  type="button"
                  onClick={(event) => openNameModal('rename', event.currentTarget)}
                  className={menuItemClassName}
                >
                  Umbenennen
                </button>
              </MenuItem>
              <MenuItem disabled={remove.isPending || (selectedList?.entryCount ?? 0) > 0}>
                <button
                  type="button"
                  title={
                    selectedList && selectedList.entryCount > 0
                      ? 'Nur leere Listen können gelöscht werden'
                      : undefined
                  }
                  onClick={() => {
                    if (selectedList) remove.mutate(selectedList.id)
                  }}
                  className={menuItemClassName}
                >
                  Löschen
                </button>
              </MenuItem>
            </MenuSection>
          ) : null}
        </MenuItems>
      </Menu>
      {canManage ? (
        <ReviewListGeojsonUploadModal
          open={uploadModalOpen}
          isPending={uploadPending}
          error={uploadError}
          createdCount={createdCount}
          existingFeatures={existingFeatures}
          existingFeaturesReady={existingFeaturesReady}
          onClose={closeUploadModal}
          onErrorDismiss={() => setUploadError(null)}
          onConfirm={uploadGeojsonFile}
        />
      ) : null}
    </>
  )
}
