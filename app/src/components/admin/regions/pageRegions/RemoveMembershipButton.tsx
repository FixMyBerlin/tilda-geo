import { useRouter } from '@tanstack/react-router'
import { linkStyles } from '@/components/shared/links/styles'
import { deleteMembershipFn } from '@/server/memberships/memberships.functions'

type Props = {
  /** Membership row id for this user in the region being edited */
  membershipId: number
}

/**
 * Removes the user's membership in the region being edited only.
 * Does not delete the User row (OSM / Better Auth account stays).
 */
export function RemoveMembershipButton({ membershipId }: Props) {
  const router = useRouter()

  const handleRemove = async () => {
    if (
      !window.confirm(
        `Mitgliedschaft (ID ${membershipId}) in dieser Region unwiderruflich entfernen? Der Benutzer-Account bleibt bestehen.`,
      )
    ) {
      return
    }
    await deleteMembershipFn({ data: { id: membershipId } })
    await router.invalidate()
  }

  return (
    <button type="button" onClick={() => void handleRemove()} className={linkStyles}>
      Mitgliedschaft entfernen
    </button>
  )
}
