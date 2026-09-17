import { type KeyboardEvent, type ReactNode, useEffect, useRef } from 'react'
import { twJoin } from 'tailwind-merge'
import { useModeListActions } from './mode-list-store'
import {
  modePanelListItemActiveClassName,
  modePanelListItemHoverClassName,
} from './modePanel.const'

type Props = {
  id: string
  coordinates: [number, number]
  active?: boolean
  onClick: () => void
  cells: ReactNode[]
  actions?: ReactNode
}

/** Multi-column table row. One cell per column at wide breakpoints. */
export const ModeDataTableCellsRow = ({
  id,
  coordinates,
  active = false,
  onClick,
  cells,
  actions,
}: Props) => {
  const { hoverListItem, unhoverListItem } = useModeListActions()
  const ref = useRef<HTMLTableRowElement>(null)

  useEffect(
    function scrollActiveTableRowIntoView() {
      if (active) {
        ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    },
    [active],
  )

  return (
    <>
      <tr
        ref={ref}
        className={twJoin(
          'group/row border-b border-gray-100 @[36rem]:table-row',
          active ? modePanelListItemActiveClassName : modePanelListItemHoverClassName,
          'cursor-pointer select-none',
        )}
        onClick={onClick}
        onMouseEnter={() => hoverListItem({ id, coordinates })}
        onMouseLeave={() => unhoverListItem(id)}
        onFocus={() => hoverListItem({ id, coordinates })}
        onBlur={() => unhoverListItem(id)}
        onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onClick()
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
        <tr className="border-b border-gray-100 bg-gray-50/80">
          <td colSpan={cells.length} className="px-3 py-2">
            {actions}
          </td>
        </tr>
      ) : null}
    </>
  )
}
