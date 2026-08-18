import { animate, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { twMerge } from 'tailwind-merge'
import { useElementSize } from '@/components/shared/hooks/useElementSize'

const HEIGHT_TRANSITION = { duration: 0.2, ease: [0.4, 0, 0.2, 1] } satisfies {
  duration: number
  ease: [number, number, number, number]
}

type Props = {
  children: ReactNode
  className?: string
}

/**
 * FLIP-style height morph: animates layout height when children change size.
 *
 * Never holds an inline height at rest — only during an in-flight animation.
 * Pinned height at rest would clip content and go stale on reflow; inline height
 * is set only for the morph, then cleared back to `auto`.
 *
 * The wrapper is always `flow-root` so child margins stay inside its border
 * box. Without a block formatting context, Legend's `mt-2 mb-1` collapse out
 * of the wrapper; turning on `overflow: hidden` for the morph then traps those
 * margins inside and the measured height is ~12px short — clipped and snapped.
 */
export const MotionAutoHeight = ({ children, className }: Props) => {
  const reducedMotion = useReducedMotion()
  const elementRef = useRef<HTMLDivElement | null>(null)
  const previousHeightRef = useRef<number | undefined>(undefined)
  const animatingRef = useRef(false)
  const animationRef = useRef<ReturnType<typeof animate> | null>(null)

  const setRef = useElementSize<HTMLDivElement>(
    (size) => {
      if (animatingRef.current) return
      previousHeightRef.current = size.height
    },
    { elementRef },
  )

  useLayoutEffect(function morphHeightOnContentChange() {
    const element = elementRef.current
    if (!element || animatingRef.current) return

    const newHeight = element.offsetHeight
    const previousHeight = previousHeightRef.current
    previousHeightRef.current = newHeight

    if (previousHeight === undefined || previousHeight === newHeight || reducedMotion) {
      return
    }

    animatingRef.current = true
    element.style.height = `${previousHeight}px`
    element.style.overflow = 'hidden'

    const controls = animate(element, { height: `${newHeight}px` }, HEIGHT_TRANSITION)
    animationRef.current = controls

    void controls.then(() => {
      if (animationRef.current !== controls) return
      const el = elementRef.current
      if (!el) return
      el.style.height = ''
      el.style.overflow = ''
      previousHeightRef.current = el.offsetHeight
      animatingRef.current = false
      animationRef.current = null
    })
  })

  useEffect(function stopMorphOnUnmount() {
    const element = elementRef.current

    return function stopMorph() {
      if (animationRef.current) {
        animationRef.current.stop()
        animationRef.current = null
      }
      if (element) {
        element.style.height = ''
        element.style.overflow = ''
      }
      animatingRef.current = false
    }
  }, [])

  return (
    <div ref={setRef} className={twMerge('flow-root', className)}>
      {children}
    </div>
  )
}
