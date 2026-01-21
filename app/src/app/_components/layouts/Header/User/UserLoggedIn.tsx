import { Link } from '@/src/app/_components/links/Link'
import { useHasPermissions } from '@/src/app/_hooks/useHasPermissions'
import { isAdmin } from '@/src/app/_hooks/usersUtils'
import { getFullname } from '@/src/app/admin/memberships/_components/utils/getFullname'
import { useRegionSlug } from '@/src/app/regionen/[regionSlug]/_components/regionUtils/useRegionSlug'
import { useMapActions } from '@/src/app/regionen/[regionSlug]/_hooks/mapState/useMapState'
import logout from '@/src/server/auth/mutations/logout'
import { CurrentUser } from '@/src/server/users/queries/getCurrentUser'
import { useMutation } from '@blitzjs/rpc'
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import { CheckBadgeIcon, UserIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'
import { Fragment } from 'react'
import { twJoin } from 'tailwind-merge'
import { UserLoggedInAdminInfo } from './UserLoggedInAdminInfo'

export type UserLoggedInProp = {
  user: NonNullable<CurrentUser>
}

export const UserLoggedIn = ({ user }: UserLoggedInProp) => {
  const [logoutMutation] = useMutation(logout)
  const { resetInspectorFeatures } = useMapActions()

  const isRegionsPage = Boolean(useRegionSlug())
  const hasPermissions = useHasPermissions()

  const missingEmail = !user.email
  const missingOsmDescription = !user.osmDescription?.trim()
  const regionButNoPermission = isRegionsPage && hasPermissions === false
  const hasTodos = missingEmail || missingOsmDescription || regionButNoPermission

  return (
    <Menu as="div" className="relative z-50 ml-3 sm:ml-6">
      <MenuButton className="flex rounded-full bg-gray-800 text-sm hover:ring-1 hover:ring-gray-500 hover:ring-offset-2 hover:ring-offset-gray-800 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none">
        <span className="sr-only">User-Menü</span>
        {user.osmAvatar ? (
          <Image
            src={user.osmAvatar}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full"
            alt=""
            aria-hidden="true"
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
        <MenuItems className="ring-opacity-5 absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black focus:outline-none">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700">
            <p className="mb-1">
              <strong>Angemeldet als {user.osmName}</strong>
            </p>
            {isRegionsPage && hasPermissions === false && (
              <p className="my-2 rounded bg-amber-500 p-1 leading-snug">
                Hinweis: Sie haben bisher{' '}
                <strong>keine zusätzlichen Rechte auf dieser Region</strong>. Sie können damit alle
                öffentlichen Daten sehen, aber eventuelle geschützte Daten nicht.
              </p>
            )}
            <div className="mb-1">
              <p className="truncate">
                Name:{' '}
                {getFullname(user) ? (
                  getFullname(user)
                ) : (
                  <Link
                    href="/settings/user"
                    classNameOverwrite="text-gray-400 hover:text-blue-500 hover:underline"
                  >
                    Bitte Name ergänzen…
                  </Link>
                )}
              </p>
              <p className="truncate">eMail: {user.email ?? '–'}</p>
            </div>
            {isRegionsPage && hasPermissions === true && !isAdmin(user) && (
              <div className="flex items-center gap-1 text-xs leading-4">
                <CheckBadgeIcon className="inline-block h-6 w-6" />
                <span>Sie sind Mitarbeiter dieser Region</span>
              </div>
            )}

            {missingOsmDescription && (
              <div className="my-2 rounded bg-amber-500 p-1 leading-snug">
                Für diesen Account ist noch keine Beschreibung auf OpenStreetMap hinterlegt.
                <br />
                <Link href="/settings/user#description-missing" button>
                  Account bearbeiten
                </Link>
              </div>
            )}
            {missingEmail ? (
              <div className="my-2 rounded bg-amber-500 p-1 leading-snug">
                Für diesen Account ist noch keine E-Mail-Adresse hinterlegt. Diese wird benötigt um
                Nachrichten schicken zu können.
                <br />
                <Link href="/settings/user" button>
                  Account bearbeiten
                </Link>
              </div>
            ) : (
              <Link href="/settings/user">Account bearbeiten</Link>
            )}
          </div>
          <UserLoggedInAdminInfo user={user} />
          <MenuItem>
            {({ focus }) => (
              <button
                onClick={async () => {
                  // We need to reset the inspector because it might hold atlas notes which would throw an authorization error if left open
                  resetInspectorFeatures()
                  await logoutMutation()
                }}
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
