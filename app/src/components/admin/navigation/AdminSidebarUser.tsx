import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useLogout } from '@/components/layouts/Header/User/useLogout'
import { Img } from '@/components/shared/Img'
import { currentUserQueryOptions } from '@/server/users/currentUserQueryOptions'

const footerLinkClassName =
  'inline-flex items-center gap-x-1 text-sm font-medium text-gray-300 no-underline hover:text-white'

export const AdminSidebarUser = () => {
  const { data } = useSuspenseQuery(currentUserQueryOptions())
  const handleLogout = useLogout()
  const user = data.user
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  const displayName = fullName || user?.osmName || 'Unbekannt'

  return (
    <div className="border-t border-gray-700 px-6 py-4">
      <div className="flex items-center gap-x-3 text-sm/6 font-semibold text-white">
        {user?.osmAvatar ? (
          <Img
            src={user.osmAvatar}
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-full bg-gray-700"
            alt=""
            aria-hidden
          />
        ) : (
          <UserCircleIcon aria-hidden="true" className="size-8 shrink-0 text-gray-400" />
        )}
        <span className="truncate">{displayName}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 pl-11">
        <button type="button" onClick={handleLogout} className={footerLinkClassName}>
          Abmelden
        </button>
        <Link to="/" target="_blank" rel="noopener noreferrer" className={footerLinkClassName}>
          Zur Startseite
          <ArrowTopRightOnSquareIcon aria-hidden="true" className="size-4 shrink-0" />
          <span className="sr-only"> (neues Fenster)</span>
        </Link>
      </div>
    </div>
  )
}
