import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import {
  ArrowUturnLeftIcon,
  ChatBubbleLeftIcon,
  ChevronDownIcon,
  FlagIcon,
  UserIcon,
  UsersIcon,
  ViewfinderCircleIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, SVGProps } from 'react'
import { twJoin } from 'tailwind-merge'
import { mapOverlayMenuClassName } from '../mapOverlayChrome.const'
import { modePanelFilterControlClassName } from './modePanel.const'

type ModeFilterSelectOption<T extends string> = {
  value: T
  label: string
}

type FilterIcon = ComponentType<SVGProps<SVGSVGElement>>

export const modeFilterIcons = {
  status: FlagIcon,
  comments: ChatBubbleLeftIcon,
  reaction: ArrowUturnLeftIcon,
  author: UserIcon,
  users: UsersIcon,
  extent: ViewfinderCircleIcon,
} as const satisfies Record<string, FilterIcon>

type Props<T extends string> = {
  label: string
  icon: FilterIcon
  value: T
  options: readonly ModeFilterSelectOption<T>[]
  onChange: (value: T) => void
}

/**
 * Compact filter Listbox. Closed: `{icon} {value}` (truncated). Open: the same icon plus
 * `{label}` as a header so the chip and the menu stay correlated.
 */
export const ModeFilterSelect = <T extends string>({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}: Props<T>) => {
  const selected = options.find((option) => option.value === value) ?? options[0]
  if (!selected) return null

  return (
    <Listbox as="div" className="max-w-28 min-w-0" value={selected.value} onChange={onChange}>
      <ListboxButton
        aria-label={`${label}: ${selected.label}`}
        title={label}
        className={twJoin(modePanelFilterControlClassName, 'w-full justify-between gap-1 px-1.5')}
      >
        <span className="flex min-w-0 items-center gap-1">
          <Icon className="size-3.5 shrink-0 text-gray-500" aria-hidden="true" />
          <span className="truncate">{selected.label}</span>
        </span>
        <ChevronDownIcon className="size-3.5 shrink-0" aria-hidden="true" />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        modal={false}
        className={twJoin(
          'z-40 max-h-72 min-w-44 overflow-auto py-1 [--anchor-gap:4px]',
          mapOverlayMenuClassName,
        )}
      >
        <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-gray-500">
          <Icon className="size-3.5 shrink-0" aria-hidden="true" />
          {label}
        </div>
        {options.map((option) => (
          <ListboxOption
            key={option.value}
            value={option.value}
            className={({ focus, selected: isSelected }) =>
              twJoin(
                'cursor-pointer px-3 py-1.5 text-left text-xs text-gray-700 select-none',
                isSelected ? 'bg-yellow-400 text-gray-900' : '',
                focus && !isSelected ? 'bg-yellow-50' : '',
              )
            }
          >
            {option.label}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  )
}
