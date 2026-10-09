import type { Transition } from 'motion/react'

/**
 * House-standard spring for UI chrome. Use this for panels, modals, and entrances so everything
 * shares one physical feel.
 *
 * Critically damped (damping = 2 * sqrt(stiffness)), so nothing overshoots: a panel that
 * overshoots its width by a pixel resizes the map a second time when it settles back.
 */
export const UI_SPRING: Transition = { type: 'spring', damping: 36, stiffness: 320 }
