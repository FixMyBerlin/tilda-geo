import { NavigationDesktop } from '../NavigationDesktop/NavigationDesktop'
import { NavigationMobile } from '../NavigationMobile/NavigationMobile'
import { NavigationWrapper } from '../NavigationWrapper/NavigationWrapper'
import { HeaderAppLogoWhite } from './HeaderAppLogo'
import { primaryNavigation, secondaryNavigationGrouped } from './navigation.const'

export const HeaderApp = () => {
  return (
    <NavigationWrapper>
      <NavigationMobile
        logo={<HeaderAppLogoWhite />}
        primaryNavigation={primaryNavigation}
        secondaryNavigation={secondaryNavigationGrouped}
      />
      <NavigationDesktop
        logo={<HeaderAppLogoWhite />}
        primaryNavigation={primaryNavigation}
        secondaryNavigation={secondaryNavigationGrouped}
        secondaryNavigationLogo={false}
      />
    </NavigationWrapper>
  )
}
