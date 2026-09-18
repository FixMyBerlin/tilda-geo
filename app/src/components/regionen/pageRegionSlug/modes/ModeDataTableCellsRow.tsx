import type { KeyboardEvent, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import {
  modePanelListItemActiveClassName,
  modePanelListItemHoverClassName,
  modePanelListItemHoveredClassName,
} from './modePanel.const'
import { useModeListRow } from './useModeListRow'

type Props = {
  id: string
  coordinates: [number, number]
  active?: boolean
  onClick: () => void
  cells: ReactNode[]
  actions?: ReactNode
  className?: string
}

/** Multi-column table row. One cell per column at wide breakpoints. */
export const ModeDataTableCellsRow = ({
  id,
  coordinates,
  active = false,
  onClick,
  cells,
  actions,
  className,
}: Props) => {
  const { ref, hoveredFromMap, onActivate, hoverHandlers } = useModeListRow<HTMLTableRowElement>(
    id,
    coordinates,
    active,
    onClick,
  )

  return (
    <>
      <tr
        ref={ref}
        className={twMerge(
          'group/row border-b border-white/80 @[36rem]:table-row',
          active
            ? modePanelListItemActiveClassName
            : hoveredFromMap
              ? modePanelListItemHoveredClassName
              : modePanelListItemHoverClassName,
          'cursor-pointer select-none',
          className,
        )}
        onClick={onActivate}
        onMouseEnter={hoverHandlers.onMouseEnter}
        onMouseLeave={hoverHandlers.onMouseLeave}
        onFocus={hoverHandlers.onFocus}
        onBlur={hoverHandlers.onBlur}
        onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onActivate()
          }
        }}
        tabIndex={0}
        aria-current={active ? 'true' : undefined}
      >
        {cells.map((cell, index) => (
          <td key={index} className="px-3 py-2 align-top text-sm">
            {cell}
          </td>
        ))}
      </tr>
      {actions ? (
        <tr className="border-b border-white/80 bg-gray-50/80">
          <td colSpan={cells.length} className="px-3 py-2">
            {actions}
          </td>
        </tr>
      ) : null}
    </>
  )
}
