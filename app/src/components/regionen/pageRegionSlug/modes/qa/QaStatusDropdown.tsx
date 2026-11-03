import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import { mapOverlayMenuClassName } from '../../mapOverlayChrome.const'
import { modeFilterIcons } from '../ModeFilterSelect'
import {
  modeFilterCheckboxClassName,
  modeFilterCheckboxRowClassName,
  modeFilterMenuHeadingClassName,
  modePanelFilterControlClassName,
} from '../modePanel.const'
import { userStatusConfig } from './detail/qaConfigs'
import { QaEvaluatorIcon } from './detail/QaEvaluatorIcon'
import { QA_STATUS_GROUPS, QA_STATUS_OPTIONS, resolvedQaStatusKeys } from './qaConfigStyles'

const StatusIcon = modeFilterIcons.status

/**
 * Compact "Status" filter, checkboxes grouped by `QA_STATUS_GROUPS`; the group headings are not
 * selectable. "Alle" excludes the single statuses. Each status shows who decides it: system or user.
 * A Popover, not a Menu: a Menu closes on Tab, so keyboard users could not reach the checkboxes.
 */
export const QaStatusDropdown = () => {
  const { qaParamData, toggleStatus, clearStatuses } = useQaParam()

  const selectedKeys = resolvedQaStatusKeys(qaParamData.status)
  const selectedOptions = QA_STATUS_OPTIONS.filter((option) => selectedKeys?.includes(option.key))
  const selectedOption = selectedOptions.length === 1 ? selectedOptions[0] : undefined
  const selectedGroup = QA_STATUS_GROUPS.find(
    (group) =>
      selectedOptions.length > 1 &&
      QA_STATUS_OPTIONS.filter((option) => option.group === group).length ===
        selectedOptions.length &&
      selectedOptions.every((option) => option.group === group),
  )
  const triggerLabel = !selectedKeys
    ? 'Alle'
    : (selectedGroup ??
      (selectedOption
        ? selectedOption.userStatus
          ? userStatusConfig[selectedOption.userStatus].label
          : selectedOption.label
        : `${selectedOptions.length} ausgewählt`))

  return (
    <Popover className="max-w-28 min-w-0">
      <PopoverButton
        aria-label={`Status: ${triggerLabel}`}
        title="Status"
        className={twJoin(modePanelFilterControlClassName, 'w-full justify-between gap-1 px-1.5')}
      >
        <span className="flex min-w-0 items-center gap-1">
          <StatusIcon className="size-3.5 shrink-0 text-gray-500" aria-hidden="true" />
          <span className="truncate">{triggerLabel}</span>
        </span>
        <ChevronDownIcon className="size-3.5 shrink-0" aria-hidden="true" />
      </PopoverButton>
      <PopoverPanel
        anchor="bottom start"
        focus
        className={twJoin(
          'z-40 max-h-96 min-w-56 space-y-0.5 overflow-auto px-2 pb-2 [--anchor-gap:4px]',
          mapOverlayMenuClassName,
        )}
      >
        <div className={twJoin(modeFilterMenuHeadingClassName, '-mx-2')}>
          <StatusIcon className="size-3.5 shrink-0" aria-hidden="true" />
          Status
        </div>
        <label className={modeFilterCheckboxRowClassName}>
          <input
            type="checkbox"
            checked={!selectedKeys}
            onChange={clearStatuses}
            className={modeFilterCheckboxClassName}
          />
          <span>Alle</span>
        </label>
        {QA_STATUS_GROUPS.map((group) => (
          <fieldset key={group} className="space-y-0.5">
            <legend className="px-1 pt-1.5 pb-0.5 text-[11px] font-medium text-gray-500">
              {group}
            </legend>
            {QA_STATUS_OPTIONS.filter((option) => option.group === group).map((option) => (
              <label key={option.key} className={modeFilterCheckboxRowClassName}>
                <input
                  type="checkbox"
                  checked={selectedKeys?.includes(option.key) ?? false}
                  onChange={() => toggleStatus(option.key)}
                  className={modeFilterCheckboxClassName}
                />
                <QaEvaluatorIcon evaluatorType={option.userStatus === null ? 'SYSTEM' : 'USER'} />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </PopoverPanel>
    </Popover>
  )
}
