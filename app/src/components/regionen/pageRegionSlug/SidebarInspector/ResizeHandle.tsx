import { forwardRef } from 'react'

type Props = {
  onResizeStart: (e: React.MouseEvent) => void
  inspectorWidth: number
}

export const ResizeHandle = forwardRef<HTMLDivElement, Props>(
  ({ onResizeStart, inspectorWidth }, ref) => {
    return (
      <div
        ref={ref}
        className="fixed top-0 bottom-0 z-30 w-1 cursor-col-resize transition-colors duration-150 hover:bg-purple-500"
        style={{ right: `${inspectorWidth - 1}px` }}
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
  },
)

ResizeHandle.displayName = 'ResizeHandle'
