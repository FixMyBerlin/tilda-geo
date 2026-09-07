import { type ReactNode, useEffect, useRef } from 'react'
import { twJoin } from 'tailwind-merge'
import { useModeListActions } from './mode-list-store'
import {
  modePanelListItemActiveClassName,
  modePanelListItemBorderClassName,
  modePanelListItemHoverClassName,
} from './modePanel.const'

type Props = {
  /** Prefixed by mode so ids never collide, e.g. `note-123`. */
  id: string
  /** `[lng, lat]` for the list-hover map marker (viewport + this point only). */
  coordinates: [number, number]
  /** True when this row is the selected map feature (`f` / mode selection params). */
  active?: boolean
  onClick: () => void
  children: ReactNode
  /** Controls below the row button so they are not nested inside it. */
  actions?: ReactNode
}

/**
 * One row in a mode page's item list. Hovering anywhere on the row highlights the item on the map
 * (via the mode list store); when it becomes active (e.g. by clicking its feature on the map) it
 * scrolls into view. The clickable summary is a button; interactive `actions` render outside it so
 * nested interactive elements stay valid.
 */
export const ModeListItem = ({
  id,
  coordinates,
  active = false,
  onClick,
  children,
  actions,
}: Props) => {
  const { hoverListItem, unhoverListItem } = useModeListActions()
  const ref = useRef<HTMLLIElement>(null)

  useEffect(
    function scrollActiveListItemIntoView() {
      if (active) {
        ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    },
    [active],
  )

  return (
    <li
      ref={ref}
      className={twJoin(
        'list-none',
        modePanelListItemBorderClassName,
        active ? modePanelListItemActiveClassName : '',
      )}
      onMouseEnter={() => hoverListItem({ id, coordinates })}
      onMouseLeave={() => unhoverListItem(id)}
    >
      <button
        type="button"
        onClick={onClick}
        onFocus={() => hoverListItem({ id, coordinates })}
        onBlur={() => unhoverListItem(id)}
        className={twJoin(
          'block w-full px-4 py-3 text-left text-sm',
          active ? '' : modePanelListItemHoverClassName,
        )}
        aria-current={active ? 'true' : undefined}
      >
        {children}
      </button>
      {actions && <div className="px-4 pb-3">{actions}</div>}
    </li>
  )
}
