import type { PrimaryNavigationProps } from '../types'
import { User } from '../User/User'
import { NavigationDesktopLinks } from './NavigationDesktopLinks'
import { NavigationDesktopMenu } from './NavigationDesktopMenu'

type Props = PrimaryNavigationProps & {
  logo: React.ReactElement
  secondaryNavigationLogo: boolean
}

export const NavigationDesktop = ({
  primaryNavigation,
  secondaryNavigation,
  secondaryNavigationLogo,
  logo: Logo,
}: Props) => {
  return (
    <div className="relative z-50 hidden min-h-16 w-full min-w-0 items-center justify-between gap-4 sm:flex sm:h-16">
      <div className="flex min-w-0 shrink-0 items-center">{Logo}</div>
      <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4">
        <NavigationDesktopLinks menuItems={primaryNavigation} />
        <User />
        <NavigationDesktopMenu menuItems={secondaryNavigation} logo={secondaryNavigationLogo} />
      </div>
    </div>
  )
}
