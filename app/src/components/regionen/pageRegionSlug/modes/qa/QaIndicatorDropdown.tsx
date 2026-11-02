import { Menu, MenuButton, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import type { QaIndicator } from '@/server/qa-configs/schemas/qaIndicatorsSchema'
import { mapOverlayMenuClassName } from '../../mapOverlayChrome.const'
import { modeFilterIcons } from '../ModeFilterSelect'
import {
  modeFilterCheckboxClassName,
  modeFilterCheckboxRowClassName,
  modeFilterMenuHeadingClassName,
  modePanelFilterControlClassName,
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
          'z-40 min-w-56 space-y-0.5 px-2 pb-2 [--anchor-gap:4px]',
          mapOverlayMenuClassName,
        )}
      >
        <div className={twJoin(modeFilterMenuHeadingClassName, '-mx-2')}>
          <AttributesIcon className="size-3.5 shrink-0" aria-hidden="true" />
          Attribute
        </div>
        {indicators.map((indicator) => {
          const isSelected = selectedKeys.includes(indicator.key)
          return (
            <label key={indicator.key} className={modeFilterCheckboxRowClassName}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleIndicator(indicator.key, allKeys)}
                className={modeFilterCheckboxClassName}
              />
              <span>{indicator.label}</span>
            </label>
          )
        })}
        <label className={modeFilterCheckboxRowClassName}>
          <input
            type="checkbox"
            checked={noFilterActive}
            onChange={clearIndicators}
            className={modeFilterCheckboxClassName}
          />
          <span>Alle Attribute</span>
        </label>
      </MenuItems>
    </Menu>
  )
}
