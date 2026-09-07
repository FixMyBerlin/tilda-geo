import { type KeyboardEvent, type ReactNode, useEffect, useRef } from 'react'
import { twJoin } from 'tailwind-merge'
import { useModeListActions } from './mode-list-store'
import {
  modeDataTableActionsCellClass,
  modeDataTableActionsRowClass,
  modeDataTableBodyCellClass,
  modeDataTableBodyRowClass,
} from './modeDataTable.const'
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
          modeDataTableBodyRowClass,
          active ? modePanelListItemActiveClassName : modePanelListItemHoverClassName,
          'cursor-pointer',
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
          <td key={index} className={modeDataTableBodyCellClass}>
            {cell}
          </td>
        ))}
      </tr>
      {actions ? (
        <tr className={modeDataTableActionsRowClass}>
          <td colSpan={cells.length} className={modeDataTableActionsCellClass}>
            {actions}
          </td>
        </tr>
      ) : null}
    </>
  )
}
