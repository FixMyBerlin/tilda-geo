import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { DisclosureChevron } from '@/components/shared/DisclosureChevron/DisclosureChevron'
import { useExpanded, useExpandedActions } from '../expanded-store'

type Props = {
  /** Session-store key that remembers the expanded state, e.g. `<datasetKey>:licence`. */
  storeKey: string
  /** Key shown in front of the value; omit for the description. */
  label?: string
  /** Lines shown while collapsed. */
  lines?: 1 | 2
  /**
   * Set when the row decides on its own whether it can expand (e.g. the legend);
   * otherwise the row measures whether the clamped text overflows.
   */
  canToggle?: boolean
  children: ReactNode
}

const clampClassName = { 1: 'line-clamp-1', 2: 'line-clamp-2' } as const

/** One row of the static dataset info: key, value clamped to a line or two, chevron to expand. */
export const DatasetInfoRow = ({ storeKey, label, lines = 1, canToggle, children }: Props) => {
  const expanded = useExpanded(storeKey)
  const { expand, collapse } = useExpandedActions()
  const [overflowing, setOverflowing] = useState(false)

  const measured = canToggle === undefined
  // Measure only while clamped: once expanded, the text no longer overflows.
  const measureRef = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element || !measured || expanded) return
      const check = () => setOverflowing(element.scrollHeight > element.clientHeight + 1)
      check()
      const observer = new ResizeObserver(check)
      observer.observe(element)
      return () => observer.disconnect()
    },
    [measured, expanded],
  )

  const toggleable = canToggle ?? (expanded || overflowing)
  const toggle = () => (expanded ? collapse(storeKey) : expand(storeKey))

  // A labeled row moves its expanded value below the key, so long text gets the full width.
  const valueBelow = Boolean(label) && expanded

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-start gap-1.5">
        {label && <span className="w-17 shrink-0 text-gray-500">{label}</span>}
        <div
          ref={measureRef}
          className={twJoin(
            'min-w-0 flex-1 [&_p]:my-0',
            measured && !expanded && clampClassName[lines],
            expanded && '[&_p+p]:mt-1.5',
          )}
        >
          {!valueBelow && children}
        </div>
        {toggleable ? (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={expanded}
            aria-label={`${label ?? 'Beschreibung'} ${expanded ? 'einklappen' : 'ausklappen'}`}
            className="-m-0.5 shrink-0 cursor-pointer rounded-xs p-0.5 text-gray-500 hover:bg-yellow-200 hover:text-gray-900"
          >
            <DisclosureChevron open={expanded} side="trailing" className="size-3.5" />
          </button>
        ) : (
          // Keeps the value column the same width in every row.
          <span aria-hidden className="w-3.5 shrink-0" />
        )}
      </div>
      {valueBelow && (
        <div className="border-l-2 border-yellow-300 pl-1.5 [&_p]:my-0 [&_p+p]:mt-1.5">
          {children}
        </div>
      )}
    </div>
  )
}
