import { useRouter } from '@tanstack/react-router'
import { AdminTrashIconButton } from '@/components/admin/AdminTrashIconButton'
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
    <AdminTrashIconButton
      ariaLabel="Mitgliedschaft in dieser Region entfernen"
      onClick={() => void handleRemove()}
    />
  )
}
