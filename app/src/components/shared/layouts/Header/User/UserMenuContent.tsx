import { CheckBadgeIcon } from '@heroicons/react/24/solid'
import { getFullname } from '@/components/admin/memberships/pageMemberships/utils/getFullname'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { useOptionalRegionSlug } from '@/components/shared/hooks/useOptionalRegionSlug'
import { Link } from '@/components/shared/links/Link'
import { hasContactEmail } from '@/components/shared/utils/osmPlaceholderEmail'
import { isAdmin } from '@/components/shared/utils/usersUtils'
import type { CurrentUser } from '@/server/users/queries/getCurrentUser.server'
import { UserLoggedInAdminInfo } from './UserLoggedInAdminInfo'

type Props = {
  user: NonNullable<CurrentUser>
  inHeadlessMenu?: boolean
}

/**
 * The body of the signed-in user menu (account info + admin links), shared by the
 * desktop dropdown (UserLoggedIn) and the mobile user sheet (MobileUserMenu).
 * Callers add their own logout control around it.
 */
export const UserMenuContent = ({ user, inHeadlessMenu = false }: Props) => {
  const isRegionsPage = Boolean(useOptionalRegionSlug())
  const hasPermissions = useHasPermissions()

  const missingContactEmail = !hasContactEmail(user.email)
  const missingOsmDescription = !user.osmDescription?.trim()

  return (
    <>
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700">
        <p className="mb-1">
          <strong>Angemeldet als {user.osmName}</strong>
        </p>
        {isRegionsPage && hasPermissions === false && (
          <p className="my-2 rounded bg-amber-500 p-1 leading-snug">
            Hinweis: Sie haben bisher <strong>keine zusätzlichen Rechte auf dieser Region</strong>.
            Sie können damit alle öffentlichen Daten sehen, aber eventuelle geschützte Daten nicht.
          </p>
        )}
        <div className="mb-1">
          <p className="truncate">
            Name:{' '}
            {getFullname(user) ? (
              getFullname(user)
            ) : (
              <Link
                to="/settings/user"
                classNameOverwrite="text-gray-400 hover:text-blue-500 hover:underline"
              >
                Bitte Name ergänzen…
              </Link>
            )}
          </p>
          <p className="truncate">eMail: {hasContactEmail(user.email) ? user.email : '–'}</p>
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
            <Link to="/settings/user" hash="description-missing" button>
              Account bearbeiten
            </Link>
          </div>
        )}
        {missingContactEmail ? (
          <div className="my-2 rounded bg-amber-500 p-1 leading-snug">
            Für diesen Account ist noch keine E-Mail-Adresse hinterlegt. Diese wird benötigt um
            Nachrichten schicken zu können.
            <br />
            <Link to="/settings/user" button>
              Account bearbeiten
            </Link>
          </div>
        ) : (
          <Link to="/settings/user">Account bearbeiten</Link>
        )}
      </div>
      <UserLoggedInAdminInfo user={user} inHeadlessMenu={inHeadlessMenu} />
    </>
  )
}
