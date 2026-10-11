import { MotionConfig } from 'motion/react'
import { useId } from 'react'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { RegionPanelToggle } from '@/components/regionen/pageRegionSlug/welcome/RegionPanelToggle'
import { RegionWelcomeDesktopPanel } from '@/components/regionen/pageRegionSlug/welcome/RegionWelcomeDesktopPanel'
import { useRegionWelcomePanel } from '@/components/regionen/pageRegionSlug/welcome/useRegionWelcomePanel'
import { NavigationDesktop } from '../NavigationDesktop/NavigationDesktop'
import { NavigationDesktopMenu } from '../NavigationDesktop/NavigationDesktopMenu'
import { NavigationWrapper } from '../NavigationWrapper/NavigationWrapper'
import { HeaderRegionenLogo } from './HeaderRegionenLogo'
import { defaultPrimaryNavigation, defaultSecondaryNavigationGrouped } from './navigation.const'

export const HeaderRegionen = () => {
  const region = useRegion()
  const panelId = useId()
  const { welcome, isOpen, closePanel, togglePanel, toggleRef, panelRef, motionTransition } =
    useRegionWelcomePanel()
  const primaryNavigation = [...defaultPrimaryNavigation, ...(region?.navigationLinks ?? [])]

  // Without welcome content the burger only offers the global links — same small flyout as the app header.
  if (!welcome) {
    return (
      <NavigationWrapper>
        <NavigationDesktop
          logo={<HeaderRegionenLogo />}
          primaryNavigation={primaryNavigation}
          trailing={
            <NavigationDesktopMenu menuItems={defaultSecondaryNavigationGrouped} logo={false} />
          }
        />
      </NavigationWrapper>
    )
  }

  return (
    <MotionConfig transition={motionTransition}>
      <NavigationWrapper
        className={isOpen ? 'relative z-50 shadow-[0_10px_24px_-6px_rgba(0,0,0,0.55)]' : undefined}
      >
        <NavigationDesktop
          logo={<HeaderRegionenLogo />}
          primaryNavigation={primaryNavigation}
          trailing={
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
