import { InformationCircleIcon } from '@heroicons/react/20/solid'
import { type ReactNode, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const TOOLTIP_WIDTH = 320 // = w-80, für das Clamping am rechten Fensterrand

/**
 * Info-Icon mit Hover-/Fokus-Tooltip. Der Tooltip wird per Portal an `document.body` gehängt und
 * `fixed` positioniert — sonst schneidet ihn das Planungs-Panel ab, das ein Scroll-Container ist
 * (`overflow-auto`); ein höherer z-index hilft dagegen nicht.
 */
export const InfoTooltip = ({ children }: { children: ReactNode }) => {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPosition({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - TOOLTIP_WIDTH - 8)),
    })
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Hinweis anzeigen"
        onMouseEnter={show}
        onMouseLeave={() => setPosition(null)}
        onFocus={show}
        onBlur={() => setPosition(null)}
        className="cursor-help text-gray-400 hover:text-gray-600"
      >
        <InformationCircleIcon className="size-4" />
      </button>

      {position &&
        createPortal(
          <div
            role="tooltip"
            style={{ top: position.top, left: position.left }}
            className="pointer-events-none fixed z-50 w-80 rounded bg-gray-800 px-2 py-1.5 text-xs font-normal text-white shadow-lg"
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  )
}
