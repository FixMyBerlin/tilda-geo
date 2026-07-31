import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { NavigationDesktop } from '../NavigationDesktop/NavigationDesktop'
import { NavigationMobile } from '../NavigationMobile/NavigationMobile'
import { NavigationWrapper } from '../NavigationWrapper/NavigationWrapper'
import { HeaderRegionenLogo } from './HeaderRegionenLogo'
import { defaultPrimaryNavigation, defaultSecondaryNavigationGrouped } from './navigation.const'

export const HeaderRegionen = () => {
  const region = useRegion()
  const primaryNavigation = [...defaultPrimaryNavigation, ...(region?.navigationLinks ?? [])]
  return (
    <NavigationWrapper>
      <NavigationMobile
        logo={<HeaderRegionenLogo />}
        primaryNavigation={primaryNavigation}
        secondaryNavigation={defaultSecondaryNavigationGrouped}
      />
      <NavigationDesktop
        logo={<HeaderRegionenLogo />}
        primaryNavigation={primaryNavigation}
        secondaryNavigation={defaultSecondaryNavigationGrouped}
        secondaryNavigationLogo={true}
      />
    </NavigationWrapper>
  )
}
