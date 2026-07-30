import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import { UserIcon } from '@heroicons/react/24/solid'
import { Fragment } from 'react'
import { twJoin } from 'tailwind-merge'
import { Img } from '@/components/shared/Img'
import { playwrightTestId } from '@/components/shared/utils/playwright'
import type { CurrentUser } from '@/server/users/queries/getCurrentUser.server'
import { useLogout } from './useLogout'
import { UserMenuContent } from './UserMenuContent'
import { useUserHasTodos } from './useUserHasTodos'

type Props = {
  user: NonNullable<CurrentUser>
}

export const UserLoggedIn = ({ user }: Props) => {
  const handleLogout = useLogout()
  const hasTodos = useUserHasTodos(user)

  return (
    <Menu
      as="div"
      className="relative z-50 ml-3 sm:ml-6"
      data-testid={playwrightTestId('user-info')}
    >
      <MenuButton className="flex rounded-full bg-gray-800 text-sm hover:ring-1 hover:ring-gray-500 hover:ring-offset-2 hover:ring-offset-gray-800 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none">
        <span className="sr-only">User-Menü</span>
        {user.osmAvatar ? (
          <Img
            src={user.osmAvatar}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full"
            alt=""
            aria-hidden
          />
        ) : (
          <UserIcon className="h-6 w-6 text-gray-300" aria-hidden="true" />
        )}
        {hasTodos && (
          <div className="absolute -top-0.5 right-0 h-2 w-2 rounded-full bg-amber-500">
            <span className="sr-only">Es fehlen wichtige Informationen für den Account.</span>
          </div>
        )}
      </MenuButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems
          modal={false}
          className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-md bg-white py-1 shadow-lg outline-1 outline-black/5"
        >
          <UserMenuContent user={user} />
          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                onClick={handleLogout}
                className={twJoin(
                  focus ? 'bg-gray-100' : '',
                  'w-full px-4 py-2 text-left text-sm text-gray-700',
                )}
              >
                Ausloggen
              </button>
            )}
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  )
}
