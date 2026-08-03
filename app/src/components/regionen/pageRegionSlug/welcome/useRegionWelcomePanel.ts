import { useReducedMotion } from 'motion/react'
import { useRef, useState } from 'react'
import { useDialogParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDialogParam'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { UI_SPRING } from '@/components/shared/motion/spring.const'
import type { TRegionWelcome } from '@/server/regions/regionConfigMapper.server'
import { writeWelcomeDismissedCookie } from './writeWelcomeDismissedCookie'

export const useRegionWelcomePanel = () => {
  const region = useRegion()
  const regionSlug = useRegionSlug()
  const shouldReduceMotion = useReducedMotion()
  const { dialog, setRegionDialog } = useDialogParam()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const welcome: TRegionWelcome | null = region?.welcome?.enabled ? region.welcome : null
  const isOpen = dialog === 'welcome'

  // Stays true after the first open/close so loader redirects with `dialog=welcome`
  // do not spring-animate on first paint; later toggles use UI_SPRING.
  const [hasUserToggledPanel, setHasUserToggledPanel] = useState(false)

  const closePanel = () => {
    // The panel is also the secondary-links surface for regions without a welcome, so only
    // persist a dismiss when this region could actually auto-open one
    // (mirrors `resolveWelcomeDialogRedirectUrl`); the cookie lives ~400 days.
    if (regionSlug && welcome && region?.status === 'PUBLIC') {
      writeWelcomeDismissedCookie(regionSlug)
    }
    setHasUserToggledPanel(true)
    setRegionDialog(undefined)
    window.setTimeout(() => toggleRef.current?.focus({ preventScroll: true }))
  }

  const openPanel = () => {
    setHasUserToggledPanel(true)
    setRegionDialog('welcome')
    // Focus the first interactive control inside the panel after the URL updates.
    window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('button, a, [tabindex]:not([tabindex="-1"])')
        ?.focus({ preventScroll: true })
    })
  }

  const togglePanel = () => {
    if (isOpen) closePanel()
    else openPanel()
  }

  const motionTransition = shouldReduceMotion || !hasUserToggledPanel ? { duration: 0 } : UI_SPRING

  return {
    welcome,
    isOpen,
    openPanel,
    closePanel,
    togglePanel,
    toggleRef,
    panelRef,
    motionTransition,
  }
}
