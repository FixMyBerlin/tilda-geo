import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { mapOverlaySearchFieldClassName } from '../mapOverlayChrome.const'
import { ModeFilterSelect, modeFilterIcons } from './ModeFilterSelect'
import { modePanelFilterControlClassName } from './modePanel.const'
import type { ModeListExtent } from './useMapExtentFilter'

const MODE_EXTENT_FILTER_OPTIONS = [
  { value: 'view', label: 'Nur Karte' },
  { value: 'all', label: 'Überall' },
] as const satisfies readonly {
  value: ModeListExtent
  label: string
}[]

type Props = {
  search: string
  onSearchChange: (search: string) => void
  searchPlaceholder?: string
  extent?: ModeListExtent
  onExtentChange?: (extent: ModeListExtent) => void
  children?: ReactNode
}

/**
 * Compact mode filter line: a search icon that expands to the same magnifier + input + X bar as
 * map place search (`mapOverlaySearchFieldClassName`), icon-prefixed value dropdowns, and an
 * optional Ausschnitt dropdown (Nur Karte / Überall).
 */
export const ModeFilterBar = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Suchen…',
  extent,
  onExtentChange,
  children,
}: Props) => {
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isSearchOpen = expanded || search.length > 0
  const hasExtent = Boolean(onExtentChange && extent)
  const showFilterRow = !isSearchOpen || Boolean(children) || hasExtent

  useEffect(
    function focusExpandedModeSearchInput() {
      if (!expanded) return
      inputRef.current?.focus()
    },
    [expanded],
  )

  const closeSearch = () => {
    onSearchChange('')
    setExpanded(false)
  }

  return (
    <div className="flex flex-col gap-2">
      {isSearchOpen ? (
        <div className={mapOverlaySearchFieldClassName}>
          <MagnifyingGlassIcon
            className="ml-2 size-5 shrink-0 self-center text-gray-400"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') closeSearch()
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="min-w-0 flex-1 border-0 bg-transparent px-2 text-base text-gray-900 outline-none placeholder:text-gray-500 focus:border-0 focus:ring-0 focus:outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={closeSearch}
            aria-label="Suche schließen"
            className="flex w-10 shrink-0 cursor-pointer items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <XMarkIcon className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : null}
      {showFilterRow ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {isSearchOpen ? null : (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label="Suchen"
              className={twJoin(modePanelFilterControlClassName, 'shrink-0 px-1.5')}
            >
              <MagnifyingGlassIcon className="size-4" aria-hidden="true" />
            </button>
          )}
          {children}
          {onExtentChange && extent ? (
            <ModeFilterSelect
              label="Ausschnitt"
              icon={modeFilterIcons.extent}
              value={extent}
              options={MODE_EXTENT_FILTER_OPTIONS}
              onChange={onExtentChange}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
