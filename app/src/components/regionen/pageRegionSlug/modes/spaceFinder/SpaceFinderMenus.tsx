import { Menu, MenuButton, MenuHeading, MenuItem, MenuItems, MenuSection } from '@headlessui/react'
import { EllipsisHorizontalIcon, PlusIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { mapOverlayMenuClassName } from '../../mapOverlayChrome.const'
import { modePanelHeaderIconButtonClassName } from '../modePanel.const'
import type { SpaceFinderCollectionOption } from './spaceFinderCollectionOptions'
import type { SpaceFinderCommands } from './useSpaceFinderCommands'

const menuItemClassName =
  'flex w-full cursor-pointer px-3 py-1.5 text-left text-sm text-gray-700 data-focus:bg-yellow-50 data-disabled:cursor-not-allowed data-disabled:opacity-40'

const menuHeadingClassName = 'px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-gray-500'

/**
 * Header ➕: »Neue Variante in diesem Gebiet« / »Neues Planungsgebiet« (D4). With no Gebiet yet
 * there is only one meaningful option, so the button opens the wizard directly instead of a menu.
 */
export const SpaceFinderNewMenu = ({
  hasArea,
  onNewVariant,
  onNewArea,
}: {
  hasArea: boolean
  onNewVariant: () => void
  onNewArea: () => void
}) => {
  if (!hasArea) {
    return (
      <Tooltip text="Neues Planungsgebiet">
        <button
          type="button"
          onClick={onNewArea}
          aria-label="Neues Planungsgebiet"
          className={modePanelHeaderIconButtonClassName}
        >
          <PlusIcon className="size-5" aria-hidden />
        </button>
      </Tooltip>
    )
  }

  return (
    <Menu as="div">
      <MenuButton aria-label="Neu" className={modePanelHeaderIconButtonClassName}>
        <PlusIcon className="size-5" aria-hidden="true" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        modal={false}
        className={twJoin('z-40 min-w-56 py-1 [--anchor-gap:8px]', mapOverlayMenuClassName)}
      >
        <MenuItem>
          <button type="button" onClick={onNewVariant} className={menuItemClassName}>
            Neue Variante in diesem Gebiet
          </button>
        </MenuItem>
        <MenuItem>
          <button type="button" onClick={onNewArea} className={menuItemClassName}>
            Neues Planungsgebiet
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  )
}

/** Header ⋯: »Variante« block (umbenennen/duplizieren/löschen) + »Gebiet« block (D4). */
export const SpaceFinderManageMenu = ({
  selected,
  onEditArea,
  commands: { openNameModal, duplicateVariant, deleteVariant, deleteArea },
}: {
  selected: SpaceFinderCollectionOption
  onEditArea: () => void
  commands: SpaceFinderCommands
}) => {
  return (
    <Menu as="div">
      <MenuButton
        aria-label="Flächenfinder verwalten"
        className={modePanelHeaderIconButtonClassName}
      >
        <EllipsisHorizontalIcon className="size-5" aria-hidden="true" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        modal={false}
        className={twJoin('z-40 min-w-48 py-1 [--anchor-gap:8px]', mapOverlayMenuClassName)}
      >
        <MenuSection>
          <MenuHeading className={menuHeadingClassName}>Variante</MenuHeading>
          <MenuItem>
            <button
              type="button"
              onClick={(event) => openNameModal('renameVariant', event.currentTarget)}
              className={menuItemClassName}
            >
              Umbenennen
            </button>
          </MenuItem>
          <MenuItem disabled={duplicateVariant.isPending}>
            <button
              type="button"
              onClick={() => duplicateVariant.mutate(selected.variantId)}
              className={menuItemClassName}
            >
              {duplicateVariant.isPending ? 'Wird dupliziert…' : 'Duplizieren'}
            </button>
          </MenuItem>
          <MenuItem disabled={deleteVariant.isPending}>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Variante ${frenchQuote(selected.variantTitle)} löschen?`)) {
                  deleteVariant.mutate(selected.variantId)
                }
              }}
              className={twJoin(menuItemClassName, 'text-red-600')}
            >
              Löschen
            </button>
          </MenuItem>
        </MenuSection>
        <MenuSection>
          <MenuHeading className={menuHeadingClassName}>Gebiet</MenuHeading>
          <MenuItem>
            <button type="button" onClick={onEditArea} className={menuItemClassName}>
              Bearbeiten
            </button>
          </MenuItem>
          <MenuItem>
            <button
              type="button"
              onClick={(event) => openNameModal('renameArea', event.currentTarget)}
              className={menuItemClassName}
            >
              Umbenennen
            </button>
          </MenuItem>
          <MenuItem disabled={deleteArea.isPending}>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Planungsgebiet ${frenchQuote(selected.areaTitle)} und alle seine Varianten unwiderruflich löschen?`,
                  )
                ) {
                  deleteArea.mutate(selected.areaId)
                }
              }}
              className={twJoin(menuItemClassName, 'text-red-600')}
            >
              Löschen
            </button>
          </MenuItem>
        </MenuSection>
      </MenuItems>
    </Menu>
  )
}
