import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { UI_SPRING } from './spring.const'

/** Start revealing slightly before the element reaches the viewport edge. */
const SCROLL_REVEAL_VIEWPORT = {
  once: true,
  margin: '0px 0px 100px 0px',
  amount: 0.15,
} as const

type Props = {
  children: ReactNode
  className?: string
  /** Stagger offset in seconds (e.g. `index * 0.1`). */
  delay?: number
  /** Distance to rise from (px). */
  y?: number
}

/**
 * Reveals its content once as it scrolls into view: fade + upward rise + subtle scale.
 * Fires a single time before the element fully enters the viewport. Keep it to
 * below-the-fold, non-LCP content so the initial `opacity: 0` never delays first paint.
 */
export const ScrollReveal = ({ children, className, delay = 0, y = 48 }: Props) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y, scale: 0.96 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={SCROLL_REVEAL_VIEWPORT}
    transition={{ ...UI_SPRING, delay }}
  >
    {children}
  </motion.div>
)
