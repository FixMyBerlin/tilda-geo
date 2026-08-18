import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type React from 'react'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { UI_SPRING } from '@/components/shared/motion/spring.const'

type Props = {
  text: string
  className?: string
  children: React.ReactNode
}

export const Tooltip = ({ text, children, className }: Props) => {
  const [open, setOpen] = useState(false)
  const reducedMotion = useReducedMotion()

  // `transform: false` keeps position on top/left so Motion can own transform (scale/offset).
  const { refs, floatingStyles, context, placement, isPositioned } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top',
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
  })

  // safePolygon keeps the tooltip open while the pointer crosses the gap to the panel
  // (needed for multi-line copy users may want to read).
  const hover = useHover(context, {
    move: false,
    delay: { open: 200, close: 0 },
    handleClose: safePolygon(),
  })
  // React `onFocus` uses focusin, so focusing a wrapped button still opens the tooltip.
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role])

  const side = placement.split('-')[0]
  const enterOffset =
    side === 'bottom'
      ? { y: -4 }
      : side === 'left'
        ? { x: 4 }
        : side === 'right'
          ? { x: -4 }
          : { y: 4 }

  return (
    <div
      className={twJoin('relative', className)}
      {...getReferenceProps({ ref: refs.setReference })}
    >
      {children}
      <FloatingPortal>
        <AnimatePresence>
          {open && (
            <motion.div
              // Mount while open so Floating UI can measure; animate only after
              // `isPositioned` so Motion does not play from (0, 0).
              initial={reducedMotion ? false : { opacity: 0, scale: 0.96, ...enterOffset }}
              animate={
                isPositioned
                  ? { opacity: 1, scale: 1, x: 0, y: 0 }
                  : { opacity: 0, scale: 0.96, ...enterOffset }
              }
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, ...enterOffset }}
              transition={reducedMotion ? { duration: 0 } : UI_SPRING}
              className="z-50 w-max max-w-82 rounded bg-gray-900/90 p-2 text-xs text-white shadow-md select-none"
              {...getFloatingProps({ ref: refs.setFloating, style: floatingStyles })}
            >
              {text}
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </div>
  )
}
