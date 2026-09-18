import { Link } from '@tanstack/react-router'
import { HeaderAppLogoWhite } from '@/components/layouts/Header/HeaderApp/HeaderAppLogo'
import { envKey } from '@/components/shared/utils/isEnv'

const envBadgeLabels: Partial<Record<string, string>> = { development: 'DEV', staging: 'STG' }

const pillClassName = 'rounded-full px-2 py-0.5 text-xs/5 font-semibold'

/** Logo + pink “Admin” marker (matches `AdminPanelTrigger`) + DEV/STG badge off production. */
export const AdminBrand = () => {
  const envLabel = envKey ? envBadgeLabels[envKey] : undefined

  return (
    <div className="flex min-w-0 items-center gap-x-2">
      <Link to="/admin" className="flex shrink-0 items-center">
        <HeaderAppLogoWhite />
        <span className="sr-only">Admin-Übersicht</span>
      </Link>
      <span className={`${pillClassName} bg-pink-300 text-pink-950`}>Admin</span>
      {envLabel ? (
        <span className={`${pillClassName} bg-yellow-100 text-gray-900`}>{envLabel}</span>
      ) : null}
    </div>
  )
}
