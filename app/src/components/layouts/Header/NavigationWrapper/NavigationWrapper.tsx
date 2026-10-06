import { twJoin } from 'tailwind-merge'
import { mapOverlayButtonElevationClassName } from '@/components/regionen/pageRegionSlug/mapOverlayChrome.const'

type Props = { children: React.ReactNode; className?: string }

export const NavigationWrapper = ({ children, className }: Props) => {
  return (
    <nav
      className={twJoin(
        'relative z-40 w-full bg-gray-800 px-4 sm:px-6 lg:px-8 print:hidden',
        mapOverlayButtonElevationClassName,
        className,
      )}
    >
      {children}
    </nav>
  )
}
