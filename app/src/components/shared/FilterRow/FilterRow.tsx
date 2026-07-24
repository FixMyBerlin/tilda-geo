import { ChevronDownIcon } from '@heroicons/react/16/solid'
import type { LinkOptions } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { twMerge } from 'tailwind-merge'
import { Link } from '@/components/shared/links/Link'
import { Pill } from '@/components/shared/text/Pill'
import type { Router } from '@/router'
import { filterChipClassName } from './FilterChip'
import { FilterChipDot } from './FilterChipDot'
import type { FilterRowItem } from './types'

type FilterRowProps<TSearch> = {
  items: FilterRowItem[]
  activeId: string
  to: LinkOptions<Router>['to']
  buildSearch: (id: string) => TSearch
  ariaLabel: string
  /** Visible prefix before chips, e.g. `Modell` → `Modell:` */
  label?: string
}

export function FilterRow<TSearch>({
  items,
  activeId,
  to,
  buildSearch,
  ariaLabel,
  label,
}: FilterRowProps<TSearch>) {
  const navigate = useNavigate()
  const activeItem = items.find((item) => item.id === activeId) ?? items[0]

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
      {label ? <span className="shrink-0 text-sm font-medium text-gray-700">{label}:</span> : null}
      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-1 sm:hidden">
          <select
            value={activeItem?.id ?? ''}
            aria-label={ariaLabel}
            className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/90 py-2 pr-8 pl-3 text-base text-gray-800 shadow-sm ring-1 ring-gray-900/5 focus:ring-2 focus:ring-yellow-200 focus:outline-none"
            onChange={(e) => {
              navigate({
                to,
                search: buildSearch(e.target.value) as LinkOptions<Router>['search'],
              })
            }}
          >
            {items.map((item) => (
              <option key={item.id || '__all__'} value={item.id}>
                {item.label}
                {item.count !== undefined ? ` (${item.count})` : ''}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
          />
        </div>
        <nav aria-label={ariaLabel} className="hidden flex-wrap gap-2 sm:flex">
          {items.map((item) => {
            const current = item.id === activeId
            return (
              <Link
                key={item.id || '__all__'}
                to={to}
                search={buildSearch(item.id) as LinkOptions<Router>['search']}
                classNameOverwrite={twMerge(
                  filterChipClassName(current),
                  item.dotFillClassName && 'gap-1.5',
                )}
                aria-current={current ? 'page' : undefined}
              >
                {item.dotFillClassName ? (
                  <FilterChipDot fillClassName={item.dotFillClassName} />
                ) : null}
                {item.label}
                {item.count !== undefined ? (
                  <Pill
                    color={current ? 'yellow' : 'gray'}
                    className="ml-0.5 min-w-5 justify-center rounded px-1 py-px text-[0.65rem] leading-none tracking-tighter lining-nums tabular-nums"
                  >
                    {item.count}
                  </Pill>
                ) : null}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
