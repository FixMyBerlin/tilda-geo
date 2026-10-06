import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
} from '@headlessui/react'
import {
  CheckIcon,
  ChevronUpDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { adminNavRegionsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import type { AdminNavRegion } from '@/server/admin/queries/getAdminNavRegions.server'

const regionStatusLabels: Partial<Record<AdminNavRegion['status'], string>> = {
  PRIVATE: 'Privat',
  DEACTIVATED: 'Deaktiviert',
}

export const regionLabel = (region: AdminNavRegion) => region.name || region.slug

export const regionMatchesQuery = (region: AdminNavRegion, query: string) =>
  [region.name, region.fullName, region.slug].some((value) => value.toLowerCase().includes(query))

const ALL_REGIONS = ''

const tones = {
  dark: {
    input: twJoin(
      'block w-full rounded-md bg-white/5 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10',
      'placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-500',
    ),
    chevron: 'size-4 text-gray-500 group-hover:text-gray-300',
    options: twJoin(
      'z-50 max-h-72 w-(--input-width) min-w-72 overflow-y-auto rounded-md bg-gray-900 py-1 text-sm shadow-lg ring-1 ring-white/10 [--anchor-gap:--spacing(1)] empty:invisible',
      'transition duration-100 ease-in data-closed:opacity-0',
    ),
    option:
      'group flex cursor-pointer items-start gap-x-2 px-3 py-1.5 text-gray-300 select-none data-focus:bg-gray-700 data-focus:text-white',
    check: 'text-yellow-500',
    empty: 'px-3 py-2 text-gray-400',
    slug: 'block truncate text-xs text-gray-500 group-data-focus:text-gray-300',
    clear: 'text-gray-400 hover:text-gray-200',
    searchIcon: 'text-gray-500',
  },
  light: {
    input: twJoin(
      'block w-full rounded-md border-0 bg-white py-1.5 text-sm text-gray-900 shadow-xs ring-1 ring-gray-300',
      'placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500 focus:outline-none',
    ),
    chevron: 'size-5 text-gray-400 group-hover:text-gray-600',
    options: twJoin(
      'z-50 max-h-72 w-(--input-width) min-w-64 overflow-y-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-gray-900/5 [--anchor-gap:--spacing(1)] empty:invisible',
      'transition duration-100 ease-in data-closed:opacity-0',
    ),
    option:
      'group flex cursor-pointer items-start gap-x-2 px-3 py-1.5 text-gray-900 select-none data-focus:bg-yellow-50',
    check: 'text-yellow-600',
    empty: 'px-3 py-2 text-gray-500',
    slug: 'block truncate text-xs text-gray-500',
    clear: 'text-gray-400 hover:text-gray-600',
    searchIcon: 'text-gray-400',
  },
} as const

type Props = {
  /** Selected region slug; `undefined` is „no region“ (sidebar: none, filter: all). */
  value: string | undefined
  onChange: (slug: string | undefined) => void
  label: string
  placeholder: string
  tone: 'dark' | 'light'
  /** Visible „Region:“ next to the input (list filter). Sidebar uses an sr-only label. */
  inlineLabel?: boolean
  searchIcon?: boolean
  /** X control that clears the value (list filter). */
  allowClear?: boolean
  /** „Alle Regionen“ row when the query is empty (list filter). */
  allOptionLabel?: string
}

/**
 * Shared region combobox: typeahead over `adminNavRegionsQueryOptions`. Callers own navigation
 * (`onChange`). `as="div"` so the default Fragment isn't given the dev-only `data-tsd-source` prop.
 */
export const AdminRegionPicker = ({
  value,
  onChange,
  label,
  placeholder,
  tone,
  inlineLabel = false,
  searchIcon = false,
  allowClear = false,
  allOptionLabel,
}: Props) => {
  const { data: regions } = useSuspenseQuery(adminNavRegionsQueryOptions())
  const [query, setQuery] = useState('')
  const classes = tones[tone]
  const normalizedQuery = query.trim().toLowerCase()
  const filteredRegions = normalizedQuery
    ? regions.filter((region) => regionMatchesQuery(region, normalizedQuery))
    : regions

  const commit = (slug: string | undefined) => {
    setQuery('')
    onChange(slug)
  }

  return (
    <Combobox
      as="div"
      immediate
      value={value ?? ALL_REGIONS}
      onChange={(slug: string | null) => commit(slug || undefined)}
      onClose={() => setQuery('')}
      className={inlineLabel ? 'flex w-full max-w-sm min-w-0 items-center gap-x-2' : undefined}
    >
      <Label className={inlineLabel ? 'shrink-0 text-sm font-medium text-gray-700' : 'sr-only'}>
        {label}
        {inlineLabel ? <span aria-hidden="true">:</span> : null}
      </Label>
      <div className="relative min-w-0 flex-1">
        {searchIcon ? (
          <MagnifyingGlassIcon
            aria-hidden="true"
            className={twJoin(
              'pointer-events-none absolute inset-y-0 left-2.5 my-auto size-4',
              classes.searchIcon,
            )}
          />
        ) : null}
        <ComboboxInput
          className={twJoin(
            classes.input,
            searchIcon ? 'pr-8 pl-8' : allowClear && value ? 'pr-14 pl-3' : 'pr-8 pl-3',
          )}
          placeholder={placeholder}
          displayValue={(slug: string | null) => {
            if (!slug) return ''
            const region = regions.find((candidate) => candidate.slug === slug)
            return region ? regionLabel(region) : slug
          }}
          onChange={(event) => setQuery(event.target.value)}
        />
        {allowClear && value ? (
          <button
            type="button"
            onClick={() => commit(undefined)}
            className={twJoin(
              'absolute inset-y-0 right-7 my-auto h-fit rounded p-0.5',
              classes.clear,
            )}
          >
            <XMarkIcon aria-hidden="true" className="size-4" />
            <span className="sr-only">Regionsfilter aufheben</span>
          </button>
        ) : null}
        <ComboboxButton className="group absolute inset-y-0 right-0 flex items-center rounded-r-md px-2">
          <span className="sr-only">Regionsliste öffnen</span>
          <ChevronUpDownIcon aria-hidden="true" className={classes.chevron} />
        </ComboboxButton>
      </div>
      <ComboboxOptions anchor="bottom start" transition className={classes.options}>
        {allOptionLabel && !normalizedQuery ? (
          <ComboboxOption value={ALL_REGIONS} className={classes.option}>
            <CheckIcon
              aria-hidden="true"
              className={twJoin(
                'mt-0.5 size-4 shrink-0',
                classes.check,
                value ? 'invisible' : 'visible',
              )}
            />
            <span className="min-w-0 flex-1 font-medium">{allOptionLabel}</span>
          </ComboboxOption>
        ) : null}
        {normalizedQuery && filteredRegions.length === 0 ? (
          <div className={classes.empty}>Keine Region gefunden.</div>
        ) : (
          filteredRegions.map((region) => {
            const selected = region.slug === value
            return (
              <ComboboxOption key={region.id} value={region.slug} className={classes.option}>
                <CheckIcon
                  aria-hidden="true"
                  className={twJoin(
                    'mt-0.5 size-4 shrink-0',
                    classes.check,
                    selected ? 'visible' : 'invisible',
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {regionLabel(region)}
                    {selected ? <span className="sr-only"> (aktuelle Region)</span> : null}
                  </span>
                  <span className={classes.slug}>
                    {region.slug}
                    {regionStatusLabels[region.status]
                      ? ` · ${regionStatusLabels[region.status]}`
                      : null}
                  </span>
                </span>
              </ComboboxOption>
            )
          })
        )}
      </ComboboxOptions>
    </Combobox>
  )
}
