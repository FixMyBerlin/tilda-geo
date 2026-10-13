import { Menu, MenuButton, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import type { QaIndicator } from '@/server/qa-configs/schemas/qaIndicatorsSchema'
import { mapOverlayMenuClassName } from '../../mapOverlayChrome.const'
import { modeFilterIcons } from '../ModeFilterSelect'
import {
  modePanelFilterControlClassName,
  modePanelListItemHoverClassName,
} from '../modePanel.const'

const AttributesIcon = modeFilterIcons.category

type Props = {
  indicators: QaIndicator[]
}

/**
 * Compact "Attribute" filter, checkboxes over `QaConfig.indicators`. Closed: current choice
 * (Alle, or a count). Open: one checkbox per indicator plus "Alle Attribute" (the default — no
 * indicator keys in the URL). The map color and cell list use the worst status among the
 * selected indicators (`worstQaIndicatorStatus`).
 */
export const QaIndicatorDropdown = ({ indicators }: Props) => {
  const { qaParamData, toggleIndicator, clearIndicators } = useQaParam()

  if (indicators.length === 0) return null

  const allKeys = indicators.map((indicator) => indicator.key)
  const selectedKeys = qaParamData.ind && qaParamData.ind.length > 0 ? qaParamData.ind : allKeys
  const noFilterActive = selectedKeys.length === allKeys.length

  const triggerLabel = noFilterActive
    ? 'Alle'
    : selectedKeys.length === 1
      ? '1 ausgewählt'
      : `${selectedKeys.length} ausgewählt`

  return (
    <Menu as="div" className="max-w-28 min-w-0">
      <MenuButton
        aria-label={`Attribute: ${triggerLabel}`}
        title="Attribute"
        className={twJoin(modePanelFilterControlClassName, 'w-full justify-between gap-1 px-1.5')}
      >
        <span className="flex min-w-0 items-center gap-1">
          <AttributesIcon className="size-3.5 shrink-0 text-gray-500" aria-hidden="true" />
          <span className="truncate">{triggerLabel}</span>
        </span>
        <ChevronDownIcon className="size-3.5 shrink-0" aria-hidden="true" />
      </MenuButton>
      <MenuItems
        anchor="bottom start"
        modal={false}
        className={twJoin(
          'z-40 min-w-56 space-y-0.5 px-2 py-2 [--anchor-gap:4px]',
          mapOverlayMenuClassName,
        )}
      >
        <div className="flex items-center gap-1.5 px-1 pb-1 text-[11px] font-medium text-gray-500">
          <AttributesIcon className="size-3.5 shrink-0" aria-hidden="true" />
          Attribute
        </div>
        {indicators.map((indicator) => {
          const isSelected = selectedKeys.includes(indicator.key)
          return (
            <label
              key={indicator.key}
              className={`flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs ${modePanelListItemHoverClassName}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleIndicator(indicator.key, allKeys)}
                className="size-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <span>{indicator.label}</span>
            </label>
          )
        })}
        <label
          className={`flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs ${modePanelListItemHoverClassName}`}
        >
          <input
            type="checkbox"
            checked={noFilterActive}
            onChange={clearIndicators}
            className="size-4 rounded border-gray-300 text-brand focus:ring-brand"
          />
          <span>Alle Attribute</span>
        </label>
      </MenuItems>
    </Menu>
  )
}
