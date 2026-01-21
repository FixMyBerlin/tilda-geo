import { Menu, MenuButton, MenuItem, MenuItems, MenuSeparator } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { twJoin } from 'tailwind-merge'
import { HeaderAppLogoBlack } from '../HeaderApp/HeaderAppLogo'
import { PrimaryNavigationProps } from '../types'

type Props = {
  menuItems: PrimaryNavigationProps['secondaryNavigation']
  logo: Boolean
}

export const NavigationDesktopMenu = ({ menuItems, logo }: Props) => {
  const pathname = usePathname()

  return (
    <Menu as={'div'} className="relative isolate z-50 ml-3 pr-0">
      {({ open }) => (
        <>
          <MenuButton className="inline-flex items-center justify-center rounded-md border border-gray-700 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset">
            <span className="sr-only">Sekundärmenü öffnen</span>
            {open ? (
              <XMarkIcon className="size-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="size-6" aria-hidden="true" />
            )}
          </MenuButton>
          <MenuItems
            anchor="bottom end"
            transition
            className="ring-opacity-5 z-10 mt-1 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white py-1 shadow-lg ring-1 ring-black transition duration-100 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            {menuItems.map((group, i) => {
              return (
                <div className="p-1" key={i}>
                  {group.map((item, gi) => {
                    const current = item.href === pathname
                    return (
                      <MenuItem key={gi}>
                        {({ focus }) => (
                          <Link
                            href={item.href}
                            className={twJoin(
                              focus ? 'bg-gray-100' : '',
                              current ? 'bg-gray-200' : '',
                              'block px-4 py-2 text-sm text-gray-700',
                            )}
                          >
                            {item.name}
                          </Link>
                        )}
                      </MenuItem>
                    )
                  })}
                </div>
              )
            })}
            {logo && (
              <>
                <MenuSeparator />
                <div className="flex items-center justify-center px-1 py-3">
                  <HeaderAppLogoBlack />
                </div>
              </>
            )}
          </MenuItems>
        </>
      )}
    </Menu>
  )
}
