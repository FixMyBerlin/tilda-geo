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
}

export const OsmUserLink = ({ osmName, firstName, lastName, showMembership = true }: Props) => {
  const hasPermission = useHasPermissions()

  if (!osmName) return <>Eine anonyme Nutzer:in</>

  return (
    <span className="inline-flex items-center gap-1">
      {firstName} {lastName}
      <Link blank href={getOsmUrl(`/user/${osmName}`)}>
        {osmName}{' '}
      </Link>{' '}
      {hasPermission && showMembership ? (
        <Tooltip text="Ist Mitarbeiter:in dieser Region">
          <CheckBadgeIcon className="size-5" />
        </Tooltip>
      ) : (
        ''
      )}
    </span>
  )
}
