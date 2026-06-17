type Props = {
  onResizeStart: (e: React.MouseEvent) => void
  inspectorWidth: number
}

export const ResizeHandle = ({ onResizeStart, inspectorWidth }: Props) => {
  return (
    <div
      className="absolute top-0 bottom-0 left-0 z-30 w-1 -translate-x-full cursor-col-resize transition-colors duration-150 hover:bg-purple-500"
      onMouseDown={onResizeStart}
      role="slider"
      aria-orientation="vertical"
      aria-label="Größe der Sidebar ändern"
      aria-valuenow={inspectorWidth}
      aria-valuemin={320}
      aria-valuemax={800}
      tabIndex={0}
    >
      <div className="absolute top-0 bottom-0 left-0 w-3 -translate-x-1" />
    </div>
  )
}
