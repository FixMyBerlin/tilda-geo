import { Link, useLocation } from '@tanstack/react-router'
import { twJoin } from 'tailwind-merge'
import type { PrimaryNavigationProps } from '../types'

type Props = {
  menuItems: PrimaryNavigationProps['primaryNavigation']
}

export const NavigationDesktopLinks = ({ menuItems }: Props) => {
  const { pathname } = useLocation()

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {menuItems.map((item) => {
        if ('to' in item) {
          const current = pathname === item.to
          return (
            <Link
              key={item.name}
              // @ts-expect-error How to solve this with TS?…
              to={item.to}
              hash={item.hash}
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
        }
        return (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={twJoin(
              'bg-gray-700 text-gray-100 hover:bg-gray-600 hover:text-white',
              'flex shrink-0 items-center rounded-md px-3 py-2 text-sm leading-none font-medium no-underline',
            )}
          >
            {item.name}
          </a>
        )
      })}
    </div>
  )
}
