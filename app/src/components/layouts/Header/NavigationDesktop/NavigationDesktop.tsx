import type { PrimaryNavigation } from '../types'
import { User } from '../User/User'
import { NavigationDesktopLinks } from './NavigationDesktopLinks'

type Props = {
  logo: React.ReactElement
  /** Next to the logo — the mode switcher on region pages. */
  leading?: React.ReactNode
  primaryNavigation: PrimaryNavigation[]
  /** Control after User — secondary menu (app) or region panel toggle (regionen). */
  trailing: React.ReactNode
}

export const NavigationDesktop = ({ logo: Logo, leading, primaryNavigation, trailing }: Props) => {
  return (
    <div className="relative z-50 hidden min-h-16 w-full min-w-0 items-center justify-between gap-4 sm:flex sm:h-16">
      <div className="flex min-w-0 shrink-0 items-center gap-4">
        {Logo}
        {leading}
      </div>
      <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4">
        <NavigationDesktopLinks menuItems={primaryNavigation} />
        <User />
        {trailing}
      </div>
    </div>
  )
}
