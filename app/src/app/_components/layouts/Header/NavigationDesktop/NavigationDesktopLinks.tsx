import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { twJoin } from 'tailwind-merge'
import { PrimaryNavigationProps } from '../types'

type Props = {
  menuItems: PrimaryNavigationProps['primaryNavigation']
}

export const NavigationDesktopLinks = ({ menuItems }: Props) => {
  const pathname = usePathname()

  return (
    <div className="flex space-x-4">
      {menuItems.map((item) => {
        const current = item.href === pathname
        return (
          <Link
            key={item.name}
            href={item.href}
            className={twJoin(
              current
                ? 'cursor-default bg-gray-900 text-white'
                : 'bg-gray-700 text-gray-100 hover:bg-gray-600 hover:text-white',
              'flex items-center rounded-md px-3 py-2 text-sm leading-none font-medium',
            )}
            aria-current={current ? 'page' : undefined}
          >
            {item.name}
          </Link>
        )
      })}
    </div>
  )
}
