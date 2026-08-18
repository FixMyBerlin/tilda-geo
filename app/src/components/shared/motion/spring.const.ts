import type { Transition } from 'motion/react'

/**
 * House-standard spring for UI chrome (same values as the MobileBottomSheet slide).
 * Use this for panels, modals, and entrances so everything shares one physical feel.
 */
export const UI_SPRING: Transition = { type: 'spring', damping: 32, stiffness: 320 }
