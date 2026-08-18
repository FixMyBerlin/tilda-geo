import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = {
  open: boolean
  children: ReactNode
  className?: string
}

/**
 * Animated height collapse for disclosure-style content. Unlike scale/opacity
 * transitions, animating real layout height means surrounding layout (sidebar,
 * bottom sheet) grows/shrinks smoothly instead of snapping.
 *
 * Uses CSS grid `0fr` / `1fr` instead of Motion `height: 'auto'`. Animating to
 * `auto` pins an inline pixel height that goes stale when siblings change size
 * (e.g. Höhenprofil unmounting) and leaves the inspector looking short/clipped.
 *
 * Content stays mounted while collapsed (required for measurement);
 * `inert` keeps the hidden content out of tab order and the a11y tree.
 */
export const MotionCollapse = ({ open, children, className }: Props) => (
  <motion.div
    initial={false}
    animate={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    inert={!open}
    className={twMerge('grid', className)}
  >
    <div className="overflow-hidden">{children}</div>
  </motion.div>
)
