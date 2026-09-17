import { CheckBadgeIcon } from '@heroicons/react/24/solid'
import { useQuery } from '@tanstack/react-query'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { Link } from '@/components/shared/links/Link'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { getOsmUrl } from '@/components/shared/utils/getOsmUrl'
import { regionMemberOsmNamesQueryOptions } from '@/server/regions/regionQueryOptions'
import { useRegionSlug } from '../regionUtils/useRegionSlug'

type Props = {
  osmName?: string | null // By definition  this is never null; but our types don't know that
  firstName?: string | null
  lastName?: string | null
  showMembership?: boolean
  showDisplayName?: boolean
}

export const OsmUserLink = ({
  osmName,
  firstName,
  lastName,
  showMembership = true,
  showDisplayName = true,
}: Props) => {
  const hasPermission = useHasPermissions()
  const regionSlug = useRegionSlug()
  const { data: memberOsmNames } = useQuery({
    ...regionMemberOsmNamesQueryOptions(regionSlug),
    enabled: hasPermission && showMembership,
  })
  const displayName = [firstName, lastName].filter(Boolean).join(' ')

  if (!osmName) return <>Eine anonyme Nutzer:in</>

  const isRegionMember = memberOsmNames?.some(
    (memberName) => memberName.toLowerCase() === osmName.toLowerCase(),
  )
  const membershipBadge =
    hasPermission && showMembership && isRegionMember ? (
      <Tooltip as="span" className="items-center" text="Ist Mitarbeiter:in dieser Region">
        <CheckBadgeIcon className="size-4 shrink-0" />
      </Tooltip>
    ) : null

  return (
    <span className={membershipBadge ? 'inline-flex items-center gap-1' : undefined}>
      {showDisplayName && displayName ? <span>{displayName} </span> : null}
      <Link blank href={getOsmUrl(`/user/${osmName}`)}>
        {osmName}
      </Link>
      {membershipBadge}
    </span>
  )
}
