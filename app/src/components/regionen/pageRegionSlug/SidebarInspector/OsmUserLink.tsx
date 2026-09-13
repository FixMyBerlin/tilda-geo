import { CheckBadgeIcon } from '@heroicons/react/24/solid'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { Link } from '@/components/shared/links/Link'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { getOsmUrl } from '@/components/shared/utils/getOsmUrl'

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
  const displayName = [firstName, lastName].filter(Boolean).join(' ')

  if (!osmName) return <>Eine anonyme Nutzer:in</>

  const membershipBadge =
    hasPermission && showMembership ? (
      <Tooltip text="Ist Mitarbeiter:in dieser Region">
        <CheckBadgeIcon className="size-5" />
      </Tooltip>
    ) : null

  return (
    <span className="inline">
      {showDisplayName && displayName ? <>{displayName} </> : null}
      <Link blank href={getOsmUrl(`/user/${osmName}`)}>
        {osmName}
      </Link>
      {membershipBadge ? <> {membershipBadge}</> : null}
    </span>
  )
}
