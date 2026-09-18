import { type ReactNode, useEffect, useRef } from 'react'
import { twMerge } from 'tailwind-merge'
import { useIsHoveredMapListItem, useModeListActions } from './mode-list-store'
import {
  modePanelListItemActiveClassName,
  modePanelListItemBorderClassName,
  modePanelListItemHoverClassName,
  modePanelListItemHoveredClassName,
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
  /** Extra classes on the `<li>` (e.g. comment-style separators). */
  className?: string
  /** Extra classes on the row button (padding). Merged with the default padding. */
  buttonClassName?: string
}

/**
 * One row in a mode page's item list. Hovering the row highlights the item on the map (via the
 * list store). Hovering the matching map feature highlights this row without writing coordinates,
 * so the centroid ring does not appear. When it becomes active it scrolls into view. The clickable
 * summary is a button; interactive `actions` render outside it so nested interactive elements stay
 * valid.
 */
export const ModeListItem = ({
  id,
  coordinates,
  active = false,
  onClick,
  children,
  actions,
  className,
  buttonClassName,
}: Props) => {
  const { hoverListItem, unhoverListItem, clearHoveredListItem } = useModeListActions()
  const hoveredFromMap = useIsHoveredMapListItem(id)
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
      className={twMerge(
        'list-none',
        modePanelListItemBorderClassName,
        active ? modePanelListItemActiveClassName : '',
        className,
      )}
      onMouseEnter={() => hoverListItem({ id, coordinates })}
      onMouseLeave={() => unhoverListItem(id)}
    >
      <button
        type="button"
        onClick={() => {
          clearHoveredListItem()
          onClick()
        }}
        onFocus={() => hoverListItem({ id, coordinates })}
        onBlur={() => unhoverListItem(id)}
        className={twMerge(
          'block w-full cursor-pointer px-4 py-3 text-left text-sm select-none',
          active
            ? ''
            : hoveredFromMap
              ? modePanelListItemHoveredClassName
              : modePanelListItemHoverClassName,
          buttonClassName,
        )}
        aria-current={active ? 'true' : undefined}
      >
        {children}
      </button>
      {actions && <div className="px-4 pb-3">{actions}</div>}
    </li>
  )
}
