import { FilterChip } from './FilterChip'
import type { FilterRowItem } from './types'

type ClientFilterRowProps<TId extends string> = {
  items: FilterRowItem[]
  activeId: TId
  onChange: (id: TId) => void
  ariaLabel: string
  sectionLabel?: string
}

export function ClientFilterRow<TId extends string>({
  items,
  activeId,
  onChange,
  ariaLabel,
  sectionLabel,
}: ClientFilterRowProps<TId>) {
  return (
    <div>
      {sectionLabel ? (
        <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
          {sectionLabel}
        </p>
      ) : null}
      <nav aria-label={ariaLabel} className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <FilterChip
              key={item.id || '__all__'}
              active={active}
              dotFillClassName={item.dotFillClassName}
              count={item.count}
              onClick={() => onChange(item.id as TId)}
            >
              {item.label}
            </FilterChip>
          )
        })}
      </nav>
    </div>
  )
}
