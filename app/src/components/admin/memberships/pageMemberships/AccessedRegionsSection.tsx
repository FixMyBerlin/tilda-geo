import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { adminBulletedListClassName } from '@/components/admin/adminClasses'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { formatRelativeTime } from '@/components/shared/date/relativeTime'
import { Link } from '@/components/shared/links/Link'
import { linkStyles } from '@/components/shared/links/styles'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import type { UserWithMemberships } from '@/server/users/queries/getUsersAndMemberships.server'
import { splitAccessedRegionsByRecency } from './utils/splitAccessedRegionsByRecency'

type Props = {
  user: UserWithMemberships
  /** Stable "30 days ago" timestamp (epoch ms) from the loader — kept out of client render. */
  accessedRegionsCutoffAt: number
}

/** Accessed-regions list on a membership row: recent (30 days) by default, rest behind a toggle. */
export const AccessedRegionsSection = ({ user, accessedRegionsCutoffAt }: Props) => {
  const [showAll, setShowAll] = useState(false)

  if (!user.accessedRegions || user.accessedRegions.length === 0) return null

  const { recent, older } = splitAccessedRegionsByRecency(
    user.accessedRegions,
    accessedRegionsCutoffAt,
  )
  const visibleRegions = showAll ? [...recent, ...older] : recent

  return (
    <div className="mt-4 border-t pt-2">
      <div className="mb-1 font-semibold text-gray-600">Zugriffene Regionen:</div>

      {visibleRegions.length === 0 ? (
        <p className="text-xs text-gray-400">Keine Zugriffe in den letzten 30 Tagen.</p>
      ) : (
        <ul className={twMerge(adminBulletedListClassName, 'text-xs')}>
          {visibleRegions.map((accessedRegion) => {
            const hasAccess = user.memberships?.some((m) => m.region.slug === accessedRegion.slug)
            const relativeTime = formatRelativeTime(accessedRegion.lastAccessedDay)

            return (
              <li key={accessedRegion.slug}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link blank href={`/regionen/${accessedRegion.slug}`} className="font-medium">
                      {accessedRegion.slug}
                    </Link>
                    <Tooltip text={formatDateTimeBerlin(accessedRegion.lastAccessedDay)}>
                      <span className="text-gray-400">zuletzt {relativeTime}</span>
                    </Tooltip>
                  </div>
                  {hasAccess ? (
                    <span className="text-xs text-green-600">Hat Zugriff</span>
                  ) : (
                    <Link
                      to="/admin/memberships/new"
                      search={{ userId: user.id, regionSlug: accessedRegion.slug }}
                      className="text-xs"
                    >
                      Zugriff gewähren
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {older.length > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className={twMerge(linkStyles, 'mt-1 text-xs text-gray-500')}
        >
          {showAll ? 'Weniger anzeigen' : `Alle anzeigen (${older.length})`}
        </button>
      )}
    </div>
  )
}
