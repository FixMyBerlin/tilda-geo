import { useRouter } from '@tanstack/react-router'
import { twJoin } from 'tailwind-merge'
import { linkStyles } from '@/components/shared/links/styles'
import { toastError } from '@/components/shared/toast/toastError'
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
    try {
      await deleteMembershipFn({ data: { id: membershipId } })
      await router.invalidate()
    } catch (error) {
      toastError(error, 'Mitgliedschaft konnte nicht entfernt werden')
    }
  }

  return (
    <button
      type="button"
      className={twJoin(linkStyles, 'text-sm text-red-700 hover:text-red-900')}
      onClick={() => void handleRemove()}
    >
      Aus Region entfernen
    </button>
  )
}
