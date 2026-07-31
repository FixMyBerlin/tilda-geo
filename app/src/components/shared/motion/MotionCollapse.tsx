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
 * transitions, animating the real height means surrounding layout (sidebar,
 * bottom sheet) grows/shrinks smoothly instead of snapping.
 *
 * Content stays mounted while collapsed (required for height measurement);
 * `inert` keeps the hidden content out of tab order and the a11y tree.
 */
export const MotionCollapse = ({ open, children, className }: Props) => (
  <motion.div
    initial={false}
    animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    inert={!open}
    className={twMerge('overflow-hidden', className)}
  >
    {children}
  </motion.div>
)
