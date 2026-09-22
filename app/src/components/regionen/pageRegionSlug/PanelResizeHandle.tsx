type Props = {
  label: string
  onPointerDown: React.PointerEventHandler<HTMLDivElement>
}

/** Two-column grip. Heroicons has no vertical grip. */
const GripIcon = () => {
  return (
    <svg viewBox="0 0 10 16" className="h-2.5 w-1.5" fill="currentColor" aria-hidden>
      <circle cx="2.5" cy="2" r="1.15" />
      <circle cx="7.5" cy="2" r="1.15" />
      <circle cx="2.5" cy="8" r="1.15" />
      <circle cx="7.5" cy="8" r="1.15" />
      <circle cx="2.5" cy="14" r="1.15" />
      <circle cx="7.5" cy="14" r="1.15" />
    </svg>
  )
}

/**
 * Left-edge resize strip for the inspector and the mode panel.
 * A small grip pill sits on the divider at mid-height. Hover uses the mobile
 * sheet grabber gray; while dragging, the pill matches the resize line.
 */
export const PanelResizeHandle = ({ label, onPointerDown }: Props) => {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      onPointerDown={onPointerDown}
      className="group absolute inset-y-0 left-0 z-30 w-4 -translate-x-1/2 cursor-col-resize touch-none select-none"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-2 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-gray-950/80 opacity-0 group-active:opacity-100"
      />
      <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-active:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100">
        <span className="inline-flex h-5 w-2.5 items-center justify-center rounded-full bg-gray-300 text-gray-600 group-active:bg-gray-950/80 group-active:text-white">
          <GripIcon />
        </span>
      </span>
    </div>
  )
}
