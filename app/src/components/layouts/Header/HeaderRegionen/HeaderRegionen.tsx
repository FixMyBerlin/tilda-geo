import { MotionConfig } from 'motion/react'
import { useId } from 'react'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { RegionPanelToggle } from '@/components/regionen/pageRegionSlug/welcome/RegionPanelToggle'
import { RegionWelcomeDesktopPanel } from '@/components/regionen/pageRegionSlug/welcome/RegionWelcomeDesktopPanel'
import { useRegionWelcomePanel } from '@/components/regionen/pageRegionSlug/welcome/useRegionWelcomePanel'
import { NavigationDesktop } from '../NavigationDesktop/NavigationDesktop'
import { NavigationMobile } from '../NavigationMobile/NavigationMobile'
import { NavigationWrapper } from '../NavigationWrapper/NavigationWrapper'
import { HeaderRegionenLogo } from './HeaderRegionenLogo'
import { defaultPrimaryNavigation, defaultSecondaryNavigationGrouped } from './navigation.const'

export const HeaderRegionen = () => {
  const region = useRegion()
  const panelId = useId()
  const { welcome, isOpen, closePanel, togglePanel, toggleRef, panelRef, motionTransition } =
    useRegionWelcomePanel()
  const primaryNavigation = [...defaultPrimaryNavigation, ...(region?.navigationLinks ?? [])]

  return (
    <MotionConfig transition={motionTransition}>
      <NavigationWrapper
        className={isOpen ? 'relative z-50 shadow-[0_10px_24px_-6px_rgba(0,0,0,0.55)]' : undefined}
      >
        <NavigationMobile
          logo={<HeaderRegionenLogo />}
          primaryNavigation={primaryNavigation}
          secondaryNavigation={defaultSecondaryNavigationGrouped}
        />
        <NavigationDesktop
          logo={<HeaderRegionenLogo />}
          primaryNavigation={primaryNavigation}
          trailing={
            // Always shown: the panel is also the region secondary-links surface (not welcome-only).
            <RegionPanelToggle
              panelId={panelId}
              expanded={isOpen}
              onToggle={togglePanel}
              toggleRef={toggleRef}
              motionTransition={motionTransition}
            />
          }
        />
      </NavigationWrapper>
      <RegionWelcomeDesktopPanel
        panelId={panelId}
        welcome={welcome}
        isOpen={isOpen}
        onClose={closePanel}
        panelRef={panelRef}
        motionTransition={motionTransition}
      />
    </MotionConfig>
  )
}
