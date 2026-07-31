import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { UI_SPRING } from './spring.const'

type Props = {
  children: ReactNode
  className?: string
  /** Horizontal offset to slide in from (px). */
  x?: number
  /** Vertical offset to slide in from (px). */
  y?: number
  /** Delay in seconds (e.g. for manual staggering). */
  delay?: number
}

/**
 * Enter-only slide+fade wrapper (transform/opacity only — never affects layout,
 * so it is safe inside size-observed containers like the inspector panel).
 * Animates once on mount; there is deliberately no exit animation, which keeps
 * it free of AnimatePresence mount bookkeeping.
 */
export const FadeSlideIn = ({ children, className, x = 0, y = 0, delay = 0 }: Props) => (
  <motion.div
    className={className}
    initial={{ x, y, opacity: 0 }}
    animate={{ x: 0, y: 0, opacity: 1 }}
    transition={{ ...UI_SPRING, delay }}
  >
    {children}
  </motion.div>
)
