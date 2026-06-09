import type { PrimaryNavigationProps } from '../types'
import { User } from '../User/User'
import { NavigationDesktopLinks } from './NavigationDesktopLinks'
import { NavigationDesktopMenu } from './NavigationDesktopMenu'

type Props = PrimaryNavigationProps & {
  logo: React.ReactElement
  secondaryNavigationLogo: boolean
  // Optional extra control rendered in the right-hand group (e.g. planning-mode toggle).
  extra?: React.ReactNode
}

export const NavigationDesktop = ({
  primaryNavigation,
  secondaryNavigation,
  secondaryNavigationLogo,
  logo: Logo,
  extra,
}: Props) => {
  return (
    <div className="relative z-50 hidden min-h-16 w-full min-w-0 items-center justify-between gap-4 sm:flex sm:h-16">
      <div className="flex min-w-0 shrink-0 items-center">{Logo}</div>
      <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4">
        <NavigationDesktopLinks menuItems={primaryNavigation} />
        {extra}
        <User />
        <NavigationDesktopMenu menuItems={secondaryNavigation} logo={secondaryNavigationLogo} />
      </div>
    </div>
  )
}
