import { CheckIcon } from '@heroicons/react/20/solid'
import { ChevronUpDownIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { type KeyboardEvent, type MouseEvent, useLayoutEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { RegionStatusPill } from '@/components/regionen/regionMeta/RegionStatusPill'
import { useOptionalRegionSlug } from '@/components/shared/hooks/useOptionalRegionSlug'
import type { RegionWithAdditionalData } from '@/server/regions/queries/getRegionsWithAdditionalData.server'
import { regionenIndexQueryOptions } from '@/server/regions/regionenIndexQueryOptions'
import {
  filterPartitionedRegions,
  mergeRegionenIndexRegions,
  partitionRegionsByStatus,
} from './regionenIndexMergeUtils'

const pillClassName = 'shrink-0 px-1 py-0 text-[10px]'
const listboxId = 'admin-region-switch-listbox'
const triggerId = 'admin-region-switch-trigger'

const preventMenuClickDefault = (event: MouseEvent) => {
  event.preventDefault()
}

const focusRegionSearchInput = (input: HTMLInputElement | null) => {
  if (!input) return
  input.focus()
  input.select()
}

const RegionListOption = ({
  region,
  isCurrent,
  isFocused,
  onSelect,
  className,
}: {
  region: RegionWithAdditionalData
  isCurrent: boolean
  isFocused: boolean
  onSelect: (region: RegionWithAdditionalData) => void
  className?: string
}) => (
  <li role="presentation" className={className}>
    <div
      id={`region-option-${region.slug}`}
      role="option"
      aria-selected={isCurrent}
      tabIndex={isFocused ? 0 : -1}
      onClick={() => onSelect(region)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(region)
        }
      }}
      className="flex cursor-pointer items-start gap-2 px-2 py-1.5 outline-none select-none hover:bg-pink-400/40 focus:bg-pink-400/40"
    >
      <CheckIcon
        className={twMerge('mt-0.5 size-4 shrink-0', isCurrent ? 'text-gray-900' : 'invisible')}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium text-gray-900">{region.name}</span>
          <RegionStatusPill status={region.status} className={pillClassName} />
        </div>
        {region.fullName !== region.name && (
          <div className="truncate text-gray-700">{region.fullName}</div>
        )}
      </div>
    </div>
  </li>
)

type Props = {
  /** Desktop Headless UI Menu — preventDefault on click keeps the flyout open while interacting. */
  inHeadlessMenu?: boolean
}

export const AdminRegionSwitch = ({ inHeadlessMenu = false }: Props) => {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const regionSlug = useOptionalRegionSlug()
  const location = useLocation()
  const navigate = useNavigate()
  const { data, isPending } = useQuery(regionenIndexQueryOptions())

  const mergedRegions = mergeRegionenIndexRegions(data)
  const currentRegion = mergedRegions.find((region) => region.slug === regionSlug) ?? null
  const { active, deactivated } = filterPartitionedRegions(
    partitionRegionsByStatus(mergedRegions),
    searchQuery,
  )
  const listOptions = [...active, ...deactivated]
  const hasResults = listOptions.length > 0

  const closePanel = () => {
    setSearchQuery('')
    setFocusedSlug(null)
    setOpen(false)
  }

  const openPanel = () => {
    setOpen(true)
    setFocusedSlug(currentRegion?.slug ?? active[0]?.slug ?? null)
  }

  useLayoutEffect(
    function focusRegionSearchInputWhenPanelOpens() {
      if (!open || isPending) return
      focusRegionSearchInput(searchInputRef.current)
    },
    [open, isPending],
  )

  useLayoutEffect(
    function focusListboxOptionWhenKeyboardFocusMoves() {
      if (!open || !focusedSlug) return
      if (document.activeElement === searchInputRef.current) return
      document.getElementById(`region-option-${focusedSlug}`)?.focus()
    },
    [focusedSlug, open],
  )

  const handleSelect = (region: RegionWithAdditionalData) => {
    if (region.slug === regionSlug) {
      closePanel()
      return
    }

    void navigate({
      to: '/regionen/$regionSlug',
      params: { regionSlug: region.slug },
      ...(regionSlug ? { search: location.search } : {}),
    })
    closePanel()
  }

  const moveFocusedOption = (direction: 1 | -1) => {
    if (!listOptions.length) return
    const currentIndex = listOptions.findIndex((region) => region.slug === focusedSlug)
    const startIndex = currentIndex === -1 ? 0 : currentIndex
    const nextIndex = Math.max(0, Math.min(listOptions.length - 1, startIndex + direction))
    setFocusedSlug(listOptions[nextIndex]?.slug ?? null)
  }

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    if (inHeadlessMenu) preventMenuClickDefault(event)
    if (open) {
      closePanel()
      return
    }
    openPanel()
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closePanel()
      return
    }
    if (event.key === 'ArrowDown' && listOptions.length > 0) {
      event.preventDefault()
      setFocusedSlug(listOptions[0]?.slug ?? null)
    }
    if (event.key === 'ArrowUp' && listOptions.length > 0) {
      event.preventDefault()
      setFocusedSlug(listOptions.at(-1)?.slug ?? null)
    }
  }

  const handleListboxKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveFocusedOption(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveFocusedOption(-1)
        break
      case 'Home':
        event.preventDefault()
        setFocusedSlug(listOptions[0]?.slug ?? null)
        break
      case 'End':
        event.preventDefault()
        setFocusedSlug(listOptions.at(-1)?.slug ?? null)
        break
      case 'Enter':
        if (focusedSlug) {
          const region = listOptions.find((item) => item.slug === focusedSlug)
          if (region) handleSelect(region)
        }
        break
      case 'Escape':
        event.preventDefault()
        closePanel()
        break
    }
  }

  return (
    <div className="my-2">
      <p className="mb-1 font-medium text-gray-900">Region wechseln</p>
      <button
        id={triggerId}
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-haspopup="listbox"
        className="flex w-full items-center gap-2 rounded border border-pink-400/60 bg-white px-2 py-1.5 text-left text-xs text-gray-900 disabled:cursor-wait disabled:opacity-70"
      >
        <span className="min-w-0 flex-1 truncate">
          {isPending ? 'Regionen laden…' : (currentRegion?.name ?? 'Region wählen')}
        </span>
        <ChevronUpDownIcon className="size-4 shrink-0 text-gray-500" aria-hidden="true" />
      </button>

      {open && !isPending && (
        <div className="mt-1 rounded border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-1.5">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setFocusedSlug(null)
              }}
              onClick={inHeadlessMenu ? preventMenuClickDefault : undefined}
              onKeyDown={handleSearchKeyDown}
              placeholder="Region suchen…"
              aria-label="Region suchen"
              aria-controls={listboxId}
              aria-autocomplete="list"
              role="combobox"
              aria-expanded={open}
              className="w-full rounded border-0 bg-transparent px-1 py-1 text-base text-gray-900 outline-none placeholder:text-gray-500 sm:text-xs"
            />
          </div>
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Regionen"
            onKeyDown={handleListboxKeyDown}
            className="max-h-48 overflow-y-auto overscroll-contain py-1 text-xs"
          >
            {active.map((region) => (
              <RegionListOption
                key={region.slug}
                region={region}
                isCurrent={region.slug === regionSlug}
                isFocused={region.slug === focusedSlug}
                onSelect={handleSelect}
              />
            ))}
            {deactivated.length > 0 && (
              <>
                <li
                  className="mt-1 border-t border-gray-200 px-2 pt-1.5 pb-0.5 text-[10px] font-medium text-gray-500"
                  role="presentation"
                >
                  Deaktivierte Regionen
                </li>
                {deactivated.map((region) => (
                  <RegionListOption
                    key={region.slug}
                    region={region}
                    isCurrent={region.slug === regionSlug}
                    isFocused={region.slug === focusedSlug}
                    onSelect={handleSelect}
                    className="opacity-60"
                  />
                ))}
              </>
            )}
            {!hasResults && <li className="px-2 py-1.5 text-gray-500">Keine Region gefunden.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
