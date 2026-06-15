import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline'
import { UserIcon } from '@heroicons/react/24/solid'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { twJoin, twMerge } from 'tailwind-merge'
import { useSignInUrl } from '@/components/shared/hooks/useSignInUrl'
import { Img } from '@/components/shared/Img'
import { useLogout } from '@/components/shared/layouts/Header/User/useLogout'
import { UserMenuContent } from '@/components/shared/layouts/Header/User/UserMenuContent'
import { useUserHasTodos } from '@/components/shared/layouts/Header/User/useUserHasTodos'
import { playwrightTestId } from '@/components/shared/utils/playwright'
import { currentUserQueryOptions } from '@/server/users/currentUserQueryOptions'
import type { CurrentUser } from '@/server/users/queries/getCurrentUser.server'
import { MobileBottomSheet } from './MobileBottomSheet'
import {
  mobileControlButtonActiveClassName,
  mobileControlButtonClassName,
} from './mobileControlButton.const'

const MobileUserLoggedIn = ({ user }: { user: NonNullable<CurrentUser> }) => {
  const [open, setOpen] = useState(false)
  const handleLogout = useLogout()
  const hasTodos = useUserHasTodos(user)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Benutzerkonto"
        aria-expanded={open}
        data-testid={playwrightTestId('user-info')}
        className={twMerge(
          mobileControlButtonClassName,
          'relative size-10',
          open && mobileControlButtonActiveClassName,
        )}
      >
        {user.osmAvatar ? (
          <Img
            src={user.osmAvatar}
            width={28}
            height={28}
            className="size-7 rounded-full"
            alt=""
            aria-hidden
          />
        ) : (
          <UserIcon className="size-6 text-gray-600" aria-hidden="true" />
        )}
        {hasTodos && (
          <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-amber-500">
            <span className="sr-only">Es fehlen wichtige Informationen für den Account.</span>
          </span>
        )}
      </button>

      <MobileBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={`Angemeldet als ${user.osmName}`}
      >
        <UserMenuContent user={user} />
        <div className="p-1">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-md px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            Ausloggen
          </button>
        </div>
      </MobileBottomSheet>
    </>
  )
}

const MobileUserLoggedOut = () => {
  const signInHref = useSignInUrl()

  return (
    <a
      href={signInHref}
      aria-label="Anmelden"
      className={twJoin(mobileControlButtonClassName, 'size-10')}
    >
      <ArrowRightEndOnRectangleIcon className="size-6" aria-hidden="true" />
    </a>
  )
}

/**
 * Mobile user control (placed top-right in the MobileMapHeader): an avatar
 * button that opens a bottom sheet with the account info + logout when signed
 * in, or an "Anmelden" button when signed out.
 *
 * The contact-profile prompt and cookie cleanup are NOT rendered here: the
 * desktop header (hidden on mobile via `hidden sm:block`, but still mounted)
 * already owns the `<User>` instances that render them, so adding them here
 * would duplicate the portaled modal.
 */
export const MobileUserMenu = () => {
  const { data } = useQuery(currentUserQueryOptions())
  const user = data?.user ?? null

  return user ? <MobileUserLoggedIn user={user} /> : <MobileUserLoggedOut />
}
