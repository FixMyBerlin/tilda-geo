import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { mapOverlayMenuClassName } from '../../mapOverlayChrome.const'
import { modePanelHeaderIconButtonClassName } from '../modePanel.const'
import type { SpaceFinderSelectedVariant } from './spaceFinderCollectionOptions'
import type { SpaceFinderCommands } from './useSpaceFinderCommands'

const menuItemClassName =
  'flex w-full cursor-pointer px-3 py-1.5 text-left text-sm text-gray-700 data-focus:bg-yellow-50 data-disabled:cursor-not-allowed data-disabled:opacity-40'

const menuItemsClassName = twJoin('z-40 min-w-48 py-1 [--anchor-gap:8px]', mapOverlayMenuClassName)

/** Header ⋯ for the Planungsgebiet (the collection), like the Ordner menu in Hinweise. */
export const SpaceFinderAreaManageMenu = ({
  selected,
  onEditArea,
  commands: { openNameModal, deleteArea },
}: {
  selected: SpaceFinderSelectedVariant
  onEditArea: () => void
  commands: SpaceFinderCommands
}) => {
  return (
    <Menu as="div">
      <MenuButton
        aria-label="Planungsgebiet verwalten"
        className={modePanelHeaderIconButtonClassName}
      >
        <EllipsisHorizontalIcon className="size-5" aria-hidden="true" />
      </MenuButton>
      <MenuItems anchor="bottom end" modal={false} className={menuItemsClassName}>
        <MenuItem>
          <button type="button" onClick={onEditArea} className={menuItemClassName}>
            Gebiet und eigene Daten bearbeiten
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
      </MenuItems>
    </Menu>
  )
}

/** ⋯ in the Varianten bar: acts on the active variant. A Gebiet keeps at least one variant. */
export const SpaceFinderVariantManageMenu = ({
  selected,
  commands: { openNameModal, deleteVariant, duplicateVariant },
}: {
  selected: SpaceFinderSelectedVariant
  commands: SpaceFinderCommands
}) => {
  const isLastVariant = selected.variantCount <= 1

  return (
    <Menu as="div">
      <MenuButton aria-label="Variante verwalten" className={modePanelHeaderIconButtonClassName}>
        <EllipsisHorizontalIcon className="size-5" aria-hidden="true" />
      </MenuButton>
      <MenuItems anchor="bottom end" modal={false} className={menuItemsClassName}>
        <MenuItem disabled={duplicateVariant.isPending}>
          <button
            type="button"
            onClick={() => duplicateVariant.mutate(selected.variantId)}
            className={menuItemClassName}
          >
            {duplicateVariant.isPending ? 'Wird dupliziert…' : 'Duplizieren'}
          </button>
        </MenuItem>
        <MenuItem>
          <button
            type="button"
            onClick={(event) => openNameModal('renameVariant', event.currentTarget)}
            className={menuItemClassName}
          >
            Umbenennen
          </button>
        </MenuItem>
        <MenuItem disabled={deleteVariant.isPending || isLastVariant}>
          <button
            type="button"
            title={
              isLastVariant ? 'Ein Planungsgebiet braucht mindestens eine Variante.' : undefined
            }
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
      </MenuItems>
    </Menu>
  )
}
