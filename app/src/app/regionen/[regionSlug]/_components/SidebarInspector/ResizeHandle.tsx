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
        className="fixed top-0 bottom-0 z-30 w-1 cursor-col-resize hover:bg-purple-500 transition-colors duration-150"
        style={{ right: `${inspectorWidth - 1}px` }}
        onMouseDown={onResizeStart}
        role="separator"
        aria-orientation="vertical"
        aria-label="Größe der Sidebar ändern"
      >
        {/* Größerer Hit-Area zum einfacheren Greifen */}
        <div className="absolute left-0 top-0 bottom-0 w-3 -translate-x-1" />
      </div>
    )
  },
)

ResizeHandle.displayName = 'ResizeHandle'
