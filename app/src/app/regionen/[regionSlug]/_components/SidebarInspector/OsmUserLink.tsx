import { Tooltip } from '@/src/app/_components/Tooltip/Tooltip'
import { Link } from '@/src/app/_components/links/Link'
import { getOsmUrl } from '@/src/app/_components/utils/getOsmUrl'
import { useHasPermissions } from '@/src/app/_hooks/useHasPermissions'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'

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
          <CheckBadgeIcon className="h-5 w-5" />
        </Tooltip>
      ) : (
        ''
      )}
    </span>
  )
}
