import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useEffect } from 'react'

type Props = {
  value: number
  /** Formats the in-flight value for display. Defaults to rounding. */
  format?: (value: number) => string
  className?: string
}

const defaultFormat = (value: number) => String(Math.round(value))

/**
 * Renders a number that springs to new values (count-up/down) instead of jumping.
 * Motion owns the text via a MotionValue — React never writes the target into the DOM first.
 * Respects reduced motion by jumping straight to the target.
 *
 * When the target is an integer (e.g. capacity counts), in-flight values are rounded so the
 * formatter never flashes decimals mid-spring. Non-integer targets (area, length, …) pass
 * through so the caller's format can keep its fraction digits.
 */
export const AnimatedNumber = ({ value, format = defaultFormat, className }: Props) => {
  const reducedMotion = useReducedMotion()
  const spring = useSpring(value, { damping: 40, stiffness: 300 })
  const integerTarget = Number.isInteger(value)
  const display = useTransform(spring, (latest) =>
    format(integerTarget ? Math.round(latest) : latest),
  )

  useEffect(() => {
    if (reducedMotion) {
      spring.jump(value)
    } else {
      spring.set(value)
    }
  }, [value, spring, reducedMotion])

  return <motion.span className={className}>{display}</motion.span>
}
