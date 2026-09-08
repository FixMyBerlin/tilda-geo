type Props = {
  label: string
  onPointerDown: React.PointerEventHandler<HTMLDivElement>
}

/** Quiet left-edge drag strip. The cursor is the main affordance; hover is a hairline. */
export const PanelResizeHandle = ({ label, onPointerDown }: Props) => {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      className="absolute top-0 bottom-0 left-0 z-30 w-2 cursor-col-resize touch-none select-none after:pointer-events-none after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-black/10 after:opacity-0 after:transition-opacity hover:after:opacity-100 active:after:bg-black/20 active:after:opacity-100"
      onPointerDown={onPointerDown}
    />
  )
}
