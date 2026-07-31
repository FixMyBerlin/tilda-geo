import { Bars3Icon } from '@heroicons/react/24/outline'
import { Reorder, useDragControls, type DragControls } from 'motion/react'
import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'

type SortableListRenderContext = {
  dragHandle: ReactNode
}

type SortableDragHandleProps = {
  ariaLabel: string
  dragControls: DragControls
}

function SortableDragHandle({ ariaLabel, dragControls }: SortableDragHandleProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="inline-flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
      onPointerDown={(event) => dragControls.start(event)}
    >
      <Bars3Icon className="size-5" aria-hidden="true" />
    </button>
  )
}

type SortableListRowProps<T> = {
  item: T
  dragHandleAriaLabel: string
  renderItem: (item: T, context: SortableListRenderContext) => ReactNode
}

function SortableListRow<T>({ item, dragHandleAriaLabel, renderItem }: SortableListRowProps<T>) {
  const dragControls = useDragControls()

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="list-none"
    >
      {renderItem(item, {
        dragHandle: (
          <SortableDragHandle ariaLabel={dragHandleAriaLabel} dragControls={dragControls} />
        ),
      })}
    </Reorder.Item>
  )
}

type Props<T> = {
  items: T[]
  getItemKey: (item: T) => string
  onReorder: (items: T[]) => void
  renderItem: (item: T, context: SortableListRenderContext) => ReactNode
  dragHandleAriaLabel?: string
  className?: string
  emptyMessage?: ReactNode
}

export function SortableList<T>({
  items,
  getItemKey,
  onReorder,
  renderItem,
  dragHandleAriaLabel = 'Reihenfolge ändern',
  className,
  emptyMessage,
}: Props<T>) {
  if (items.length === 0) {
    return emptyMessage ? <div className={className}>{emptyMessage}</div> : null
  }

  return (
    <Reorder.Group
      axis="y"
      as="ul"
      values={items}
      onReorder={onReorder}
      className={twJoin('m-0 list-none space-y-2 p-0', className)}
    >
      {items.map((item) => (
        <SortableListRow
          key={getItemKey(item)}
          item={item}
          dragHandleAriaLabel={dragHandleAriaLabel}
          renderItem={renderItem}
        />
      ))}
    </Reorder.Group>
  )
}
